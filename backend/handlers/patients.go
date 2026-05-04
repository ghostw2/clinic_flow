package handlers

import (
	"errors"

	"github.com/clinicflow/backend/pkg/response"
	"github.com/clinicflow/backend/services"
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

type GetPatientsQuery struct {
	Page   int    `form:"page" binding:"omitempty,min=1"`
	Search string `form:"search"`
}

type CreatePatientRequest struct {
	Name                  string `json:"name" binding:"required"`
	DOB                   string `json:"dob"`
	Phone                 string `json:"phone"`
	Email                 string `json:"email"`
	Notes                 string `json:"notes"`
	Gender                string `json:"gender"`
	BloodType             string `json:"blood_type"`
	Allergies             string `json:"allergies"`
	ChronicConditions     string `json:"chronic_conditions"`
	EmergencyContactName  string `json:"emergency_contact_name"`
	EmergencyContactPhone string `json:"emergency_contact_phone"`
	Address               string `json:"address"`
	Insurance             string `json:"insurance"`
	Occupation            string `json:"occupation"`
}

type UpdatePatientRequest struct {
	Name                  string `json:"name"`
	DOB                   string `json:"dob"`
	Phone                 string `json:"phone"`
	Email                 string `json:"email"`
	Notes                 string `json:"notes"`
	Gender                string `json:"gender"`
	BloodType             string `json:"blood_type"`
	Allergies             string `json:"allergies"`
	ChronicConditions     string `json:"chronic_conditions"`
	EmergencyContactName  string `json:"emergency_contact_name"`
	EmergencyContactPhone string `json:"emergency_contact_phone"`
	Address               string `json:"address"`
	Insurance             string `json:"insurance"`
	Occupation            string `json:"occupation"`
}

// GET /api/patients
func GetPatients(c *gin.Context) {
	clinicID := c.MustGet("clinic_id").(uuid.UUID)

	var q GetPatientsQuery
	if err := c.ShouldBindQuery(&q); err != nil {
		response.BadRequest(c, err.Error())
		return
	}
	if q.Page == 0 {
		q.Page = 1
	}

	patients, total, err := services.ListPatients(clinicID, q.Search, q.Page)
	if err != nil {
		response.InternalError(c, "failed to fetch patients")
		return
	}

	response.OK(c, gin.H{"patients": patients, "total": total})
}

// GET /api/patients/:id
func GetPatient(c *gin.Context) {
	clinicID := c.MustGet("clinic_id").(uuid.UUID)

	patientID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		response.BadRequest(c, "invalid patient id")
		return
	}

	patient, err := services.GetPatient(patientID.String(), clinicID)
	if err != nil {
		if errors.Is(err, services.ErrNotFound) {
			response.NotFound(c, "patient not found")
			return
		}
		response.InternalError(c, "failed to fetch patient")
		return
	}

	response.OK(c, patient)
}

// POST /api/patients
func CreatePatient(c *gin.Context) {
	clinicID := c.MustGet("clinic_id").(uuid.UUID)

	var req CreatePatientRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, err.Error())
		return
	}

	patient, err := services.CreatePatient(clinicID, services.CreatePatientInput{
		Name:                  req.Name,
		DOB:                   req.DOB,
		Phone:                 req.Phone,
		Email:                 req.Email,
		Notes:                 req.Notes,
		Gender:                req.Gender,
		BloodType:             req.BloodType,
		Allergies:             req.Allergies,
		ChronicConditions:     req.ChronicConditions,
		EmergencyContactName:  req.EmergencyContactName,
		EmergencyContactPhone: req.EmergencyContactPhone,
		Address:               req.Address,
		Insurance:             req.Insurance,
		Occupation:            req.Occupation,
	})
	if err != nil {
		response.InternalError(c, "failed to create patient")
		return
	}

	response.Created(c, patient)
}

// PUT /api/patients/:id
func UpdatePatient(c *gin.Context) {
	clinicID := c.MustGet("clinic_id").(uuid.UUID)

	patientID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		response.BadRequest(c, "invalid patient id")
		return
	}

	var req UpdatePatientRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, err.Error())
		return
	}

	patient, err := services.UpdatePatient(patientID.String(), clinicID, services.UpdatePatientInput{
		Name:                  req.Name,
		DOB:                   req.DOB,
		Phone:                 req.Phone,
		Email:                 req.Email,
		Notes:                 req.Notes,
		Gender:                req.Gender,
		BloodType:             req.BloodType,
		Allergies:             req.Allergies,
		ChronicConditions:     req.ChronicConditions,
		EmergencyContactName:  req.EmergencyContactName,
		EmergencyContactPhone: req.EmergencyContactPhone,
		Address:               req.Address,
		Insurance:             req.Insurance,
		Occupation:            req.Occupation,
	})
	if err != nil {
		if errors.Is(err, services.ErrNotFound) {
			response.NotFound(c, "patient not found")
			return
		}
		response.InternalError(c, "failed to update patient")
		return
	}

	response.OK(c, patient)
}

// DELETE /api/patients/:id
func DeletePatient(c *gin.Context) {
	clinicID := c.MustGet("clinic_id").(uuid.UUID)

	patientID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		response.BadRequest(c, "invalid patient id")
		return
	}

	if err := services.DeletePatient(patientID.String(), clinicID); err != nil {
		if errors.Is(err, services.ErrNotFound) {
			response.NotFound(c, "patient not found")
			return
		}
		response.InternalError(c, "failed to delete patient")
		return
	}

	response.Message(c, "patient deleted")
}

// GET /api/patients/:id/history
func GetPatientHistory(c *gin.Context) {
	clinicID := c.MustGet("clinic_id").(uuid.UUID)

	patientID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		response.BadRequest(c, "invalid patient id")
		return
	}

	history, err := services.GetPatientHistory(patientID.String(), clinicID)
	if err != nil {
		if errors.Is(err, services.ErrNotFound) {
			response.NotFound(c, "patient not found")
			return
		}
		response.InternalError(c, "failed to fetch patient history")
		return
	}

	response.OK(c, history)
}
