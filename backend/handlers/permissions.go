package handlers

import (
	"github.com/clinicflow/backend/pkg/response"
	"github.com/clinicflow/backend/services"
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

// GET /api/settings/permissions
func GetPermissions(c *gin.Context) {
	clinicID := c.MustGet("clinic_id").(uuid.UUID)

	perms, err := services.GetPermissions(clinicID)
	if err != nil {
		response.InternalError(c, "permissions.fetch_failed")
		return
	}

	response.OK(c, perms)
}

// PUT /api/settings/permissions
func UpdatePermissions(c *gin.Context) {
	clinicID := c.MustGet("clinic_id").(uuid.UUID)

	var req map[string][]string
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, "validation.invalid_input")
		return
	}

	if err := services.UpdatePermissions(clinicID, req); err != nil {
		response.InternalError(c, "permissions.update_failed")
		return
	}

	perms, _ := services.GetPermissions(clinicID)
	response.OK(c, perms)
}
