package models

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type AppointmentDocument struct {
	ID            uuid.UUID `json:"id" gorm:"type:uuid;primaryKey"`
	ClinicID      uuid.UUID `json:"clinic_id" gorm:"type:uuid;not null;index"`
	AppointmentID uuid.UUID `json:"appointment_id" gorm:"type:uuid;not null;index"`
	UploadedBy    uuid.UUID `json:"uploaded_by" gorm:"type:uuid;not null"`
	OriginalName  string    `json:"original_name" gorm:"not null"`
	StoredName    string    `json:"-" gorm:"not null"`
	MimeType      string    `json:"mime_type"`
	Size          int64     `json:"size"`
	DocType       string    `json:"doc_type"` // odontogram | dicom | xray | lab | report | photo | other
	CreatedAt     time.Time `json:"created_at"`

	Uploader User `json:"uploader,omitempty" gorm:"foreignKey:UploadedBy"`
}

func (d *AppointmentDocument) BeforeCreate(tx *gorm.DB) error {
	if d.ID == uuid.Nil {
		d.ID = uuid.New()
	}
	return nil
}
