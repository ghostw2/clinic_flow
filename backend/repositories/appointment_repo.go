package repositories

import (
	"time"

	"github.com/clinicflow/backend/database"
	"github.com/clinicflow/backend/models"
	"github.com/google/uuid"
)

type AppointmentFilters struct {
	Date       string
	Status     string
	DoctorID   string
	OnlyDoctor bool
	UserID     uuid.UUID
}

func GetAppointments(clinicID uuid.UUID, f AppointmentFilters) ([]models.Appointment, error) {
	query := database.DB.
		Preload("Patient").
		Preload("Doctor").
		Where("appointments.clinic_id = ? AND appointments.deleted_at IS NULL", clinicID)

	if f.OnlyDoctor {
		query = query.Where("appointments.doctor_id = ?", f.UserID)
	}
	if f.Date != "" {
		t, err := time.Parse("2006-01-02", f.Date)
		if err == nil {
			query = query.Where("appointments.datetime >= ? AND appointments.datetime < ?", t, t.Add(24*time.Hour))
		}
	}
	if f.Status != "" {
		query = query.Where("appointments.status = ?", f.Status)
	}
	if f.DoctorID != "" {
		query = query.Where("appointments.doctor_id = ?", f.DoctorID)
	}

	var appointments []models.Appointment
	err := query.Order("appointments.datetime ASC").Find(&appointments).Error
	return appointments, err
}

func GetAppointmentByID(id string, clinicID uuid.UUID) (models.Appointment, error) {
	var appt models.Appointment
	err := database.DB.
		Where("id = ? AND clinic_id = ? AND deleted_at IS NULL", id, clinicID).
		First(&appt).Error
	return appt, err
}

func GetAppointmentWithRelations(id string, clinicID uuid.UUID) (models.Appointment, error) {
	var appt models.Appointment
	err := database.DB.
		Preload("Patient").
		Preload("Doctor").
		Preload("Doctor.Clinic").
		Where("id = ? AND clinic_id = ? AND deleted_at IS NULL", id, clinicID).
		First(&appt).Error
	return appt, err
}

func HasConflict(doctorID uuid.UUID, start, end time.Time) (bool, error) {
	var count int64
	err := database.DB.Model(&models.Appointment{}).
		Where(`doctor_id = ? AND deleted_at IS NULL AND status NOT IN ('cancelled') AND
		       datetime < ? AND datetime + (duration * interval '1 minute') > ?`,
			doctorID, end, start).
		Count(&count).Error
	return count > 0, err
}

func CreateAppointment(appt *models.Appointment) error {
	return database.DB.Create(appt).Error
}

func LoadAppointmentRelations(appt *models.Appointment) {
	database.DB.Preload("Patient").Preload("Doctor").First(appt, "id = ?", appt.ID)
}

func SaveAppointment(appt *models.Appointment) error {
	return database.DB.Save(appt).Error
}

func DeleteAppointment(appt *models.Appointment) error {
	return database.DB.Delete(appt).Error
}
