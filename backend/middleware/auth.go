package middleware

import (
	"github.com/clinicflow/backend/pkg/response"
	"github.com/clinicflow/backend/services"
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

const SessionCookie = "clinicflow_session"

func AuthRequired() gin.HandlerFunc {
	return func(c *gin.Context) {
		sessionID, err := c.Cookie(SessionCookie)
		if err != nil || sessionID == "" {
			response.Abort(c, 401, "auth.not_authenticated")
			return
		}

		session, err := services.GetSession(sessionID)
		if err != nil {
			response.Abort(c, 401, "auth.session_expired")
			return
		}

		c.Set("session_id", session.ID)
		c.Set("user_id", session.UserID)
		c.Set("clinic_id", session.ClinicID)
		c.Set("role", session.Role)
		c.Next()
	}
}

func RequireRole(roles ...string) gin.HandlerFunc {
	return func(c *gin.Context) {
		role, _ := c.Get("role")
		for _, r := range roles {
			if role == r {
				c.Next()
				return
			}
		}
		response.Abort(c, 403, "auth.unauthorized")
	}
}

// LoadClinicPermissions loads the clinic's permission map into context once per request.
// Must run after AuthRequired.
func LoadClinicPermissions() gin.HandlerFunc {
	return func(c *gin.Context) {
		role, _ := c.Get("role")
		if role == "admin" {
			c.Next()
			return
		}
		clinicID := c.MustGet("clinic_id").(uuid.UUID)
		perms, err := services.GetPermissions(clinicID)
		if err != nil {
			perms = services.DefaultPermissions
		}
		c.Set("clinic_perms", perms)
		c.Next()
	}
}

// RequirePermission checks that the authenticated user's role is allowed to perform action.
// Admin always passes. Requires LoadClinicPermissions to have run first.
func RequirePermission(action string) gin.HandlerFunc {
	return func(c *gin.Context) {
		role, _ := c.Get("role")
		if role == "admin" {
			c.Next()
			return
		}
		permsRaw, exists := c.Get("clinic_perms")
		if !exists {
			response.Abort(c, 403, "auth.permission_denied")
			return
		}
		perms, ok := permsRaw.(map[string][]string)
		if !ok || !services.HasPermission(perms, role.(string), action) {
			response.Abort(c, 403, "auth.permission_denied")
			return
		}
		c.Next()
	}
}
