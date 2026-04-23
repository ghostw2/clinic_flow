package handlers

import (
	"errors"
	"net/http"

	"github.com/clinicflow/backend/config"
	"github.com/clinicflow/backend/middleware"
	"github.com/clinicflow/backend/pkg/response"
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
		true,
	)
}

// POST /api/auth/login
func Login(c *gin.Context) {
	var req LoginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, err.Error())
		return
	}

	result, err := services.Login(req.Email, req.Password)
	if err != nil {
		if errors.Is(err, services.ErrNotFound) {
			response.Unauthorized(c, "invalid credentials")
			return
		}
		response.InternalError(c, "failed to login")
		return
	}

	if result.Requires2FA {
		response.OK(c, gin.H{
			"requires_2fa":   true,
			"pre_auth_token": result.PreAuthToken,
		})
		return
	}

	maxAge := config.App.SessionExpiryHours * 3600
	setSessionCookie(c, result.Session.ID, maxAge)
	response.OK(c, gin.H{"user": result.User})
}

// POST /api/auth/logout
func Logout(c *gin.Context) {
	if sessionID, err := c.Cookie(middleware.SessionCookie); err == nil {
		services.Logout(sessionID)
	}
	setSessionCookie(c, "", -1)
	response.Message(c, "logged out")
}

// GET /api/auth/me
func Me(c *gin.Context) {
	userID := c.MustGet("user_id").(uuid.UUID)

	user, err := repositories.GetUserWithClinic(userID)
	if err != nil {
		response.Unauthorized(c, "user not found")
		return
	}

	response.OK(c, user)
}

// POST /api/auth/refresh
func Refresh(c *gin.Context) {
	sessionID, err := c.Cookie(middleware.SessionCookie)
	if err != nil || sessionID == "" {
		response.Unauthorized(c, "not authenticated")
		return
	}

	if err := services.RefreshSession(sessionID); err != nil {
		if errors.Is(err, services.ErrNotFound) {
			response.Unauthorized(c, "session expired")
			return
		}
		response.InternalError(c, "failed to refresh session")
		return
	}

	maxAge := config.App.SessionExpiryHours * 3600
	setSessionCookie(c, sessionID, maxAge)
	response.Message(c, "session refreshed")
}
