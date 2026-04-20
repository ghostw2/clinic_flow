package services

import (
	"fmt"
	"time"

	"github.com/clinicflow/backend/models"
	"github.com/clinicflow/backend/repositories"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

type CreateAppointmentInput struct {
	PatientID string
	DoctorID  string
	Datetime  string
	Duration  int
	Notes     string
}

type UpdateAppointmentInput struct {
	DoctorID string
	Datetime string
	Duration int
	Status   string
	Notes    string
}

func ListAppointments(clinicID uuid.UUID, f repositories.AppointmentFilters) ([]models.Appointment, error) {
	return repositories.GetAppointments(clinicID, f)
}

func CreateAppointment(clinicID uuid.UUID, input CreateAppointmentInput) (models.Appointment, error) {
	dt, err := time.Parse(time.RFC3339, input.Datetime)
	if err != nil {
		return models.Appointment{}, fmt.Errorf("invalid datetime format, use RFC3339")
	}

	patientID, err := uuid.Parse(input.PatientID)
	if err != nil {
		return models.Appointment{}, fmt.Errorf("invalid patient_id")
	}

	doctorID, err := uuid.Parse(input.DoctorID)
	if err != nil {
		return models.Appointment{}, fmt.Errorf("invalid doctor_id")
	}

	duration := input.Duration
	if duration == 0 {
		duration = 30
	}

	conflict, err := repositories.HasConflict(doctorID, dt, dt.Add(time.Duration(duration)*time.Minute))
	if err != nil {
		return models.Appointment{}, err
	}
	if conflict {
		return models.Appointment{}, ErrConflict
	}

	appt := models.Appointment{
		ClinicID:  clinicID,
		PatientID: patientID,
		DoctorID:  doctorID,
		Datetime:  dt,
		Duration:  duration,
		Status:    models.StatusPending,
		Notes:     input.Notes,
	}

	if err := repositories.CreateAppointment(&appt); err != nil {
		return models.Appointment{}, err
	}

	repositories.LoadAppointmentRelations(&appt)
	return appt, nil
}

func UpdateAppointment(id string, clinicID uuid.UUID, input UpdateAppointmentInput) (models.Appointment, error) {
	appt, err := repositories.GetAppointmentByID(id, clinicID)
	if err != nil {
		if err == gorm.ErrRecordNotFound {
			return models.Appointment{}, ErrNotFound
		}
		return models.Appointment{}, err
	}

	if input.Datetime != "" {
		dt, err := time.Parse(time.RFC3339, input.Datetime)
		if err != nil {
			return models.Appointment{}, fmt.Errorf("invalid datetime format")
		}
		appt.Datetime = dt
	}
	if input.Duration > 0 {
		appt.Duration = input.Duration
	}
	if input.Status != "" {
		appt.Status = models.AppointmentStatus(input.Status)
	}
	if input.Notes != "" {
		appt.Notes = input.Notes
	}
	if input.DoctorID != "" {
		doctorID, err := uuid.Parse(input.DoctorID)
		if err == nil {
			appt.DoctorID = doctorID
		}
	}

	if err := repositories.SaveAppointment(&appt); err != nil {
		return models.Appointment{}, err
	}

	repositories.LoadAppointmentRelations(&appt)
	return appt, nil
}

func DeleteAppointment(id string, clinicID uuid.UUID) error {
	appt, err := repositories.GetAppointmentByID(id, clinicID)
	if err != nil {
		if err == gorm.ErrRecordNotFound {
			return ErrNotFound
		}
		return err
	}
	return repositories.DeleteAppointment(&appt)
}
