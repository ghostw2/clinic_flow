package models

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type AuditLog struct {
	ID           uuid.UUID `json:"id" gorm:"type:uuid;primaryKey"`
	ClinicID     uuid.UUID `json:"clinic_id" gorm:"type:uuid;not null;index"`
	UserID       uuid.UUID `json:"user_id" gorm:"type:uuid;not null"`
	UserName     string    `json:"user_name" gorm:"not null"`
	Action       string    `json:"action" gorm:"not null"`
	ResourceType string    `json:"resource_type" gorm:"not null"`
	ResourceID   uuid.UUID `json:"resource_id" gorm:"type:uuid;not null"`
	Details      string    `json:"details" gorm:"type:jsonb"`
	IPAddress    string    `json:"ip_address"`
	CreatedAt    time.Time `json:"created_at"`
}

func (a *AuditLog) BeforeCreate(tx *gorm.DB) error {
	if a.ID == uuid.Nil {
		a.ID = uuid.New()
	}
	return nil
}
