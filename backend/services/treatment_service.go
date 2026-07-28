package services

import (
	"time"

	"github.com/clinicflow/backend/models"
	"github.com/clinicflow/backend/repositories"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

type CreateTreatmentInput struct {
	PatientID     string
	Name          string
	Description   string
	TotalAmount   float64
	PlannedVisits int
	Notes         string
}

type UpdateTreatmentInput struct {
	Name          string
	Description   string
	TotalAmount   float64
	PlannedVisits int
	Status        string
	Notes         string
}

type AddPaymentInput struct {
	Amount  float64
	DueDate string
	Notes   string
}

type UpdatePaymentInput struct {
	Amount  float64
	DueDate string
	Status  string
	Notes   string
}

func ListTreatments(clinicID uuid.UUID, patientID string, status string, page int) ([]models.TreatmentResponse, int64, error) {
	treatments, total, err := repositories.GetTreatments(clinicID, repositories.TreatmentFilters{
		PatientID: patientID,
		Status:    status,
		Page:      page,
	})
	if err != nil {
		return nil, 0, err
	}
	return models.TreatmentsToResponse(treatments), total, nil
}

func GetTreatment(id string, clinicID uuid.UUID) (models.TreatmentResponse, error) {
	t, err := repositories.GetTreatmentByID(id, clinicID)
	if err != nil {
		if err == gorm.ErrRecordNotFound {
			return models.TreatmentResponse{}, ErrNotFound
		}
		return models.TreatmentResponse{}, err
	}
	return t.ToResponse(), nil
}

func CreateTreatment(clinicID uuid.UUID, createdBy uuid.UUID, input CreateTreatmentInput) (models.TreatmentResponse, error) {
	patientID, err := uuid.Parse(input.PatientID)
	if err != nil {
		return models.TreatmentResponse{}, ErrInvalidID
	}

	planned := input.PlannedVisits
	if planned < 1 {
		planned = 1
	}

	t := models.Treatment{
		ClinicID:      clinicID,
		PatientID:     patientID,
		CreatedBy:     createdBy,
		Name:          input.Name,
		Description:   input.Description,
		TotalAmount:   input.TotalAmount,
		PlannedVisits: planned,
		Status:        "active",
		Notes:         input.Notes,
	}

	if err := repositories.CreateTreatment(&t); err != nil {
		return models.TreatmentResponse{}, err
	}

	full, err := repositories.GetTreatmentByID(t.ID.String(), clinicID)
	if err != nil {
		return models.TreatmentResponse{}, err
	}
	return full.ToResponse(), nil
}

func UpdateTreatment(id string, clinicID uuid.UUID, input UpdateTreatmentInput) (models.TreatmentResponse, error) {
	t, err := repositories.GetTreatmentByID(id, clinicID)
	if err != nil {
		if err == gorm.ErrRecordNotFound {
			return models.TreatmentResponse{}, ErrNotFound
		}
		return models.TreatmentResponse{}, err
	}

	if input.Name != "" {
		t.Name = input.Name
	}
	if input.Description != "" {
		t.Description = input.Description
	}
	if input.TotalAmount > 0 {
		t.TotalAmount = input.TotalAmount
	}
	if input.PlannedVisits > 0 {
		t.PlannedVisits = input.PlannedVisits
	}
	if input.Status != "" {
		t.Status = input.Status
	}
	if input.Notes != "" {
		t.Notes = input.Notes
	}

	if err := repositories.SaveTreatment(&t); err != nil {
		return models.TreatmentResponse{}, err
	}

	full, err := repositories.GetTreatmentByID(t.ID.String(), clinicID)
	if err != nil {
		return models.TreatmentResponse{}, err
	}
	return full.ToResponse(), nil
}

func CancelTreatment(id string, clinicID uuid.UUID) error {
	t, err := repositories.GetTreatmentByID(id, clinicID)
	if err != nil {
		if err == gorm.ErrRecordNotFound {
			return ErrNotFound
		}
		return err
	}
	t.Status = "cancelled"
	return repositories.SaveTreatment(&t)
}

func AddPayment(treatmentID string, clinicID uuid.UUID, input AddPaymentInput) (models.TreatmentPayment, error) {
	tid, err := uuid.Parse(treatmentID)
	if err != nil {
		return models.TreatmentPayment{}, ErrInvalidID
	}

	if _, err := repositories.GetTreatmentByID(treatmentID, clinicID); err != nil {
		if err == gorm.ErrRecordNotFound {
			return models.TreatmentPayment{}, ErrNotFound
		}
		return models.TreatmentPayment{}, err
	}

	p := models.TreatmentPayment{
		TreatmentID: tid,
		ClinicID:    clinicID,
		Amount:      input.Amount,
		Status:      "pending",
		Notes:       input.Notes,
	}

	if input.DueDate != "" {
		d, err := time.Parse("2006-01-02", input.DueDate)
		if err == nil {
			p.DueDate = &d
		}
	}

	if err := repositories.CreatePayment(&p); err != nil {
		return models.TreatmentPayment{}, err
	}
	return p, nil
}

func UpdatePayment(paymentID string, treatmentID uuid.UUID, clinicID uuid.UUID, input UpdatePaymentInput) (models.TreatmentPayment, error) {
	p, err := repositories.GetPaymentByID(paymentID, treatmentID)
	if err != nil {
		if err == gorm.ErrRecordNotFound {
			return models.TreatmentPayment{}, ErrNotFound
		}
		return models.TreatmentPayment{}, err
	}

	if input.Amount > 0 {
		p.Amount = input.Amount
	}
	if input.Notes != "" {
		p.Notes = input.Notes
	}
	if input.Status != "" {
		p.Status = input.Status
		if input.Status == "paid" && p.PaidAt == nil {
			now := time.Now()
			p.PaidAt = &now
		}
	}
	if input.DueDate != "" {
		d, err := time.Parse("2006-01-02", input.DueDate)
		if err == nil {
			p.DueDate = &d
		}
	}

	if err := repositories.SavePayment(&p); err != nil {
		return models.TreatmentPayment{}, err
	}
	return p, nil
}

func MarkPaymentPaid(paymentID string, treatmentID uuid.UUID, clinicID uuid.UUID, recordedBy uuid.UUID) (models.TreatmentPayment, error) {
	p, err := repositories.GetPaymentByID(paymentID, treatmentID)
	if err != nil {
		if err == gorm.ErrRecordNotFound {
			return models.TreatmentPayment{}, ErrNotFound
		}
		return models.TreatmentPayment{}, err
	}

	now := time.Now()
	p.Status = "paid"
	p.PaidAt = &now
	p.RecordedBy = &recordedBy

	if err := repositories.SavePayment(&p); err != nil {
		return models.TreatmentPayment{}, err
	}
	return p, nil
}

func DeletePayment(paymentID string, treatmentID uuid.UUID, clinicID uuid.UUID) error {
	p, err := repositories.GetPaymentByID(paymentID, treatmentID)
	if err != nil {
		if err == gorm.ErrRecordNotFound {
			return ErrNotFound
		}
		return err
	}
	return repositories.DeletePayment(&p)
}
