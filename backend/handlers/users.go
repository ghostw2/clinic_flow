package handlers

import (
	"net/http"

	"github.com/clinicflow/backend/services"
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

type CreateUserRequest struct {
	Name     string `json:"name" binding:"required"`
	Email    string `json:"email" binding:"required,email"`
	Password string `json:"password" binding:"required,min=8"`
	Role     string `json:"role" binding:"required,oneof=admin doctor staff"`
}

// GET /api/users
func GetUsers(c *gin.Context) {
	clinicID := c.MustGet("clinic_id").(uuid.UUID)

	users, err := services.ListUsers(clinicID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to fetch users"})
		return
	}

	c.JSON(http.StatusOK, users)
}

// POST /api/users (admin only)
func CreateUser(c *gin.Context) {
	clinicID := c.MustGet("clinic_id").(uuid.UUID)

	var req CreateUserRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	user, err := services.CreateUser(clinicID, services.CreateUserInput{
		Name:     req.Name,
		Email:    req.Email,
		Password: req.Password,
		Role:     req.Role,
	})
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "email already in use or create failed"})
		return
	}

	c.JSON(http.StatusCreated, user)
}
