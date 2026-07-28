package repositories

import (
	"github.com/clinicflow/backend/database"
	"github.com/clinicflow/backend/models"
	"github.com/google/uuid"
)

type TreatmentFilters struct {
	PatientID string
	Status    string
	Page      int
}

func GetTreatments(clinicID uuid.UUID, f TreatmentFilters) ([]models.Treatment, int64, error) {
	query := database.DB.
		Preload("Patient").
		Preload("Payments").
		Preload("Appointments").
		Where("treatments.clinic_id = ? AND treatments.deleted_at IS NULL", clinicID)

	if f.PatientID != "" {
		query = query.Where("treatments.patient_id = ?", f.PatientID)
	}
	if f.Status != "" {
		query = query.Where("treatments.status = ?", f.Status)
	}

	var total int64
	if err := query.Model(&models.Treatment{}).Count(&total).Error; err != nil {
		return nil, 0, err
	}

	limit := 50
	page := f.Page
	if page < 1 {
		page = 1
	}

	var treatments []models.Treatment
	err := query.
		Order("treatments.created_at DESC").
		Offset((page - 1) * limit).
		Limit(limit).
		Find(&treatments).Error
	return treatments, total, err
}

func GetTreatmentByID(id string, clinicID uuid.UUID) (models.Treatment, error) {
	var t models.Treatment
	err := database.DB.
		Preload("Patient").
		Preload("Creator").
		Preload("Payments").
		Preload("Appointments").
		Where("treatments.id = ? AND treatments.clinic_id = ? AND treatments.deleted_at IS NULL", id, clinicID).
		First(&t).Error
	return t, err
}

func CreateTreatment(t *models.Treatment) error {
	return database.DB.Create(t).Error
}

func SaveTreatment(t *models.Treatment) error {
	return database.DB.Save(t).Error
}

func DeleteTreatment(t *models.Treatment) error {
	return database.DB.Delete(t).Error
}

func GetPaymentByID(id string, treatmentID uuid.UUID) (models.TreatmentPayment, error) {
	var p models.TreatmentPayment
	err := database.DB.
		Where("id = ? AND treatment_id = ?", id, treatmentID).
		First(&p).Error
	return p, err
}

func CreatePayment(p *models.TreatmentPayment) error {
	return database.DB.Create(p).Error
}

func SavePayment(p *models.TreatmentPayment) error {
	return database.DB.Save(p).Error
}

func DeletePayment(p *models.TreatmentPayment) error {
	return database.DB.Delete(p).Error
}
