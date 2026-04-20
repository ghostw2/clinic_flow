package models

import (
	"time"

	"github.com/google/uuid"
)

type Session struct {
	ID        string    `json:"-" gorm:"type:varchar(36);primaryKey"`
	UserID    uuid.UUID `json:"-" gorm:"type:uuid;not null;index"`
	ClinicID  uuid.UUID `json:"-" gorm:"type:uuid;not null"`
	Role      string    `json:"-" gorm:"not null"`
	ExpiresAt time.Time `json:"-" gorm:"not null;index"`
	CreatedAt time.Time `json:"-"`
}
