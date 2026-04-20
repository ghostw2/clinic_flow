package models

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type UserRole string

const (
	RoleAdmin  UserRole = "admin"
	RoleDoctor UserRole = "doctor"
	RoleStaff  UserRole = "staff"
)

type User struct {
	ID           uuid.UUID      `json:"id" gorm:"type:uuid;primaryKey"`
	ClinicID     uuid.UUID      `json:"clinic_id" gorm:"type:uuid;not null"`
	Role         UserRole       `json:"role" gorm:"not null;default:'staff'"`
	Name         string         `json:"name" gorm:"not null"`
	Email        string         `json:"email" gorm:"not null"`
	PasswordHash     string         `json:"-" gorm:"not null"`
	TwoFactorEnabled bool           `json:"two_factor_enabled" gorm:"column:two_factor_enabled;default:false"`
	TwoFactorSecret  string         `json:"-" gorm:"column:two_factor_secret"`
	TwoFactorVerified bool          `json:"two_factor_verified" gorm:"column:two_factor_verified;default:false"`
	CreatedAt        time.Time      `json:"created_at"`
	UpdatedAt        time.Time      `json:"updated_at"`
	DeletedAt        gorm.DeletedAt `json:"-" gorm:"index"`

	Clinic Clinic `json:"clinic,omitempty" gorm:"foreignKey:ClinicID"`
}

func (u *User) BeforeCreate(tx *gorm.DB) error {
	if u.ID == uuid.Nil {
		u.ID = uuid.New()
	}
	return nil
}
