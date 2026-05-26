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

type GetAppointmentsQuery struct {
	Date     string `form:"date"`
	Status   string `form:"status"`
	DoctorID string `form:"doctor_id"`
}

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

	var q GetAppointmentsQuery
	if err := c.ShouldBindQuery(&q); err != nil {
		response.BadRequest(c, "validation.invalid_input")
		return
	}

	if q.DoctorID != "" {
		if _, err := uuid.Parse(q.DoctorID); err != nil {
			response.BadRequest(c, "validation.invalid_id")
			return
		}
	}

	f := repositories.AppointmentFilters{
		Date:       q.Date,
		Status:     q.Status,
		DoctorID:   q.DoctorID,
		OnlyDoctor: role == string(models.RoleDoctor),
		UserID:     userID.(uuid.UUID),
	}

	appointments, err := services.ListAppointments(clinicID, f)
	if err != nil {
		response.InternalError(c, "appointment.fetch_failed")
		return
	}

	response.OK(c, models.AppointmentsToResponse(appointments))
}

// POST /api/appointments
func CreateAppointment(c *gin.Context) {
	clinicID := c.MustGet("clinic_id").(uuid.UUID)

	var req CreateAppointmentRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, "validation.invalid_input")
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
			response.Conflict(c, "appointment.time_conflict")
			return
		}
		response.BadRequest(c, "appointment.create_failed")
		return
	}

	response.Created(c, appt.ToResponse())
}

// PUT /api/appointments/:id
func UpdateAppointment(c *gin.Context) {
	clinicID := c.MustGet("clinic_id").(uuid.UUID)

	apptID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		response.BadRequest(c, "validation.invalid_id")
		return
	}

	var req UpdateAppointmentRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, "validation.invalid_input")
		return
	}

	appt, err := services.UpdateAppointment(apptID.String(), clinicID, services.UpdateAppointmentInput{
		DoctorID: req.DoctorID,
		Datetime: req.Datetime,
		Duration: req.Duration,
		Status:   req.Status,
		Notes:    req.Notes,
	})
	if err != nil {
		if errors.Is(err, services.ErrNotFound) {
			response.NotFound(c, "appointment.not_found")
			return
		}
		response.BadRequest(c, "appointment.update_failed")
		return
	}

	response.OK(c, appt.ToResponse())
}

// DELETE /api/appointments/:id
func DeleteAppointment(c *gin.Context) {
	clinicID := c.MustGet("clinic_id").(uuid.UUID)

	apptID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		response.BadRequest(c, "validation.invalid_id")
		return
	}

	if err := services.DeleteAppointment(apptID.String(), clinicID); err != nil {
		if errors.Is(err, services.ErrNotFound) {
			response.NotFound(c, "appointment.not_found")
			return
		}
		response.InternalError(c, "appointment.delete_failed")
		return
	}

	response.Message(c, "appointment deleted")
}
