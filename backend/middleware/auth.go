package middleware

import (
	"net/http"

	"github.com/clinicflow/backend/services"
	"github.com/gin-gonic/gin"
)

const SessionCookie = "clinicflow_session"

func AuthRequired() gin.HandlerFunc {
	return func(c *gin.Context) {
		sessionID, err := c.Cookie(SessionCookie)
		if err != nil || sessionID == "" {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "not authenticated"})
			return
		}

		session, err := services.GetSession(sessionID)
		if err != nil {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "session expired or invalid"})
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
		c.AbortWithStatusJSON(http.StatusForbidden, gin.H{"error": "insufficient permissions"})
	}
}
