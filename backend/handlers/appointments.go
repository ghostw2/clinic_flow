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
		response.BadRequest(c, err.Error())
		return
	}

	if q.DoctorID != "" {
		if _, err := uuid.Parse(q.DoctorID); err != nil {
			response.BadRequest(c, "invalid doctor_id")
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

	apptID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		response.BadRequest(c, "invalid appointment id")
		return
	}

	var req UpdateAppointmentRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, err.Error())
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

	apptID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		response.BadRequest(c, "invalid appointment id")
		return
	}

	if err := services.DeleteAppointment(apptID.String(), clinicID); err != nil {
		if errors.Is(err, services.ErrNotFound) {
			response.NotFound(c, "appointment not found")
			return
		}
		response.InternalError(c, "failed to delete appointment")
		return
	}

	response.Message(c, "appointment deleted")
}
