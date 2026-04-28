package middleware

import (
	"strings"

	"github.com/gofiber/fiber/v2"
	"github.com/golang-jwt/jwt/v5"
)

// AuthRequired is the middleware to protect routes with JWT
func AuthRequired() fiber.Handler {
	return func(c *fiber.Ctx) error {
		authHeader := c.Get("Authorization")
		if authHeader == "" {
			// log.Printf("[Auth Debug] Missing Authorization header for %s", c.Path())
			return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
				"error": "Missing authorization header",
			})
		}

		tokenString := strings.TrimPrefix(authHeader, "Bearer ")
		if tokenString == authHeader {
			return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
				"error": "Invalid token format (expected Bearer <token>)",
			})
		}

		// In a real implementation, we would validate the signature using Keycloak's JWKS.
		// For this demo/scaffold, we will parse the token and extract claims if validly structured.
		// Note: Keycloak tokens are standard JWTs.
		token, _, err := new(jwt.Parser).ParseUnverified(tokenString, jwt.MapClaims{})
		if err != nil {
			return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
				"error": "Failed to parse identity token",
			})
		}

		claims, ok := token.Claims.(jwt.MapClaims)
		if !ok {
			return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
				"error": "Invalid token claims",
			})
		}

		// Map Keycloak standard claims to SpecterNAC context
		// role is usually in 'realm_access.roles' or 'resource_access'
		var role string = "Guest"
		if realmAccess, ok := claims["realm_access"].(map[string]interface{}); ok {
			if roles, ok := realmAccess["roles"].([]interface{}); ok {
				for _, r := range roles {
					if r == "Admin" || r == "Dev" || r == "SecOps" {
						role = r.(string)
						break
					}
				}
			}
		}

		// Inject into local context for handlers to use
		c.Locals("user_id", claims["sub"])
		c.Locals("user_role", role)
		c.Locals("user_email", claims["email"])
		c.Locals("user_name", claims["name"])

		return c.Next()
	}
}
