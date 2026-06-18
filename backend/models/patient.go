package models

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type Patient struct {
	ID        uuid.UUID      `json:"id" gorm:"type:uuid;primaryKey"`
	ClinicID  uuid.UUID      `json:"clinic_id" gorm:"type:uuid;not null"`
	Name      string         `json:"name" gorm:"not null"`
	DOB       *time.Time     `json:"dob"`
	Phone     string         `json:"phone"`
	Email     string         `json:"email"`
	Notes     string         `json:"notes"`
	CreatedAt time.Time      `json:"created_at"`
	UpdatedAt time.Time      `json:"updated_at"`
	DeletedAt gorm.DeletedAt `json:"-" gorm:"index"`

	// Medical profile
	Gender                 string `json:"gender"`
	BloodType              string `json:"blood_type"`
	Allergies              string `json:"allergies"`
	ChronicConditions      string `json:"chronic_conditions"`
	EmergencyContactName   string `json:"emergency_contact_name"`
	EmergencyContactPhone  string `json:"emergency_contact_phone"`
	Address                string `json:"address"`
	Insurance              string `json:"insurance"`
	Occupation             string `json:"occupation"`

	// GDPR consent
	ConsentGivenAt *time.Time `json:"consent_given_at" gorm:"column:consent_given_at"`
	ConsentNotes   string     `json:"consent_notes" gorm:"column:consent_notes"`

	Appointments   []Appointment   `json:"appointments,omitempty" gorm:"foreignKey:PatientID"`
	MedicalRecords []MedicalRecord `json:"medical_records,omitempty" gorm:"foreignKey:PatientID"`
}

func (p *Patient) BeforeCreate(tx *gorm.DB) error {
	if p.ID == uuid.Nil {
		p.ID = uuid.New()
	}
	return nil
}

type PatientResponse struct {
	ID                    uuid.UUID               `json:"id"`
	Name                  string                  `json:"name"`
	DOB                   *time.Time              `json:"dob,omitempty"`
	Phone                 string                  `json:"phone,omitempty"`
	Email                 string                  `json:"email,omitempty"`
	Notes                 string                  `json:"notes,omitempty"`
	Gender                string                  `json:"gender,omitempty"`
	BloodType             string                  `json:"blood_type,omitempty"`
	Allergies             string                  `json:"allergies,omitempty"`
	ChronicConditions     string                  `json:"chronic_conditions,omitempty"`
	EmergencyContactName  string                  `json:"emergency_contact_name,omitempty"`
	EmergencyContactPhone string                  `json:"emergency_contact_phone,omitempty"`
	Address               string                  `json:"address,omitempty"`
	Insurance             string                  `json:"insurance,omitempty"`
	Occupation            string                  `json:"occupation,omitempty"`
	ConsentGivenAt        *time.Time              `json:"consent_given_at,omitempty"`
	ConsentNotes          string                  `json:"consent_notes,omitempty"`
	CreatedAt             time.Time               `json:"created_at"`
	UpdatedAt             time.Time               `json:"updated_at"`
	Appointments          []AppointmentResponse   `json:"appointments,omitempty"`
	MedicalRecords        []MedicalRecordResponse `json:"medical_records,omitempty"`
}

func (p Patient) ToResponse() PatientResponse {
	r := PatientResponse{
		ID:                    p.ID,
		Name:                  p.Name,
		DOB:                   p.DOB,
		Phone:                 p.Phone,
		Email:                 p.Email,
		Notes:                 p.Notes,
		Gender:                p.Gender,
		BloodType:             p.BloodType,
		Allergies:             p.Allergies,
		ChronicConditions:     p.ChronicConditions,
		EmergencyContactName:  p.EmergencyContactName,
		EmergencyContactPhone: p.EmergencyContactPhone,
		Address:               p.Address,
		Insurance:             p.Insurance,
		Occupation:            p.Occupation,
		ConsentGivenAt:        p.ConsentGivenAt,
		ConsentNotes:          p.ConsentNotes,
		CreatedAt:             p.CreatedAt,
		UpdatedAt:             p.UpdatedAt,
	}
	for _, a := range p.Appointments {
		r.Appointments = append(r.Appointments, a.ToResponse())
	}
	for _, mr := range p.MedicalRecords {
		r.MedicalRecords = append(r.MedicalRecords, mr.ToResponse())
	}
	return r
}

func PatientsToResponse(patients []Patient) []PatientResponse {
	result := make([]PatientResponse, len(patients))
	for i, p := range patients {
		result[i] = p.ToResponse()
	}
	return result
}
