package services

import (
	"time"

	"github.com/clinicflow/backend/models"
	"github.com/clinicflow/backend/repositories"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

type CreatePatientInput struct {
	Name                  string
	DOB                   string
	Phone                 string
	Email                 string
	Notes                 string
	Gender                string
	BloodType             string
	Allergies             string
	ChronicConditions     string
	EmergencyContactName  string
	EmergencyContactPhone string
	Address               string
	Insurance             string
	Occupation            string
	ConsentGivenAt        string
	ConsentNotes          string
}

type UpdatePatientInput struct {
	Name                  string
	DOB                   string
	Phone                 string
	Email                 string
	Notes                 string
	Gender                string
	BloodType             string
	Allergies             string
	ChronicConditions     string
	EmergencyContactName  string
	EmergencyContactPhone string
	Address               string
	Insurance             string
	Occupation            string
	ConsentGivenAt        string
	ConsentNotes          string
}

type ListPatientsInput struct {
	Search      string
	CreatedFrom string
	CreatedTo   string
	Page        int
	All         bool
}

func ListPatients(clinicID uuid.UUID, input ListPatientsInput) ([]models.Patient, int64, error) {
	pageLimit := 20
	if input.All {
		pageLimit = 0
	}
	return repositories.GetPatients(clinicID, input.Search, input.CreatedFrom, input.CreatedTo, input.Page, pageLimit)
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
		ClinicID:              clinicID,
		Name:                  input.Name,
		Phone:                 input.Phone,
		Email:                 input.Email,
		Notes:                 input.Notes,
		Gender:                input.Gender,
		BloodType:             input.BloodType,
		Allergies:             input.Allergies,
		ChronicConditions:     input.ChronicConditions,
		EmergencyContactName:  input.EmergencyContactName,
		EmergencyContactPhone: input.EmergencyContactPhone,
		Address:               input.Address,
		Insurance:             input.Insurance,
		Occupation:            input.Occupation,
		ConsentNotes:          input.ConsentNotes,
	}

	if input.DOB != "" {
		dob, err := time.Parse("2006-01-02", input.DOB)
		if err == nil {
			patient.DOB = &dob
		}
	}

	if input.ConsentGivenAt != "" {
		t, err := time.Parse("2006-01-02", input.ConsentGivenAt)
		if err == nil {
			patient.ConsentGivenAt = &t
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
	if input.Gender != "" {
		patient.Gender = input.Gender
	}
	if input.BloodType != "" {
		patient.BloodType = input.BloodType
	}
	if input.Allergies != "" {
		patient.Allergies = input.Allergies
	}
	if input.ChronicConditions != "" {
		patient.ChronicConditions = input.ChronicConditions
	}
	if input.EmergencyContactName != "" {
		patient.EmergencyContactName = input.EmergencyContactName
	}
	if input.EmergencyContactPhone != "" {
		patient.EmergencyContactPhone = input.EmergencyContactPhone
	}
	if input.Address != "" {
		patient.Address = input.Address
	}
	if input.Insurance != "" {
		patient.Insurance = input.Insurance
	}
	if input.Occupation != "" {
		patient.Occupation = input.Occupation
	}
	if input.ConsentNotes != "" {
		patient.ConsentNotes = input.ConsentNotes
	}
	if input.ConsentGivenAt != "" {
		t, err := time.Parse("2006-01-02", input.ConsentGivenAt)
		if err == nil {
			patient.ConsentGivenAt = &t
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

type PatientHistory struct {
	Patient models.Patient         `json:"patient"`
	Records []models.MedicalRecord `json:"records"`
}

type PatientHistoryResponse struct {
	Patient models.PatientResponse        `json:"patient"`
	Records []models.MedicalRecordResponse `json:"records"`
}

func (h PatientHistory) ToResponse() PatientHistoryResponse {
	return PatientHistoryResponse{
		Patient: h.Patient.ToResponse(),
		Records: models.MedicalRecordsToResponse(h.Records),
	}
}

func GetPatientHistory(id string, clinicID uuid.UUID) (PatientHistory, error) {
	patient, err := repositories.GetPatientHistory(id, clinicID)
	if err != nil {
		if err == gorm.ErrRecordNotFound {
			return PatientHistory{}, ErrNotFound
		}
		return PatientHistory{}, err
	}
	records := patient.MedicalRecords
	if records == nil {
		records = []models.MedicalRecord{}
	}
	patient.MedicalRecords = nil
	return PatientHistory{Patient: patient, Records: records}, nil
}
