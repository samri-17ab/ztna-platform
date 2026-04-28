package handlers

import (
	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
	"github.com/ztna-platform/api/models"
	"github.com/ztna-platform/api/services"
)

// ListUsers returns all users with their device counts
func ListUsers(c *fiber.Ctx) error {
	var users []models.User
	if services.DB == nil {
		return c.Status(500).JSON(fiber.Map{"error": "Database not initialized"})
	}

	// Preload devices to get counts
	services.DB.Preload("Devices").Find(&users)

	response := []fiber.Map{}
	for _, u := range users {
		response = append(response, fiber.Map{
			"id":          u.ID,
			"email":       u.Email,
			"full_name":   u.FullName,
			"department":  u.Department,
			"role":        u.Role,
			"status":      u.Status,
			"device_count": len(u.Devices),
		})
	}

	return c.JSON(response)
}

// UpdateUser handles updating user attributes
func UpdateUser(c *fiber.Ctx) error {
	id := c.Params("id")
	userUUID, err := uuid.Parse(id)
	if err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Invalid user ID"})
	}

	type UserUpdate struct {
		Role       string `json:"role"`
		Department string `json:"department"`
		Status     string `json:"status"`
	}

	input := new(UserUpdate)
	if err := c.BodyParser(input); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Invalid input"})
	}

	var user models.User
	if result := services.DB.First(&user, userUUID); result.Error != nil {
		return c.Status(404).JSON(fiber.Map{"error": "User not found"})
	}

	if input.Role != "" {
		user.Role = input.Role
	}
	if input.Department != "" {
		user.Department = input.Department
	}
	if input.Status != "" {
		user.Status = input.Status
	}

	services.DB.Save(&user)

	return c.JSON(fiber.Map{
		"message": "User updated successfully",
		"user":    user,
	})
}

// DeleteUser removes/suspends a user (Soft delete simulation via status)
func DeleteUser(c *fiber.Ctx) error {
	id := c.Params("id")
	userUUID, err := uuid.Parse(id)
	if err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Invalid user ID"})
	}

	if result := services.DB.Model(&models.User{}).Where("id = ?", userUUID).Update("status", "Suspended"); result.Error != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Failed to suspend user"})
	}

	return c.JSON(fiber.Map{"message": "User suspended successfully"})
}
