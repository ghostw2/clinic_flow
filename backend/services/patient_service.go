package services

import (
	"time"

	"github.com/clinicflow/backend/models"
	"github.com/clinicflow/backend/repositories"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

type CreatePatientInput struct {
	Name  string
	DOB   string
	Phone string
	Email string
	Notes string
}

type UpdatePatientInput struct {
	Name  string
	DOB   string
	Phone string
	Email string
	Notes string
}

func ListPatients(clinicID uuid.UUID, search string, page int) ([]models.Patient, int64, error) {
	const limit = 20
	return repositories.GetPatients(clinicID, search, page, limit)
}

func GetPatient(id string, clinicID uuid.UUID) (models.Patient, error) {
	patient, err := repositories.GetPatientByID(id, clinicID)
	if err != nil {
		if err == gorm.ErrRecordNotFound {
			return models.Patient{}, ErrNotFound
		}
		return models.Patient{}, err
	}
	return patient, nil
}

func CreatePatient(clinicID uuid.UUID, input CreatePatientInput) (models.Patient, error) {
	patient := models.Patient{
		ClinicID: clinicID,
		Name:     input.Name,
		Phone:    input.Phone,
		Email:    input.Email,
		Notes:    input.Notes,
	}

	if input.DOB != "" {
		dob, err := time.Parse("2006-01-02", input.DOB)
		if err == nil {
			patient.DOB = &dob
		}
	}

	if err := repositories.CreatePatient(&patient); err != nil {
		return models.Patient{}, err
	}
	return patient, nil
}

func UpdatePatient(id string, clinicID uuid.UUID, input UpdatePatientInput) (models.Patient, error) {
	patient, err := repositories.GetPatientByID(id, clinicID)
	if err != nil {
		if err == gorm.ErrRecordNotFound {
			return models.Patient{}, ErrNotFound
		}
		return models.Patient{}, err
	}

	if input.Name != "" {
		patient.Name = input.Name
	}
	if input.Phone != "" {
		patient.Phone = input.Phone
	}
	if input.Email != "" {
		patient.Email = input.Email
	}
	if input.Notes != "" {
		patient.Notes = input.Notes
	}
	if input.DOB != "" {
		dob, err := time.Parse("2006-01-02", input.DOB)
		if err == nil {
			patient.DOB = &dob
		}
	}

	if err := repositories.SavePatient(&patient); err != nil {
		return models.Patient{}, err
	}
	return patient, nil
}

func DeletePatient(id string, clinicID uuid.UUID) error {
	patient, err := repositories.GetPatientByID(id, clinicID)
	if err != nil {
		if err == gorm.ErrRecordNotFound {
			return ErrNotFound
		}
		return err
	}
	return repositories.DeletePatient(&patient)
}
