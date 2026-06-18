package handlers

import (
	"errors"

	"github.com/clinicflow/backend/pkg/response"
	"github.com/clinicflow/backend/services"
	"github.com/gin-gonic/gin"
)

// handleErr maps service errors to HTTP responses. Returns true if an error was handled.
func handleErr(c *gin.Context, err error) bool {
	if err == nil {
		return false
	}
	switch {
	case errors.Is(err, services.ErrNotFound):
		response.NotFound(c, "not_found")
	case errors.Is(err, services.ErrConflict):
		response.Conflict(c, "conflict")
	case errors.Is(err, services.ErrForbidden):
		response.Forbidden(c, "forbidden")
	default:
		response.InternalError(c, "internal_error")
	}
	return true
}
