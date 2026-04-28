package repositories

import (
	"github.com/clinicflow/backend/database"
	"github.com/clinicflow/backend/models"
)

func CreateClinic(clinic *models.Clinic) error {
	return database.DB.Create(clinic).Error
}
