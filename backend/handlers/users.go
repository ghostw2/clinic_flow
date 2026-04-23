package handlers

import (
	"github.com/clinicflow/backend/pkg/response"
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
		response.InternalError(c, "failed to fetch users")
		return
	}

	response.OK(c, users)
}

// POST /api/users (admin only)
func CreateUser(c *gin.Context) {
	clinicID := c.MustGet("clinic_id").(uuid.UUID)

	var req CreateUserRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, err.Error())
		return
	}

	user, err := services.CreateUser(clinicID, services.CreateUserInput{
		Name:     req.Name,
		Email:    req.Email,
		Password: req.Password,
		Role:     req.Role,
	})
	if err != nil {
		response.InternalError(c, "email already in use or create failed")
		return
	}

	response.Created(c, user)
}
