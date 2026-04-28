package main

import (
	"log"
	"os"

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/logger"
	"github.com/gofiber/fiber/v2/middleware/recover"

	"github.com/ztna-platform/api/handlers"
	"github.com/ztna-platform/api/middleware"
	"github.com/ztna-platform/api/services"
)

func main() {
	// Initialize the web framework
	app := fiber.New()

	// Middleware
	app.Use(logger.New())
	app.Use(recover.New())

	// Initialize internal services
	services.InitDB()
	services.InitRedis()
	services.InitOPA(os.Getenv("OPA_URL"))
	
	// Sync existing DB policies to Open Policy Agent on boot
	handlers.TriggerOPASync()

	// ----------------------------------------
	// API Routes
	// ----------------------------------------
	api := app.Group("/api/v1")

	// 1. Authentication Module (Wrapper for Keycloak/IdP)
	auth := api.Group("/auth")
	auth.Post("/login", handlers.Login)

	// 2 & 3. Device Posture & Risk Scoring
	devices := api.Group("/devices")
	devices.Post("/posture", handlers.ReportPosture) // Public for Agent

	// Management Group (Protected by JWT)
	mgmt := api.Group("/", middleware.AuthRequired())

	devicesMgmt := mgmt.Group("/devices")
	devicesMgmt.Get("", handlers.ListDevices)
	devicesMgmt.Post("/", handlers.RegisterDevice)
	devicesMgmt.Put("/:mac", handlers.UpdateDevice)
	devicesMgmt.Get("/:mac/risk", handlers.GetDeviceRisk)
	devicesMgmt.Post("/:mac/quarantine", handlers.QuarantineDevice)

	// 4 & 5. Policy Management (CRUD)
	policies := mgmt.Group("/policies")
	policies.Post("/", handlers.CreatePolicy)
	policies.Get("", handlers.ListPolicies)
	policies.Put("/:id", handlers.UpdatePolicy)

	// 6. Access Decision Generation (Public/Radius)
	access := api.Group("/access")
	access.Post("/evaluate", handlers.EvaluateAccess)

	// 7. Continuous Monitoring (Protected by JWT)
	monitoring := mgmt.Group("/monitoring")
	monitoring.Post("/events", handlers.IngestNetworkEvent)
	monitoring.Get("/logs", handlers.ListAuditLogs)

	// 8. User Management (Protected by JWT)
	users := mgmt.Group("/users")
	users.Get("", handlers.ListUsers)
	users.Put("/:id", handlers.UpdateUser)
	users.Delete("/:id", handlers.DeleteUser)


	// Health Check
	app.Get("/health", func(c *fiber.Ctx) error {
		return c.JSON(fiber.Map{"status": "ok", "message": "ZTNA API Gateway is running"})
	})

	log.Fatal(app.Listen(":8000"))
}
