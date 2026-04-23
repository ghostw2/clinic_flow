package models

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type Patient struct {
	ID        uuid.UUID      `json:"id" gorm:"type:uuid;primaryKey"`
	ClinicID  uuid.UUID      `json:"clinic_id" gorm:"type:uuid;not null"`
	Name      string         `json:"name" gorm:"not null"`
	DOB       *time.Time     `json:"dob"`
	Phone     string         `json:"phone"`
	Email     string         `json:"email"`
	Notes     string         `json:"notes"`
	CreatedAt time.Time      `json:"created_at"`
	UpdatedAt time.Time      `json:"updated_at"`
	DeletedAt gorm.DeletedAt `json:"-" gorm:"index"`

	// Medical profile
	Gender                 string `json:"gender"`
	BloodType              string `json:"blood_type"`
	Allergies              string `json:"allergies"`
	ChronicConditions      string `json:"chronic_conditions"`
	EmergencyContactName   string `json:"emergency_contact_name"`
	EmergencyContactPhone  string `json:"emergency_contact_phone"`
	Address                string `json:"address"`
	Insurance              string `json:"insurance"`
	Occupation             string `json:"occupation"`

	Appointments   []Appointment   `json:"appointments,omitempty" gorm:"foreignKey:PatientID"`
	MedicalRecords []MedicalRecord `json:"medical_records,omitempty" gorm:"foreignKey:PatientID"`
}

func (p *Patient) BeforeCreate(tx *gorm.DB) error {
	if p.ID == uuid.Nil {
		p.ID = uuid.New()
	}
	return nil
}
