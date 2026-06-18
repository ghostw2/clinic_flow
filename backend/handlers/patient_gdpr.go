package handlers

import (
	"fmt"
	"time"

	"github.com/clinicflow/backend/models"
	"github.com/clinicflow/backend/pkg/response"
	"github.com/clinicflow/backend/repositories"
	"github.com/clinicflow/backend/services"
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

// GET /api/patients/:id/history
func GetPatientHistory(c *gin.Context) {
	clinicID := c.MustGet("clinic_id").(uuid.UUID)

	patientID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		response.BadRequest(c, "validation.invalid_id")
		return
	}

	history, err := services.GetPatientHistory(patientID.String(), clinicID)
	if handleErr(c, err) {
		return
	}

	resp := history.ToResponse()
	response.OK(c, gin.H{"records": resp.Records})
}

// GET /api/patients/:id/export
func ExportPatient(c *gin.Context) {
	clinicID := c.MustGet("clinic_id").(uuid.UUID)
	userID := c.MustGet("user_id").(uuid.UUID)
	userName, _ := c.Get("user_name")

	patientID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		response.BadRequest(c, "validation.invalid_id")
		return
	}

	patient, err := repositories.GetPatientWithRecordsAndAppointments(patientID.String(), clinicID)
	if handleErr(c, err) {
		return
	}

	name, _ := userName.(string)
	services.LogAudit(services.AuditInput{
		ClinicID:     clinicID,
		UserID:       userID,
		UserName:     name,
		Action:       "patient.exported",
		ResourceType: "patient",
		ResourceID:   patientID,
		IPAddress:    c.ClientIP(),
	})

	export := gin.H{
		"exported_at":     time.Now().UTC(),
		"exported_by":     name,
		"patient":         patient.ToResponse(),
		"medical_records": models.MedicalRecordsToResponse(patient.MedicalRecords),
		"appointments":    models.AppointmentsToResponse(patient.Appointments),
	}

	filename := fmt.Sprintf("patient_%s_export.json", patientID.String())
	c.Header("Content-Disposition", fmt.Sprintf(`attachment; filename="%s"`, filename))
	c.JSON(200, export)
}

// DELETE /api/patients/:id/purge
func PurgePatient(c *gin.Context) {
	clinicID := c.MustGet("clinic_id").(uuid.UUID)
	userID := c.MustGet("user_id").(uuid.UUID)
	userName, _ := c.Get("user_name")

	patientID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		response.BadRequest(c, "validation.invalid_id")
		return
	}

	name, _ := userName.(string)

	if err := repositories.PurgePatient(patientID, clinicID); err != nil {
		response.InternalError(c, "patient.purge_failed")
		return
	}

	services.LogAudit(services.AuditInput{
		ClinicID:     clinicID,
		UserID:       userID,
		UserName:     name,
		Action:       "patient.purged",
		ResourceType: "patient",
		ResourceID:   patientID,
		IPAddress:    c.ClientIP(),
	})

	response.Message(c, "patient permanently deleted")
}

// GET /api/patients/:id/audit
func GetPatientAuditLog(c *gin.Context) {
	clinicID := c.MustGet("clinic_id").(uuid.UUID)

	patientID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		response.BadRequest(c, "validation.invalid_id")
		return
	}

	logs, err := repositories.GetAuditLogsForResource(clinicID, patientID, 100)
	if handleErr(c, err) {
		return
	}

	response.OK(c, gin.H{"logs": logs})
}
