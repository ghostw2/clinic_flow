package repositories

import (
	"github.com/clinicflow/backend/database"
	"github.com/clinicflow/backend/models"
	"github.com/google/uuid"
)

func GetDocuments(apptID, clinicID uuid.UUID) ([]models.AppointmentDocument, error) {
	var docs []models.AppointmentDocument
	err := database.DB.
		Preload("Uploader").
		Where("appointment_id = ? AND clinic_id = ?", apptID, clinicID).
		Order("created_at DESC").
		Find(&docs).Error
	return docs, err
}

func CreateDocument(doc *models.AppointmentDocument) error {
	return database.DB.Create(doc).Error
}

func GetDocumentByID(docID, apptID, clinicID uuid.UUID) (models.AppointmentDocument, error) {
	var doc models.AppointmentDocument
	err := database.DB.
		Where("id = ? AND appointment_id = ? AND clinic_id = ?", docID, apptID, clinicID).
		First(&doc).Error
	return doc, err
}

func DeleteDocument(doc *models.AppointmentDocument) error {
	return database.DB.Delete(doc).Error
}
