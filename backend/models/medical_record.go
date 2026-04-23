package models

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type VitalSigns struct {
	BloodPressure string `json:"blood_pressure,omitempty"`
	Temperature   string `json:"temperature,omitempty"`
	HeartRate     string `json:"heart_rate,omitempty"`
	Weight        string `json:"weight,omitempty"`
	Height        string `json:"height,omitempty"`
	OxygenSat     string `json:"oxygen_saturation,omitempty"`
}

type MedicalRecord struct {
	ID            uuid.UUID      `json:"id" gorm:"type:uuid;primaryKey"`
	ClinicID      uuid.UUID      `json:"clinic_id" gorm:"type:uuid;not null"`
	PatientID     uuid.UUID      `json:"patient_id" gorm:"type:uuid;not null"`
	AppointmentID *uuid.UUID     `json:"appointment_id" gorm:"type:uuid"`
	DoctorID      uuid.UUID      `json:"doctor_id" gorm:"type:uuid;not null"`
	VisitDate     time.Time      `json:"visit_date" gorm:"not null"`
	ChiefComplaint string        `json:"chief_complaint"`
	Diagnosis     string         `json:"diagnosis"`
	Treatment     string         `json:"treatment"`
	Prescriptions string         `json:"prescriptions"`
	VitalSigns    *VitalSigns    `json:"vital_signs" gorm:"serializer:json"`
	FollowUpDate  *time.Time     `json:"follow_up_date"`
	Notes         string         `json:"notes"`
	CreatedAt     time.Time      `json:"created_at"`
	UpdatedAt     time.Time      `json:"updated_at"`
	DeletedAt     gorm.DeletedAt `json:"-" gorm:"index"`

	Doctor      User         `json:"doctor,omitempty" gorm:"foreignKey:DoctorID"`
	Appointment *Appointment `json:"appointment,omitempty" gorm:"foreignKey:AppointmentID"`
}

func (r *MedicalRecord) BeforeCreate(tx *gorm.DB) error {
	if r.ID == uuid.Nil {
		r.ID = uuid.New()
	}
	return nil
}
