package services

import (
	"encoding/json"

	"github.com/clinicflow/backend/repositories"
	"github.com/google/uuid"
)

var AllActions = []string{
	"appointment.create",
	"appointment.update",
	"appointment.update_status",
	"appointment.delete",
	"patient.create",
	"patient.update",
	"patient.delete",
	"record.create",
	"record.update",
	"record.delete",
	"document.upload",
	"document.delete",
}

var DefaultPermissions = map[string][]string{
	"doctor": {
		"appointment.create", "appointment.update", "appointment.update_status",
		"patient.create", "patient.update",
		"record.create", "record.update", "record.delete",
		"document.upload", "document.delete",
	},
	"staff": {
		"appointment.create", "appointment.update_status",
		"patient.create", "patient.update",
		"document.upload",
	},
}

func HasPermission(perms map[string][]string, role, action string) bool {
	if role == "admin" {
		return true
	}
	for _, a := range perms[role] {
		if a == action {
			return true
		}
	}
	return false
}

func GetPermissions(clinicID uuid.UUID) (map[string][]string, error) {
	clinic, err := repositories.GetClinicByID(clinicID)
	if err != nil {
		return DefaultPermissions, nil
	}
	if clinic.Permissions == "" || clinic.Permissions == "{}" {
		return DefaultPermissions, nil
	}
	var perms map[string][]string
	if err := json.Unmarshal([]byte(clinic.Permissions), &perms); err != nil {
		return DefaultPermissions, nil
	}
	return perms, nil
}

func UpdatePermissions(clinicID uuid.UUID, perms map[string][]string) error {
	// Validate action keys; drop unknown ones
	validSet := make(map[string]bool, len(AllActions))
	for _, a := range AllActions {
		validSet[a] = true
	}
	clean := make(map[string][]string)
	for role, actions := range perms {
		if role == "admin" {
			continue // admin always has full access — never stored
		}
		var filtered []string
		seen := map[string]bool{}
		for _, a := range actions {
			if validSet[a] && !seen[a] {
				filtered = append(filtered, a)
				seen[a] = true
			}
		}
		clean[role] = filtered
	}
	b, err := json.Marshal(clean)
	if err != nil {
		return err
	}
	return repositories.UpdateClinicPermissions(clinicID, string(b))
}

func SeedDefaultPermissions(clinicID uuid.UUID) error {
	b, err := json.Marshal(DefaultPermissions)
	if err != nil {
		return err
	}
	return repositories.UpdateClinicPermissions(clinicID, string(b))
}
