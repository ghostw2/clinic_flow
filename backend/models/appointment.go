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
	Notes     string            `json:"notes"`
	CreatedAt time.Time         `json:"created_at"`
	UpdatedAt time.Time         `json:"updated_at"`
	DeletedAt gorm.DeletedAt    `json:"-" gorm:"index"`

	Patient Patient `json:"patient,omitempty" gorm:"foreignKey:PatientID"`
	Doctor  User    `json:"doctor,omitempty" gorm:"foreignKey:DoctorID"`
}

func (a *Appointment) BeforeCreate(tx *gorm.DB) error {
	if a.ID == uuid.Nil {
		a.ID = uuid.New()
	}
	return nil
}
