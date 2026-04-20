package handlers

import (
	"errors"
	"net/http"

	"github.com/clinicflow/backend/config"
	"github.com/clinicflow/backend/middleware"
	"github.com/clinicflow/backend/repositories"
	"github.com/clinicflow/backend/services"
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

type LoginRequest struct {
	Email    string `json:"email" binding:"required,email"`
	Password string `json:"password" binding:"required,min=6"`
}

func setSessionCookie(c *gin.Context, sessionID string, maxAge int) {
	c.SetSameSite(http.SameSiteLaxMode)
	c.SetCookie(
		middleware.SessionCookie,
		sessionID,
		maxAge,
		"/",
		"",
		config.App.SessionSecure,
		true, // httpOnly
	)
}

// POST /api/auth/login
func Login(c *gin.Context) {
	var req LoginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	result, err := services.Login(req.Email, req.Password)
	if err != nil {
		if errors.Is(err, services.ErrNotFound) {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "invalid credentials"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to login"})
		return
	}

	if result.Requires2FA {
		c.JSON(http.StatusOK, gin.H{
			"requires_2fa":   true,
			"pre_auth_token": result.PreAuthToken,
		})
		return
	}

	maxAge := config.App.SessionExpiryHours * 3600
	setSessionCookie(c, result.Session.ID, maxAge)
	c.JSON(http.StatusOK, gin.H{"user": result.User})
}

// POST /api/auth/logout
func Logout(c *gin.Context) {
	if sessionID, err := c.Cookie(middleware.SessionCookie); err == nil {
		services.Logout(sessionID)
	}
	setSessionCookie(c, "", -1) // clear cookie
	c.JSON(http.StatusOK, gin.H{"message": "logged out"})
}

// GET /api/auth/me
func Me(c *gin.Context) {
	userID := c.MustGet("user_id").(uuid.UUID)

	user, err := repositories.GetUserWithClinic(userID)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "user not found"})
		return
	}

	c.JSON(http.StatusOK, user)
}

// POST /api/auth/refresh
func Refresh(c *gin.Context) {
	sessionID, err := c.Cookie(middleware.SessionCookie)
	if err != nil || sessionID == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "not authenticated"})
		return
	}

	if err := services.RefreshSession(sessionID); err != nil {
		if errors.Is(err, services.ErrNotFound) {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "session expired"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to refresh session"})
		return
	}

	maxAge := config.App.SessionExpiryHours * 3600
	setSessionCookie(c, sessionID, maxAge) // reissue cookie with new maxAge
	c.JSON(http.StatusOK, gin.H{"message": "session refreshed"})
}
