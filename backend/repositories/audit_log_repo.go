package repositories

import (
	"github.com/clinicflow/backend/database"
	"github.com/clinicflow/backend/models"
	"github.com/google/uuid"
)

func CreateAuditLog(log *models.AuditLog) error {
	return database.DB.Create(log).Error
}

func GetAuditLogsForResource(clinicID, resourceID uuid.UUID, limit int) ([]models.AuditLog, error) {
	var logs []models.AuditLog
	err := database.DB.
		Where("clinic_id = ? AND resource_id = ?", clinicID, resourceID).
		Order("created_at DESC").
		Limit(limit).
		Find(&logs).Error
	return logs, err
}
