package handlers

import (
	"errors"
	"net/http"

	"github.com/clinicflow/backend/services"
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

type SendNotificationRequest struct {
	AppointmentID string `json:"appointment_id" binding:"required"`
	Type          string `json:"type" binding:"required,oneof=email sms"`
}

// POST /api/notifications/send
func SendNotification(c *gin.Context) {
	clinicID := c.MustGet("clinic_id").(uuid.UUID)

	var req SendNotificationRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	apptID, err := uuid.Parse(req.AppointmentID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid appointment_id"})
		return
	}

	notif, err := services.SendNotification(apptID, clinicID, req.Type)
	if err != nil {
		if errors.Is(err, services.ErrNotFound) {
			c.JSON(http.StatusNotFound, gin.H{"error": "appointment not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "notification failed to send", "detail": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "notification sent", "notification": notif})
}
