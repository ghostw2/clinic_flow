package models

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type NotificationType   string
type NotificationStatus string

const (
	NotifEmail NotificationType = "email"
	NotifSMS   NotificationType = "sms"

	NotifPending NotificationStatus = "pending"
	NotifSent    NotificationStatus = "sent"
	NotifFailed  NotificationStatus = "failed"
)

type Notification struct {
	ID            uuid.UUID          `json:"id" gorm:"type:uuid;primaryKey"`
	AppointmentID uuid.UUID          `json:"appointment_id" gorm:"type:uuid;not null"`
	Type          NotificationType   `json:"type" gorm:"not null"`
	SentAt        *time.Time         `json:"sent_at"`
	Status        NotificationStatus `json:"status" gorm:"not null;default:'pending'"`
	CreatedAt     time.Time          `json:"created_at"`
	UpdatedAt     time.Time          `json:"updated_at"`

	Appointment Appointment `json:"appointment,omitempty" gorm:"foreignKey:AppointmentID"`
}

func (n *Notification) BeforeCreate(tx *gorm.DB) error {
	if n.ID == uuid.Nil {
		n.ID = uuid.New()
	}
	return nil
}

func (Notification) TableName() string { return "notifications" }
