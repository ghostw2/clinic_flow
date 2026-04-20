package handlers

import (
	"errors"
	"net/http"
	"strconv"

	"github.com/clinicflow/backend/services"
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

type CreatePatientRequest struct {
	Name  string `json:"name" binding:"required"`
	DOB   string `json:"dob"`
	Phone string `json:"phone"`
	Email string `json:"email"`
	Notes string `json:"notes"`
}

type UpdatePatientRequest struct {
	Name  string `json:"name"`
	DOB   string `json:"dob"`
	Phone string `json:"phone"`
	Email string `json:"email"`
	Notes string `json:"notes"`
}

// GET /api/patients
func GetPatients(c *gin.Context) {
	clinicID := c.MustGet("clinic_id").(uuid.UUID)

	page := 1
	if p := c.Query("page"); p != "" {
		if n, err := strconv.Atoi(p); err == nil && n > 0 {
			page = n
		}
	}

	patients, total, err := services.ListPatients(clinicID, c.Query("search"), page)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to fetch patients"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"patients": patients, "total": total})
}

// GET /api/patients/:id
func GetPatient(c *gin.Context) {
	clinicID := c.MustGet("clinic_id").(uuid.UUID)

	patient, err := services.GetPatient(c.Param("id"), clinicID)
	if err != nil {
		if errors.Is(err, services.ErrNotFound) {
			c.JSON(http.StatusNotFound, gin.H{"error": "patient not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to fetch patient"})
		return
	}

	c.JSON(http.StatusOK, patient)
}

// POST /api/patients
func CreatePatient(c *gin.Context) {
	clinicID := c.MustGet("clinic_id").(uuid.UUID)

	var req CreatePatientRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	patient, err := services.CreatePatient(clinicID, services.CreatePatientInput{
		Name:  req.Name,
		DOB:   req.DOB,
		Phone: req.Phone,
		Email: req.Email,
		Notes: req.Notes,
	})
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to create patient"})
		return
	}

	c.JSON(http.StatusCreated, patient)
}

// PUT /api/patients/:id
func UpdatePatient(c *gin.Context) {
	clinicID := c.MustGet("clinic_id").(uuid.UUID)

	var req UpdatePatientRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	patient, err := services.UpdatePatient(c.Param("id"), clinicID, services.UpdatePatientInput{
		Name:  req.Name,
		DOB:   req.DOB,
		Phone: req.Phone,
		Email: req.Email,
		Notes: req.Notes,
	})
	if err != nil {
		if errors.Is(err, services.ErrNotFound) {
			c.JSON(http.StatusNotFound, gin.H{"error": "patient not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to update patient"})
		return
	}

	c.JSON(http.StatusOK, patient)
}

// DELETE /api/patients/:id
func DeletePatient(c *gin.Context) {
	clinicID := c.MustGet("clinic_id").(uuid.UUID)

	if err := services.DeletePatient(c.Param("id"), clinicID); err != nil {
		if errors.Is(err, services.ErrNotFound) {
			c.JSON(http.StatusNotFound, gin.H{"error": "patient not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to delete patient"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "patient deleted"})
}
