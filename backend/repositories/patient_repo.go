package repositories

import (
	"github.com/clinicflow/backend/database"
	"github.com/clinicflow/backend/models"
	"github.com/google/uuid"
)

func GetPatients(clinicID uuid.UUID, search, createdFrom, createdTo string, page, limit int) ([]models.Patient, int64, error) {
	query := database.DB.Where("clinic_id = ? AND deleted_at IS NULL", clinicID)
	if search != "" {
		like := "%" + search + "%"
		query = query.Where("name ILIKE ? OR email ILIKE ? OR phone ILIKE ?", like, like, like)
	}
	if createdFrom != "" {
		query = query.Where("DATE(created_at) >= ?", createdFrom)
	}
	if createdTo != "" {
		query = query.Where("DATE(created_at) <= ?", createdTo)
	}

	var total int64
	query.Model(&models.Patient{}).Count(&total)

	var patients []models.Patient
	q := query.Order("name ASC")
	if limit > 0 {
		q = q.Offset((page - 1) * limit).Limit(limit)
	}
	err := q.Find(&patients).Error
	return patients, total, err
}

func GetPatientByID(id string, clinicID uuid.UUID) (models.Patient, error) {
	var patient models.Patient
	err := database.DB.
		Preload("Appointments", "deleted_at IS NULL").
		Preload("Appointments.Doctor").
		Where("id = ? AND clinic_id = ? AND deleted_at IS NULL", id, clinicID).
		First(&patient).Error
	return patient, err
}

func GetPatientHistory(id string, clinicID uuid.UUID) (models.Patient, error) {
	var patient models.Patient
	err := database.DB.
		Preload("MedicalRecords", "deleted_at IS NULL").
		Preload("MedicalRecords.Doctor").
		Preload("MedicalRecords.Appointment").
		Where("id = ? AND clinic_id = ? AND deleted_at IS NULL", id, clinicID).
		First(&patient).Error
	return patient, err
}

func CreatePatient(patient *models.Patient) error {
	return database.DB.Create(patient).Error
}

func SavePatient(patient *models.Patient) error {
	return database.DB.Save(patient).Error
}

func DeletePatient(patient *models.Patient) error {
	return database.DB.Delete(patient).Error
}

func PurgePatient(patientID uuid.UUID, clinicID uuid.UUID) error {
	tx := database.DB.Begin()
	if tx.Error != nil {
		return tx.Error
	}
	// Hard-delete medical records
	if err := tx.Unscoped().Where("patient_id = ? AND clinic_id = ?", patientID, clinicID).Delete(&models.MedicalRecord{}).Error; err != nil {
		tx.Rollback()
		return err
	}
	// Anonymise appointments — clear patient link, keep scheduling record
	if err := tx.Model(&models.Appointment{}).
		Where("patient_id = ? AND clinic_id = ?", patientID, clinicID).
		Updates(map[string]any{"patient_id": nil}).Error; err != nil {
		tx.Rollback()
		return err
	}
	// Hard-delete patient
	if err := tx.Unscoped().Where("id = ? AND clinic_id = ?", patientID, clinicID).Delete(&models.Patient{}).Error; err != nil {
		tx.Rollback()
		return err
	}
	return tx.Commit().Error
}

func GetPatientWithRecordsAndAppointments(id string, clinicID uuid.UUID) (models.Patient, error) {
	var patient models.Patient
	err := database.DB.
		Preload("MedicalRecords", "deleted_at IS NULL").
		Preload("MedicalRecords.Doctor").
		Preload("Appointments", "deleted_at IS NULL").
		Preload("Appointments.Doctor").
		Where("id = ? AND clinic_id = ? AND deleted_at IS NULL", id, clinicID).
		First(&patient).Error
	return patient, err
}

func CountPatients(clinicID uuid.UUID) (int64, error) {
	var count int64
	err := database.DB.Model(&models.Patient{}).
		Where("clinic_id = ? AND deleted_at IS NULL", clinicID).
		Count(&count).Error
	return count, err
}
