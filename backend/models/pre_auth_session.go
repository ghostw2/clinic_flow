package models

import (
	"time"

	"github.com/google/uuid"
)

// PreAuthSession is a short-lived token (5 min) issued after password check
// when 2FA is enabled. Exchanged for a full Session after TOTP verification.
type PreAuthSession struct {
	ID        string    `gorm:"type:varchar(36);primaryKey"`
	UserID    uuid.UUID `gorm:"type:uuid;not null;index"`
	ExpiresAt time.Time `gorm:"not null;index"`
	CreatedAt time.Time
}
