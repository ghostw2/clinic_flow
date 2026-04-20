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

	Appointments []Appointment `json:"appointments,omitempty" gorm:"foreignKey:PatientID"`
}

func (p *Patient) BeforeCreate(tx *gorm.DB) error {
	if p.ID == uuid.Nil {
		p.ID = uuid.New()
	}
	return nil
}
