package repositories

import (
	"time"

	"github.com/clinicflow/backend/database"
	"github.com/clinicflow/backend/models"
)

func CreateSession(session *models.Session) error {
	return database.DB.Create(session).Error
}

func GetSessionByID(id string) (models.Session, error) {
	var session models.Session
	err := database.DB.Where("id = ? AND expires_at > ?", id, time.Now()).First(&session).Error
	return session, err
}

func DeleteSession(id string) error {
	return database.DB.Where("id = ?", id).Delete(&models.Session{}).Error
}

func ExtendSession(id string, expiresAt time.Time) error {
	return database.DB.Model(&models.Session{}).
		Where("id = ?", id).
		Update("expires_at", expiresAt).Error
}
