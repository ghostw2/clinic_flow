package services

import (
	"github.com/clinicflow/backend/models"
	"github.com/clinicflow/backend/repositories"
	"github.com/google/uuid"
	"golang.org/x/crypto/bcrypt"
)

type CreateUserInput struct {
	Name     string
	Email    string
	Password string
	Role     string
}

func ListUsers(clinicID uuid.UUID) ([]models.User, error) {
	return repositories.GetUsersByClinic(clinicID)
}

func CreateUser(clinicID uuid.UUID, input CreateUserInput) (models.User, error) {
	hash, err := bcrypt.GenerateFromPassword([]byte(input.Password), bcrypt.DefaultCost)
	if err != nil {
		return models.User{}, err
	}

	user := models.User{
		ClinicID:     clinicID,
		Role:         models.UserRole(input.Role),
		Name:         input.Name,
		Email:        input.Email,
		PasswordHash: string(hash),
	}

	if err := repositories.CreateUser(&user); err != nil {
		return models.User{}, err
	}
	return user, nil
}
