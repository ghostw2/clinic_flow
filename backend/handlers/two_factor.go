package handlers

import (
	"errors"
	"net/http"

	"github.com/clinicflow/backend/config"
	"github.com/clinicflow/backend/services"
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

type twoFACodeRequest struct {
	Code string `json:"code" binding:"required,len=6"`
}

// POST /api/auth/2fa/setup
// Generates a new TOTP secret and QR code. Requires an active session.
func Setup2FA(c *gin.Context) {
	userID := c.MustGet("user_id").(uuid.UUID)

	secret, qrDataURL, err := services.Setup2FA(userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to setup 2FA"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"secret":  secret,
		"qr_code": qrDataURL,
	})
}

// POST /api/auth/2fa/enable
// Confirms the first TOTP code to activate 2FA on the account.
func Enable2FA(c *gin.Context) {
	userID := c.MustGet("user_id").(uuid.UUID)

	var req twoFACodeRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if err := services.Enable2FA(userID, req.Code); err != nil {
		if errors.Is(err, services.ErrInvalidCode) {
			c.JSON(http.StatusBadRequest, gin.H{"error": "invalid verification code"})
			return
		}
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "2FA enabled successfully"})
}

// POST /api/auth/2fa/verify
// Completes a 2FA login — exchanges pre_auth_token + TOTP code for a full session.
func Verify2FA(c *gin.Context) {
	var req struct {
		PreAuthToken string `json:"pre_auth_token" binding:"required"`
		Code         string `json:"code" binding:"required,len=6"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	session, user, err := services.Verify2FA(req.PreAuthToken, req.Code)
	if err != nil {
		if errors.Is(err, services.ErrNotFound) || errors.Is(err, services.ErrInvalidCode) {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "invalid or expired token"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "verification failed"})
		return
	}

	maxAge := config.App.SessionExpiryHours * 3600
	setSessionCookie(c, session.ID, maxAge)
	c.JSON(http.StatusOK, gin.H{"user": user})
}

// POST /api/auth/2fa/disable
// Disables 2FA after verifying the current TOTP code.
func Disable2FA(c *gin.Context) {
	userID := c.MustGet("user_id").(uuid.UUID)

	var req twoFACodeRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if err := services.Disable2FA(userID, req.Code); err != nil {
		if errors.Is(err, services.ErrInvalidCode) {
			c.JSON(http.StatusBadRequest, gin.H{"error": "invalid verification code"})
			return
		}
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "2FA disabled successfully"})
}
