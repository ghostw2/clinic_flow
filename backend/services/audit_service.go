package services

import (
	"encoding/json"

	"github.com/clinicflow/backend/models"
	"github.com/clinicflow/backend/repositories"
	"github.com/google/uuid"
)

type AuditInput struct {
	ClinicID     uuid.UUID
	UserID       uuid.UUID
	UserName     string
	Action       string
	ResourceType string
	ResourceID   uuid.UUID
	Details      map[string]any
	IPAddress    string
}

func LogAudit(input AuditInput) {
	details := "{}"
	if len(input.Details) > 0 {
		if b, err := json.Marshal(input.Details); err == nil {
			details = string(b)
		}
	}
	log := &models.AuditLog{
		ClinicID:     input.ClinicID,
		UserID:       input.UserID,
		UserName:     input.UserName,
		Action:       input.Action,
		ResourceType: input.ResourceType,
		ResourceID:   input.ResourceID,
		Details:      details,
		IPAddress:    input.IPAddress,
	}
	_ = repositories.CreateAuditLog(log)
}
