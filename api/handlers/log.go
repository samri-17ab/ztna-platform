package handlers

import (
	"github.com/gofiber/fiber/v2"
	"github.com/ztna-platform/api/models"
	"github.com/ztna-platform/api/services"
)

// ListAuditLogs returns the most recent 100 audit entries
func ListAuditLogs(c *fiber.Ctx) error {
	var logs []models.AuditLog

	if services.DB != nil {
		services.DB.Order("created_at desc").Limit(100).Find(&logs)
	}

	return c.JSON(logs)
}
