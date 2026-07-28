package models

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type Treatment struct {
	ID            uuid.UUID          `json:"id" gorm:"type:uuid;primaryKey"`
	ClinicID      uuid.UUID          `json:"clinic_id" gorm:"type:uuid;not null"`
	PatientID     uuid.UUID          `json:"patient_id" gorm:"type:uuid;not null"`
	CreatedBy     uuid.UUID          `json:"created_by" gorm:"type:uuid;not null"`
	Name          string             `json:"name" gorm:"not null"`
	Description   string             `json:"description"`
	TotalAmount   float64            `json:"total_amount" gorm:"type:numeric(10,2);not null"`
	PlannedVisits int                `json:"planned_visits" gorm:"not null;default:1"`
	Status        string             `json:"status" gorm:"not null;default:'active'"`
	Notes         string             `json:"notes"`
	CreatedAt     time.Time          `json:"created_at"`
	UpdatedAt     time.Time          `json:"updated_at"`
	DeletedAt     gorm.DeletedAt     `json:"-" gorm:"index"`

	Patient      Patient            `json:"patient,omitempty" gorm:"foreignKey:PatientID"`
	Creator      User               `json:"creator,omitempty" gorm:"foreignKey:CreatedBy"`
	Payments     []TreatmentPayment `json:"payments,omitempty" gorm:"foreignKey:TreatmentID"`
	Appointments []Appointment      `json:"appointments,omitempty" gorm:"foreignKey:TreatmentID"`
}

func (t *Treatment) BeforeCreate(tx *gorm.DB) error {
	if t.ID == uuid.Nil {
		t.ID = uuid.New()
	}
	return nil
}

type TreatmentResponse struct {
	ID              uuid.UUID          `json:"id"`
	ClinicID        uuid.UUID          `json:"clinic_id"`
	PatientID       uuid.UUID          `json:"patient_id"`
	CreatedBy       uuid.UUID          `json:"created_by"`
	Name            string             `json:"name"`
	Description     string             `json:"description,omitempty"`
	TotalAmount     float64            `json:"total_amount"`
	PlannedVisits   int                `json:"planned_visits"`
	Status          string             `json:"status"`
	Notes           string             `json:"notes,omitempty"`
	CreatedAt       time.Time          `json:"created_at"`
	UpdatedAt       time.Time          `json:"updated_at"`
	Patient         *PatientResponse   `json:"patient,omitempty"`
	Payments        []TreatmentPayment `json:"payments,omitempty"`
	// Computed
	AmountPaid      float64            `json:"amount_paid"`
	AmountRemaining float64            `json:"amount_remaining"`
	PaymentStatus   string             `json:"payment_status"`
	VisitsUsed      int                `json:"visits_used"`
}

func (t Treatment) ToResponse() TreatmentResponse {
	r := TreatmentResponse{
		ID:            t.ID,
		ClinicID:      t.ClinicID,
		PatientID:     t.PatientID,
		CreatedBy:     t.CreatedBy,
		Name:          t.Name,
		Description:   t.Description,
		TotalAmount:   t.TotalAmount,
		PlannedVisits: t.PlannedVisits,
		Status:        t.Status,
		Notes:         t.Notes,
		CreatedAt:     t.CreatedAt,
		UpdatedAt:     t.UpdatedAt,
		Payments:      t.Payments,
	}
	if t.Patient.ID != uuid.Nil {
		p := t.Patient.ToResponse()
		r.Patient = &p
	}

	var paid float64
	for _, p := range t.Payments {
		if p.Status == "paid" {
			paid += p.Amount
		}
	}
	r.AmountPaid = paid
	r.AmountRemaining = t.TotalAmount - paid
	switch {
	case paid >= t.TotalAmount && t.TotalAmount > 0:
		r.PaymentStatus = "paid"
	case paid > 0:
		r.PaymentStatus = "partial"
	default:
		r.PaymentStatus = "pending"
	}
	r.VisitsUsed = len(t.Appointments)

	return r
}

func TreatmentsToResponse(treatments []Treatment) []TreatmentResponse {
	result := make([]TreatmentResponse, len(treatments))
	for i, t := range treatments {
		result[i] = t.ToResponse()
	}
	return result
}
