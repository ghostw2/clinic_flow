package models

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type TreatmentPayment struct {
	ID          uuid.UUID  `json:"id" gorm:"type:uuid;primaryKey"`
	TreatmentID uuid.UUID  `json:"treatment_id" gorm:"type:uuid;not null"`
	ClinicID    uuid.UUID  `json:"clinic_id" gorm:"type:uuid;not null"`
	Amount      float64    `json:"amount" gorm:"type:numeric(10,2);not null"`
	DueDate     *time.Time `json:"due_date,omitempty"`
	PaidAt      *time.Time `json:"paid_at,omitempty"`
	Status      string     `json:"status" gorm:"not null;default:'pending'"`
	Notes       string     `json:"notes,omitempty"`
	RecordedBy  *uuid.UUID `json:"recorded_by,omitempty" gorm:"type:uuid"`
	CreatedAt   time.Time  `json:"created_at"`
	UpdatedAt   time.Time  `json:"updated_at"`
}

func (p *TreatmentPayment) BeforeCreate(tx *gorm.DB) error {
	if p.ID == uuid.Nil {
		p.ID = uuid.New()
	}
	return nil
}
