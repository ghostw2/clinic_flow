package handlers

import (
	"errors"

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
		response.BadRequest(c, "validation.invalid_input")
		return
	}

	apptID, err := uuid.Parse(req.AppointmentID)
	if err != nil {
		response.BadRequest(c, "validation.invalid_id")
		return
	}

	notif, err := services.SendNotification(apptID, clinicID, req.Type)
	if err != nil {
		if errors.Is(err, services.ErrNotFound) {
			response.NotFound(c, "appointment.not_found")
			return
		}
		response.InternalError(c, "generic.internal_error")
		return
	}

	response.OK(c, notif.ToResponse())
}
