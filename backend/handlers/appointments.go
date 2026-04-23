package handlers

import (
	"errors"

	"github.com/clinicflow/backend/models"
	"github.com/clinicflow/backend/pkg/response"
	"github.com/clinicflow/backend/repositories"
	"github.com/clinicflow/backend/services"
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

type CreateAppointmentRequest struct {
	PatientID string `json:"patient_id" binding:"required"`
	DoctorID  string `json:"doctor_id" binding:"required"`
	Datetime  string `json:"datetime" binding:"required"`
	Duration  int    `json:"duration"`
	Notes     string `json:"notes"`
}

type UpdateAppointmentRequest struct {
	DoctorID string `json:"doctor_id"`
	Datetime string `json:"datetime"`
	Duration int    `json:"duration"`
	Status   string `json:"status"`
	Notes    string `json:"notes"`
}

// GET /api/appointments
func GetAppointments(c *gin.Context) {
	clinicID := c.MustGet("clinic_id").(uuid.UUID)
	role, _ := c.Get("role")
	userID, _ := c.Get("user_id")

	f := repositories.AppointmentFilters{
		Date:       c.Query("date"),
		Status:     c.Query("status"),
		DoctorID:   c.Query("doctor_id"),
		OnlyDoctor: role == string(models.RoleDoctor),
		UserID:     userID.(uuid.UUID),
	}

	appointments, err := services.ListAppointments(clinicID, f)
	if err != nil {
		response.InternalError(c, "failed to fetch appointments")
		return
	}

	response.OK(c, appointments)
}

// POST /api/appointments
func CreateAppointment(c *gin.Context) {
	clinicID := c.MustGet("clinic_id").(uuid.UUID)

	var req CreateAppointmentRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, err.Error())
		return
	}

	appt, err := services.CreateAppointment(clinicID, services.CreateAppointmentInput{
		PatientID: req.PatientID,
		DoctorID:  req.DoctorID,
		Datetime:  req.Datetime,
		Duration:  req.Duration,
		Notes:     req.Notes,
	})
	if err != nil {
		if errors.Is(err, services.ErrConflict) {
			response.Conflict(c, "doctor already has an appointment in this time slot")
			return
		}
		response.BadRequest(c, err.Error())
		return
	}

	response.Created(c, appt)
}

// PUT /api/appointments/:id
func UpdateAppointment(c *gin.Context) {
	clinicID := c.MustGet("clinic_id").(uuid.UUID)

	var req UpdateAppointmentRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, err.Error())
		return
	}

	appt, err := services.UpdateAppointment(c.Param("id"), clinicID, services.UpdateAppointmentInput{
		DoctorID: req.DoctorID,
		Datetime: req.Datetime,
		Duration: req.Duration,
		Status:   req.Status,
		Notes:    req.Notes,
	})
	if err != nil {
		if errors.Is(err, services.ErrNotFound) {
			response.NotFound(c, "appointment not found")
			return
		}
		response.BadRequest(c, err.Error())
		return
	}

	response.OK(c, appt)
}

// DELETE /api/appointments/:id
func DeleteAppointment(c *gin.Context) {
	clinicID := c.MustGet("clinic_id").(uuid.UUID)

	if err := services.DeleteAppointment(c.Param("id"), clinicID); err != nil {
		if errors.Is(err, services.ErrNotFound) {
			response.NotFound(c, "appointment not found")
			return
		}
		response.InternalError(c, "failed to delete appointment")
		return
	}

	response.Message(c, "appointment deleted")
}
