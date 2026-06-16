package repositories

import (
	"github.com/clinicflow/backend/database"
	"github.com/clinicflow/backend/models"
	"github.com/google/uuid"
)

func CreateClinic(clinic *models.Clinic) error {
	return database.DB.Create(clinic).Error
}

func UpdateClinicPermissions(clinicID uuid.UUID, permissionsJSON string) error {
	return database.DB.Model(&models.Clinic{}).
		Where("id = ?", clinicID).
		Update("permissions", permissionsJSON).Error
}
