package handlers

import (
	"github.com/clinicflow/backend/pkg/response"
	"github.com/clinicflow/backend/repositories"
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

// GET /api/patients/:id/audit
func GetPatientAuditLog(c *gin.Context) {
	clinicID := c.MustGet("clinic_id").(uuid.UUID)

	patientID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		response.BadRequest(c, "validation.invalid_id")
		return
	}

	logs, err := repositories.GetAuditLogsForResource(clinicID, patientID, 100)
	if err != nil {
		response.InternalError(c, "audit.fetch_failed")
		return
	}

	response.OK(c, gin.H{"logs": logs})
}
