package handlers

import (
	"net/http"

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
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to fetch stats"})
		return
	}

	c.JSON(http.StatusOK, stats)
}
