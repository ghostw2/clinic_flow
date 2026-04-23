package handlers

import (
	"errors"
	"net/http"

	"github.com/clinicflow/backend/pkg/response"
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
		response.BadRequest(c, err.Error())
		return
	}

	apptID, err := uuid.Parse(req.AppointmentID)
	if err != nil {
		response.BadRequest(c, "invalid appointment_id")
		return
	}

	notif, err := services.SendNotification(apptID, clinicID, req.Type)
	if err != nil {
		if errors.Is(err, services.ErrNotFound) {
			response.NotFound(c, "appointment not found")
			return
		}
		response.ErrDetail(c, http.StatusInternalServerError, "notification failed to send", err.Error())
		return
	}

	response.OK(c, notif)
}
