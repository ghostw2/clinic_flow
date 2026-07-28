package models

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type AppointmentStatus string

const (
	StatusPending   AppointmentStatus = "pending"
	StatusConfirmed AppointmentStatus = "confirmed"
	StatusCompleted AppointmentStatus = "completed"
	StatusCancelled AppointmentStatus = "cancelled"
)

type Appointment struct {
	ID        uuid.UUID         `json:"id" gorm:"type:uuid;primaryKey"`
	ClinicID  uuid.UUID         `json:"clinic_id" gorm:"type:uuid;not null"`
	PatientID uuid.UUID         `json:"patient_id" gorm:"type:uuid;not null"`
	DoctorID  uuid.UUID         `json:"doctor_id" gorm:"type:uuid;not null"`
	Datetime  time.Time         `json:"datetime" gorm:"not null"`
	Duration  int               `json:"duration" gorm:"not null;default:30"`
	Status    AppointmentStatus `json:"status" gorm:"not null;default:'pending'"`
	Notes       string         `json:"notes"`
	TreatmentID *uuid.UUID     `json:"treatment_id,omitempty" gorm:"type:uuid"`
	CreatedAt   time.Time      `json:"created_at"`
	UpdatedAt   time.Time      `json:"updated_at"`
	DeletedAt   gorm.DeletedAt `json:"-" gorm:"index"`

	Patient   Patient    `json:"patient,omitempty" gorm:"foreignKey:PatientID"`
	Doctor    User       `json:"doctor,omitempty" gorm:"foreignKey:DoctorID"`
	Treatment *Treatment `json:"treatment,omitempty" gorm:"foreignKey:TreatmentID"`
}

func (a *Appointment) BeforeCreate(tx *gorm.DB) error {
	if a.ID == uuid.Nil {
		a.ID = uuid.New()
	}
	return nil
}

type AppointmentResponse struct {
	ID          uuid.UUID         `json:"id"`
	PatientID   uuid.UUID         `json:"patient_id"`
	DoctorID    uuid.UUID         `json:"doctor_id"`
	TreatmentID *uuid.UUID        `json:"treatment_id,omitempty"`
	Datetime    time.Time         `json:"datetime"`
	Duration    int               `json:"duration"`
	Status      AppointmentStatus `json:"status"`
	Notes       string            `json:"notes,omitempty"`
	CreatedAt   time.Time         `json:"created_at"`
	UpdatedAt   time.Time         `json:"updated_at"`
	Patient     *PatientResponse  `json:"patient,omitempty"`
	Doctor      *UserResponse     `json:"doctor,omitempty"`
}

func (a Appointment) ToResponse() AppointmentResponse {
	r := AppointmentResponse{
		ID:          a.ID,
		PatientID:   a.PatientID,
		DoctorID:    a.DoctorID,
		TreatmentID: a.TreatmentID,
		Datetime:    a.Datetime,
		Duration:    a.Duration,
		Status:      a.Status,
		Notes:       a.Notes,
		CreatedAt:   a.CreatedAt,
		UpdatedAt:   a.UpdatedAt,
	}
	if a.Patient.ID != uuid.Nil {
		p := a.Patient.ToResponse()
		r.Patient = &p
	}
	if a.Doctor.ID != uuid.Nil {
		d := a.Doctor.ToResponse()
		r.Doctor = &d
	}
	return r
}

func AppointmentsToResponse(appts []Appointment) []AppointmentResponse {
	result := make([]AppointmentResponse, len(appts))
	for i, a := range appts {
		result[i] = a.ToResponse()
	}
	return result
}
