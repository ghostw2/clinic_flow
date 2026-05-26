package models

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type VitalSigns struct {
	BloodPressure string `json:"blood_pressure,omitempty"`
	Temperature   string `json:"temperature,omitempty"`
	HeartRate     string `json:"heart_rate,omitempty"`
	Weight        string `json:"weight,omitempty"`
	Height        string `json:"height,omitempty"`
	OxygenSat     string `json:"oxygen_saturation,omitempty"`
}

type MedicalRecord struct {
	ID            uuid.UUID      `json:"id" gorm:"type:uuid;primaryKey"`
	ClinicID      uuid.UUID      `json:"clinic_id" gorm:"type:uuid;not null"`
	PatientID     uuid.UUID      `json:"patient_id" gorm:"type:uuid;not null"`
	AppointmentID *uuid.UUID     `json:"appointment_id" gorm:"type:uuid"`
	DoctorID      uuid.UUID      `json:"doctor_id" gorm:"type:uuid;not null"`
	VisitDate     time.Time      `json:"visit_date" gorm:"not null"`
	ChiefComplaint string        `json:"chief_complaint"`
	Diagnosis     string         `json:"diagnosis"`
	Treatment     string         `json:"treatment"`
	Prescriptions string         `json:"prescriptions"`
	VitalSigns    *VitalSigns    `json:"vital_signs" gorm:"serializer:json"`
	FollowUpDate  *time.Time     `json:"follow_up_date"`
	Notes         string         `json:"notes"`
	CreatedAt     time.Time      `json:"created_at"`
	UpdatedAt     time.Time      `json:"updated_at"`
	DeletedAt     gorm.DeletedAt `json:"-" gorm:"index"`

	Doctor      User         `json:"doctor,omitempty" gorm:"foreignKey:DoctorID"`
	Appointment *Appointment `json:"appointment,omitempty" gorm:"foreignKey:AppointmentID"`
}

func (r *MedicalRecord) BeforeCreate(tx *gorm.DB) error {
	if r.ID == uuid.Nil {
		r.ID = uuid.New()
	}
	return nil
}

type MedicalRecordResponse struct {
	ID             uuid.UUID            `json:"id"`
	PatientID      uuid.UUID            `json:"patient_id"`
	AppointmentID  *uuid.UUID           `json:"appointment_id,omitempty"`
	DoctorID       uuid.UUID            `json:"doctor_id"`
	VisitDate      time.Time            `json:"visit_date"`
	ChiefComplaint string               `json:"chief_complaint,omitempty"`
	Diagnosis      string               `json:"diagnosis,omitempty"`
	Treatment      string               `json:"treatment,omitempty"`
	Prescriptions  string               `json:"prescriptions,omitempty"`
	VitalSigns     *VitalSigns          `json:"vital_signs,omitempty"`
	FollowUpDate   *time.Time           `json:"follow_up_date,omitempty"`
	Notes          string               `json:"notes,omitempty"`
	CreatedAt      time.Time            `json:"created_at"`
	UpdatedAt      time.Time            `json:"updated_at"`
	Doctor         *UserResponse        `json:"doctor,omitempty"`
	Appointment    *AppointmentResponse `json:"appointment,omitempty"`
}

func (r MedicalRecord) ToResponse() MedicalRecordResponse {
	resp := MedicalRecordResponse{
		ID:             r.ID,
		PatientID:      r.PatientID,
		AppointmentID:  r.AppointmentID,
		DoctorID:       r.DoctorID,
		VisitDate:      r.VisitDate,
		ChiefComplaint: r.ChiefComplaint,
		Diagnosis:      r.Diagnosis,
		Treatment:      r.Treatment,
		Prescriptions:  r.Prescriptions,
		VitalSigns:     r.VitalSigns,
		FollowUpDate:   r.FollowUpDate,
		Notes:          r.Notes,
		CreatedAt:      r.CreatedAt,
		UpdatedAt:      r.UpdatedAt,
	}
	if r.Doctor.ID != uuid.Nil {
		d := r.Doctor.ToResponse()
		resp.Doctor = &d
	}
	if r.Appointment != nil && r.Appointment.ID != uuid.Nil {
		a := r.Appointment.ToResponse()
		resp.Appointment = &a
	}
	return resp
}

func MedicalRecordsToResponse(records []MedicalRecord) []MedicalRecordResponse {
	result := make([]MedicalRecordResponse, len(records))
	for i, r := range records {
		result[i] = r.ToResponse()
	}
	return result
}
