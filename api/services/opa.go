package services

import (
	"bytes"
	"encoding/json"
	"errors"
	"fmt"
	"log"
	"net/http"

	"github.com/ztna-platform/api/models"
)

var opaEndpoint string
var opaBaseURL string

type OPADecision struct {
	Action string `json:"action"`
	Reason string `json:"reason"`
}

type OPAResult struct {
	Result OPADecision `json:"result"`
}

func InitOPA(url string) {
	if url == "" {
		url = "http://localhost:8181"
	}
	opaBaseURL = url
	// The path to our specific policy package inside OPA
	opaEndpoint = url + "/v1/data/ztna/access"
	log.Printf("OPA Service initialized at %s", opaEndpoint)
}

// QueryOPA hits the external Open Policy Agent container via REST
func QueryOPA(inputContext map[string]interface{}) (*OPADecision, error) {
	payload := map[string]interface{}{
		"input": inputContext,
	}

	jsonData, err := json.Marshal(payload)
	if err != nil {
		return nil, err
	}

	resp, err := http.Post(opaEndpoint, "application/json", bytes.NewBuffer(jsonData))
	if err != nil {
		// Fallback to safe default if OPA is unreachable
		return &OPADecision{Action: "DENY", Reason: "Policy engine unreachable"}, nil
	}
	defer resp.Body.Close()

	if resp.StatusCode != 200 {
		return nil, errors.New("OPA returned non-200 status")
	}

	var opaResponse OPAResult
	if err := json.NewDecoder(resp.Body).Decode(&opaResponse); err != nil {
		return nil, err
	}

	// Handle case where OPA returns null result (no matching physical policy)
	if opaResponse.Result.Action == "" {
		return &OPADecision{Action: "DENY", Reason: "Implicit deny (no matching policy)"}, nil
	}

	return &opaResponse.Result, nil
}

// SyncPoliciesToOPA pushes active DB policies as structured JSON data to OPA.
// The static policy.rego file will read from data.ztna.db_policies to evaluate them.
func SyncPoliciesToOPA(policies []models.Policy) error {
	type OPAPolicy struct {
		Name        string `json:"name"`
		Condition   string `json:"condition"`
		Action      string `json:"action"`
		Description string `json:"description"`
		Priority    int    `json:"priority"`
	}

	var activePolicies []OPAPolicy
	for _, p := range policies {
		if !p.IsActive {
			continue
		}
		activePolicies = append(activePolicies, OPAPolicy{
			Name:        p.Name,
			Condition:   p.Condition,
			Action:      p.Action,
			Description: p.Description,
			Priority:    p.Priority,
		})
	}

	jsonData, err := json.Marshal(activePolicies)
	if err != nil {
		return err
	}

	log.Printf("Syncing %d policies to OPA data store", len(activePolicies))

	// Push to OPA Data API: PUT /v1/data/ztna/db_policies
	url := opaBaseURL + "/v1/data/ztna/db_policies"

	req, err := http.NewRequest(http.MethodPut, url, bytes.NewBuffer(jsonData))
	if err != nil {
		return err
	}
	req.Header.Set("Content-Type", "application/json")

	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		return err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusNoContent && resp.StatusCode != http.StatusOK {
		return fmt.Errorf("failed to sync policies to OPA, status: %d", resp.StatusCode)
	}

	log.Printf("Successfully synced %d policies to OPA", len(activePolicies))
	return nil
}
