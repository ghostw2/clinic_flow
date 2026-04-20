package repositories

import (
	"github.com/clinicflow/backend/database"
	"github.com/clinicflow/backend/models"
	"github.com/google/uuid"
)

func GetUsersByClinic(clinicID uuid.UUID) ([]models.User, error) {
	var users []models.User
	err := database.DB.
		Where("clinic_id = ? AND deleted_at IS NULL", clinicID).
		Order("name ASC").
		Find(&users).Error
	return users, err
}

func GetUserByEmail(email string) (models.User, error) {
	var user models.User
	err := database.DB.Preload("Clinic").
		Where("email = ? AND deleted_at IS NULL", email).
		First(&user).Error
	return user, err
}

func GetUserByID(id uuid.UUID) (models.User, error) {
	var user models.User
	err := database.DB.
		Where("id = ? AND deleted_at IS NULL", id).
		First(&user).Error
	return user, err
}

func GetUserWithClinic(id uuid.UUID) (models.User, error) {
	var user models.User
	err := database.DB.Preload("Clinic").
		Where("id = ? AND deleted_at IS NULL", id).
		First(&user).Error
	return user, err
}

func CreateUser(user *models.User) error {
	return database.DB.Create(user).Error
}

func SetUser2FASecret(userID uuid.UUID, secret string) error {
	return database.DB.Model(&models.User{}).
		Where("id = ?", userID).
		Update("two_factor_secret", secret).Error
}

func SetUser2FAEnabled(userID uuid.UUID, enabled, verified bool) error {
	updates := map[string]interface{}{
		"two_factor_enabled":  enabled,
		"two_factor_verified": verified,
	}
	if !enabled {
		updates["two_factor_secret"] = ""
	}
	return database.DB.Model(&models.User{}).
		Where("id = ?", userID).
		Updates(updates).Error
}
