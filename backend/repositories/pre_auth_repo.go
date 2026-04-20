package repositories

import (
	"time"

	"github.com/clinicflow/backend/database"
	"github.com/clinicflow/backend/models"
)

func CreatePreAuthSession(s *models.PreAuthSession) error {
	return database.DB.Create(s).Error
}

func GetPreAuthSessionByID(id string) (models.PreAuthSession, error) {
	var s models.PreAuthSession
	err := database.DB.Where("id = ? AND expires_at > ?", id, time.Now()).First(&s).Error
	return s, err
}

func DeletePreAuthSession(id string) error {
	return database.DB.Where("id = ?", id).Delete(&models.PreAuthSession{}).Error
}
