package handlers

import (
	"log"
	"strconv"
	"strings"
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
	"github.com/ztna-platform/api/models"
	"github.com/ztna-platform/api/services"
)

// EvaluateAccessRequest is the payload sent by Radius or the Switch
type EvaluateAccessRequest struct {
	MACAddress string `json:"mac_address"`
	SwitchIP   string `json:"switch_ip"`
	Port       string `json:"port"`
	Username   string `json:"username"` // Extracted from 802.1X
}

// EvaluateAccess is the core Module 5 Engine
func EvaluateAccess(c *fiber.Ctx) error {
	req := new(EvaluateAccessRequest)
	if err := c.BodyParser(req); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "bad request"})
	}

	// 1. Gather Context
	var user map[string]string
	var dbUserID *uuid.UUID

	// Check if user is already authenticated via JWT (Management Dashboard)
	if jwtUID, _ := c.Locals("user_id").(string); jwtUID != "" {
		role, _ := c.Locals("user_role").(string)
		email, _ := c.Locals("user_email").(string)
		
		user = map[string]string{
			"role":       role,
			"department": "IT", // Default for dashboard admins or fetch from claims
			"email":      email,
		}
		if uid, err := uuid.Parse(jwtUID); err == nil {
			dbUserID = &uid
		}
	} else if services.DB != nil {
		// Fallback for Radius/NAC requests (Lookup by Username)
		var dbUser models.User
		if result := services.DB.Where("email = ? OR full_name = ?", req.Username, req.Username).First(&dbUser); result.Error == nil {
			user = map[string]string{
				"role":       dbUser.Role,
				"department": dbUser.Department,
			}
			dbUserID = &dbUser.ID
		}
	}

	if user == nil {
		user = map[string]string{
			"role":       "Guest",
			"department": "None",
		}
	}

	var riskScore int = 100
	var postureStatus string = "Untrusted"
	if services.DB != nil {
		var dbDevice models.Device
		if result := services.DB.Where("mac_address = ?", req.MACAddress).First(&dbDevice); result.Error == nil {
			riskScore = dbDevice.LastRiskScore
			postureStatus = dbDevice.PostureStatus
		}
	}

	hour := time.Now().Hour()
	location := "US"
	if req.SwitchIP == "192.168.100.1" {
		location = "Internal"
	}

	// 2. Check DB Policies First (UI-created rules)
	if services.DB != nil {
		var dbPolicies []models.Policy
		services.DB.Where("is_active = ?", true).Order("priority asc").Find(&dbPolicies)

		for _, p := range dbPolicies {
			if evaluateCondition(p.Condition, user, riskScore, hour) {
				log.Printf("DB Policy matched: %s -> %s", p.Name, p.Action)
				// Update device with source
				services.DB.Model(&models.Device{}).Where("mac_address = ?", req.MACAddress).Update("last_policy_source", "db_policy")
				
				// Audit Log Entry
				audit := models.AuditLog{
					EventType:   "access_decision",
					MACAddress:  req.MACAddress,
					UserID:      dbUserID,
					SwitchIP:    req.SwitchIP,
					RiskScore:   riskScore,
					ActionTaken: p.Action,
					Reason:      p.Description + " (DB Policy)",
				}
				services.DB.Create(&audit)
				
				return c.JSON(fiber.Map{
					"decision": p.Action,
					"reason":   p.Description,
					"mac":      req.MACAddress,
					"source":   "db_policy",
				})
			}
		}
	}

	// 3. Fallback: Call Open Policy Agent for static Rego rules
	contextData := map[string]interface{}{
		"user": user,
		"device": map[string]interface{}{
			"risk":    riskScore,
			"posture": postureStatus,
			"mac":     req.MACAddress,
		},
		"network": map[string]string{
			"switch": req.SwitchIP,
		},
		"context": map[string]interface{}{
			"time_of_day": hour,
			"location":    location,
		},
	}

	decision, err := services.QueryOPA(contextData)
	if err != nil {
		log.Printf("OPA Error: %v", err)
		return c.Status(500).JSON(fiber.Map{"error": "policy engine failure"})
	}

	// Update device with source
	if services.DB != nil {
		services.DB.Model(&models.Device{}).Where("mac_address = ?", req.MACAddress).Update("last_policy_source", "opa_static")

		// Audit Log Entry
		audit := models.AuditLog{
			EventType:   "access_decision",
			MACAddress:  req.MACAddress,
			UserID:      dbUserID,
			SwitchIP:    req.SwitchIP,
			RiskScore:   riskScore,
			ActionTaken: decision.Action,
			Reason:      decision.Reason + " (OPA Static)",
		}
		services.DB.Create(&audit)
	}

	return c.JSON(fiber.Map{
		"decision": decision.Action,
		"reason":   decision.Reason,
		"mac":      req.MACAddress,
		"source":   "opa_static",
	})
}

// evaluateCondition parses a simple condition string from the UI
// and checks it against the current request context.
// Supports: user.role == 'X', user.department == 'X',
//           device.risk < N, device.risk > N, context.time < N, context.time > N
//           Combined with && for AND logic.
func evaluateCondition(condition string, user map[string]string, risk int, hour int) bool {
	// Split on && for AND conditions
	parts := strings.Split(condition, "&&")

	for _, part := range parts {
		part = strings.TrimSpace(part)
		if part == "" {
			continue
		}

		if !evaluateSingleCondition(part, user, risk, hour) {
			return false
		}
	}

	return len(parts) > 0
}

func evaluateSingleCondition(cond string, user map[string]string, risk int, hour int) bool {
	cond = strings.TrimSpace(cond)

	// Handle == comparisons (string fields)
	if strings.Contains(cond, "==") {
		sides := strings.SplitN(cond, "==", 2)
		if len(sides) != 2 {
			return false
		}
		field := strings.TrimSpace(sides[0])
		expected := strings.TrimSpace(sides[1])
		expected = strings.Trim(expected, "'\"")

		switch field {
		case "user.role":
			return user["role"] == expected
		case "user.department":
			return user["department"] == expected
		}
	}

	// Handle < comparisons (numeric fields)
	if strings.Contains(cond, "<") {
		sides := strings.SplitN(cond, "<", 2)
		if len(sides) != 2 {
			return false
		}
		field := strings.TrimSpace(sides[0])
		valStr := strings.TrimSpace(sides[1])
		threshold, err := strconv.Atoi(valStr)
		if err != nil {
			return false
		}

		switch field {
		case "device.risk":
			return risk < threshold
		case "context.time":
			return hour < threshold
		}
	}

	// Handle > comparisons (numeric fields)
	if strings.Contains(cond, ">") {
		sides := strings.SplitN(cond, ">", 2)
		if len(sides) != 2 {
			return false
		}
		field := strings.TrimSpace(sides[0])
		valStr := strings.TrimSpace(sides[1])
		threshold, err := strconv.Atoi(valStr)
		if err != nil {
			return false
		}

		switch field {
		case "device.risk":
			return risk > threshold
		case "context.time":
			return hour > threshold
		}
	}

	return false
}
