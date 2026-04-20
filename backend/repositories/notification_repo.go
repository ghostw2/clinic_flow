package repositories

import (
	"github.com/clinicflow/backend/database"
	"github.com/clinicflow/backend/models"
)

func CreateNotification(notif *models.Notification) error {
	return database.DB.Create(notif).Error
}
