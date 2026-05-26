package handlers

import (
	"errors"

	"github.com/clinicflow/backend/config"
	"github.com/clinicflow/backend/pkg/response"
	"github.com/clinicflow/backend/services"
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

type twoFACodeRequest struct {
	Code string `json:"code" binding:"required,len=6"`
}

// POST /api/auth/2fa/setup
func Setup2FA(c *gin.Context) {
	userID := c.MustGet("user_id").(uuid.UUID)

	secret, qrDataURL, err := services.Setup2FA(userID)
	if err != nil {
		if errors.Is(err, services.ErrForbidden) {
			response.Forbidden(c, "auth.2fa_setup_failed")
			return
		}
		response.InternalError(c, "auth.2fa_setup_failed")
		return
	}

	response.OK(c, gin.H{
		"secret":  secret,
		"qr_code": qrDataURL,
	})
}

// POST /api/auth/2fa/enable
func Enable2FA(c *gin.Context) {
	userID := c.MustGet("user_id").(uuid.UUID)

	var req twoFACodeRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, "validation.invalid_input")
		return
	}

	if err := services.Enable2FA(userID, req.Code); err != nil {
		if errors.Is(err, services.ErrInvalidCode) {
			response.BadRequest(c, "auth.2fa_invalid")
			return
		}
		response.BadRequest(c, "auth.2fa_enable_failed")
		return
	}

	response.Message(c, "2FA enabled successfully")
}

// POST /api/auth/2fa/verify
func Verify2FA(c *gin.Context) {
	var req struct {
		PreAuthToken string `json:"pre_auth_token" binding:"required"`
		Code         string `json:"code" binding:"required,len=6"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, "validation.invalid_input")
		return
	}

	session, user, err := services.Verify2FA(req.PreAuthToken, req.Code)
	if err != nil {
		if errors.Is(err, services.ErrNotFound) || errors.Is(err, services.ErrInvalidCode) {
			response.Unauthorized(c, "auth.2fa_invalid")
			return
		}
		response.InternalError(c, "auth.2fa_invalid")
		return
	}

	maxAge := config.App.SessionExpiryHours * 3600
	setSessionCookie(c, session.ID, maxAge)
	response.OK(c, gin.H{"user": user.ToResponse()})
}

// POST /api/auth/2fa/disable
func Disable2FA(c *gin.Context) {
	userID := c.MustGet("user_id").(uuid.UUID)

	var req twoFACodeRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, "validation.invalid_input")
		return
	}

	if err := services.Disable2FA(userID, req.Code); err != nil {
		if errors.Is(err, services.ErrInvalidCode) {
			response.BadRequest(c, "auth.2fa_invalid")
			return
		}
		response.BadRequest(c, "auth.2fa_disable_failed")
		return
	}

	response.Message(c, "2FA disabled successfully")
}
