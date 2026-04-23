package repositories

import (
	"github.com/clinicflow/backend/database"
	"github.com/clinicflow/backend/models"
	"github.com/google/uuid"
)

func GetMedicalRecords(patientID, clinicID uuid.UUID) ([]models.MedicalRecord, error) {
	var records []models.MedicalRecord
	err := database.DB.
		Preload("Doctor").
		Preload("Appointment").
		Where("patient_id = ? AND clinic_id = ? AND deleted_at IS NULL", patientID, clinicID).
		Order("visit_date DESC").
		Find(&records).Error
	return records, err
}

func GetMedicalRecordByID(id string, clinicID uuid.UUID) (models.MedicalRecord, error) {
	var record models.MedicalRecord
	err := database.DB.
		Preload("Doctor").
		Preload("Appointment").
		Where("id = ? AND clinic_id = ? AND deleted_at IS NULL", id, clinicID).
		First(&record).Error
	return record, err
}

func CreateMedicalRecord(record *models.MedicalRecord) error {
	return database.DB.Create(record).Error
}

func SaveMedicalRecord(record *models.MedicalRecord) error {
	return database.DB.Save(record).Error
}

func DeleteMedicalRecord(record *models.MedicalRecord) error {
	return database.DB.Delete(record).Error
}
