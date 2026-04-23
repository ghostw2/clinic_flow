package services

import (
	"time"

	"github.com/clinicflow/backend/models"
	"github.com/clinicflow/backend/repositories"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

type CreateMedicalRecordInput struct {
	PatientID     uuid.UUID
	AppointmentID *uuid.UUID
	DoctorID      uuid.UUID
	VisitDate     string
	ChiefComplaint string
	Diagnosis     string
	Treatment     string
	Prescriptions string
	VitalSigns    *models.VitalSigns
	FollowUpDate  string
	Notes         string
}

type UpdateMedicalRecordInput struct {
	ChiefComplaint string
	Diagnosis      string
	Treatment      string
	Prescriptions  string
	VitalSigns     *models.VitalSigns
	FollowUpDate   string
	Notes          string
}

func ListMedicalRecords(patientID, clinicID uuid.UUID) ([]models.MedicalRecord, error) {
	return repositories.GetMedicalRecords(patientID, clinicID)
}

func GetMedicalRecord(id string, clinicID uuid.UUID) (models.MedicalRecord, error) {
	record, err := repositories.GetMedicalRecordByID(id, clinicID)
	if err != nil {
		if err == gorm.ErrRecordNotFound {
			return models.MedicalRecord{}, ErrNotFound
		}
		return models.MedicalRecord{}, err
	}
	return record, nil
}

func CreateMedicalRecord(clinicID uuid.UUID, input CreateMedicalRecordInput) (models.MedicalRecord, error) {
	record := models.MedicalRecord{
		ClinicID:      clinicID,
		PatientID:     input.PatientID,
		AppointmentID: input.AppointmentID,
		DoctorID:      input.DoctorID,
		ChiefComplaint: input.ChiefComplaint,
		Diagnosis:     input.Diagnosis,
		Treatment:     input.Treatment,
		Prescriptions: input.Prescriptions,
		VitalSigns:    input.VitalSigns,
		Notes:         input.Notes,
	}

	if input.VisitDate != "" {
		t, err := time.Parse("2006-01-02", input.VisitDate)
		if err == nil {
			record.VisitDate = t
		}
	}
	if record.VisitDate.IsZero() {
		record.VisitDate = time.Now()
	}

	if input.FollowUpDate != "" {
		t, err := time.Parse("2006-01-02", input.FollowUpDate)
		if err == nil {
			record.FollowUpDate = &t
		}
	}

	if err := repositories.CreateMedicalRecord(&record); err != nil {
		return models.MedicalRecord{}, err
	}
	return record, nil
}

func UpdateMedicalRecord(id string, clinicID uuid.UUID, input UpdateMedicalRecordInput) (models.MedicalRecord, error) {
	record, err := repositories.GetMedicalRecordByID(id, clinicID)
	if err != nil {
		if err == gorm.ErrRecordNotFound {
			return models.MedicalRecord{}, ErrNotFound
		}
		return models.MedicalRecord{}, err
	}

	if input.ChiefComplaint != "" {
		record.ChiefComplaint = input.ChiefComplaint
	}
	if input.Diagnosis != "" {
		record.Diagnosis = input.Diagnosis
	}
	if input.Treatment != "" {
		record.Treatment = input.Treatment
	}
	if input.Prescriptions != "" {
		record.Prescriptions = input.Prescriptions
	}
	if input.VitalSigns != nil {
		record.VitalSigns = input.VitalSigns
	}
	if input.Notes != "" {
		record.Notes = input.Notes
	}
	if input.FollowUpDate != "" {
		t, err := time.Parse("2006-01-02", input.FollowUpDate)
		if err == nil {
			record.FollowUpDate = &t
		}
	}

	if err := repositories.SaveMedicalRecord(&record); err != nil {
		return models.MedicalRecord{}, err
	}
	return record, nil
}

func DeleteMedicalRecord(id string, clinicID uuid.UUID) error {
	record, err := repositories.GetMedicalRecordByID(id, clinicID)
	if err != nil {
		if err == gorm.ErrRecordNotFound {
			return ErrNotFound
		}
		return err
	}
	return repositories.DeleteMedicalRecord(&record)
}
