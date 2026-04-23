package handlers

import (
	"github.com/clinicflow/backend/pkg/response"
	"github.com/clinicflow/backend/services"
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

// GET /api/dashboard/stats
func GetDashboardStats(c *gin.Context) {
	clinicID := c.MustGet("clinic_id").(uuid.UUID)
	role, _ := c.Get("role")
	userID, _ := c.Get("user_id")

	stats, err := services.GetDashboardStats(clinicID, role.(string), userID.(uuid.UUID))
	if err != nil {
		response.InternalError(c, "failed to fetch stats")
		return
	}

	response.OK(c, stats)
}
