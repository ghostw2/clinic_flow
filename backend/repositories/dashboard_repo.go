package repositories

import (
	"time"

	"github.com/clinicflow/backend/database"
	"github.com/clinicflow/backend/models"
	"github.com/google/uuid"
)

type DashboardFilters struct {
	OnlyDoctor bool
	UserID     uuid.UUID
}

func CountAppointments(clinicID uuid.UUID, f DashboardFilters, start, end *time.Time, status models.AppointmentStatus) (int64, error) {
	q := database.DB.Model(&models.Appointment{}).
		Where("clinic_id = ? AND deleted_at IS NULL", clinicID)
	if f.OnlyDoctor {
		q = q.Where("doctor_id = ?", f.UserID)
	}
	if start != nil {
		q = q.Where("datetime >= ?", *start)
	}
	if end != nil {
		q = q.Where("datetime < ?", *end)
	}
	if status != "" {
		q = q.Where("status = ?", status)
	}
	var count int64
	return count, q.Count(&count).Error
}

func GetUpcomingAppointments(clinicID uuid.UUID, f DashboardFilters, from time.Time, limit int) ([]models.Appointment, error) {
	q := database.DB.
		Preload("Patient").
		Preload("Doctor").
		Where("clinic_id = ? AND deleted_at IS NULL AND datetime >= ? AND status != ?",
			clinicID, from, models.StatusCancelled)
	if f.OnlyDoctor {
		q = q.Where("doctor_id = ?", f.UserID)
	}
	var upcoming []models.Appointment
	err := q.Order("datetime ASC").Limit(limit).Find(&upcoming).Error
	return upcoming, err
}
