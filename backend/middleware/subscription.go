package middleware

import (
	"github.com/clinicflow/backend/pkg/response"
	"github.com/clinicflow/backend/repositories"
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

// RequireSubscription blocks the request with 402 if the clinic does not have
// an active Stripe subscription. Apply after AuthRequired.
func RequireSubscription() gin.HandlerFunc {
	return func(c *gin.Context) {
		clinicID := c.MustGet("clinic_id").(uuid.UUID)

		clinic, err := repositories.GetClinicByID(clinicID)
		if err != nil || clinic.SubscriptionStatus != "active" {
			response.Abort(c, 402, "active subscription required")
			return
		}

		c.Next()
	}
}
