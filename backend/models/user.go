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

type UserResponse struct {
	ID               uuid.UUID       `json:"id"`
	Role             UserRole        `json:"role"`
	Name             string          `json:"name"`
	Email            string          `json:"email"`
	TwoFactorEnabled bool            `json:"two_factor_enabled"`
	CreatedAt        time.Time       `json:"created_at"`
	UpdatedAt        time.Time       `json:"updated_at"`
	Clinic           *ClinicResponse `json:"clinic,omitempty"`
}

func (u User) ToResponse() UserResponse {
	r := UserResponse{
		ID:               u.ID,
		Role:             u.Role,
		Name:             u.Name,
		Email:            u.Email,
		TwoFactorEnabled: u.TwoFactorEnabled,
		CreatedAt:        u.CreatedAt,
		UpdatedAt:        u.UpdatedAt,
	}
	if u.Clinic.ID != uuid.Nil {
		c := u.Clinic.ToResponse()
		r.Clinic = &c
	}
	return r
}

func UsersToResponse(users []User) []UserResponse {
	result := make([]UserResponse, len(users))
	for i, u := range users {
		result[i] = u.ToResponse()
	}
	return result
}
