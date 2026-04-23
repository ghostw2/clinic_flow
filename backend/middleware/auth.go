package middleware

import (
	"github.com/clinicflow/backend/pkg/response"
	"github.com/clinicflow/backend/services"
	"github.com/gin-gonic/gin"
)

const SessionCookie = "clinicflow_session"

func AuthRequired() gin.HandlerFunc {
	return func(c *gin.Context) {
		sessionID, err := c.Cookie(SessionCookie)
		if err != nil || sessionID == "" {
			response.Abort(c, 401, "not authenticated")
			return
		}

		session, err := services.GetSession(sessionID)
		if err != nil {
			response.Abort(c, 401, "session expired or invalid")
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
		response.Abort(c, 403, "insufficient permissions")
	}
}
