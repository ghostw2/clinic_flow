package handlers

import (
	"errors"

	"github.com/clinicflow/backend/models"
	"github.com/clinicflow/backend/pkg/response"
	"github.com/clinicflow/backend/services"
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

type VitalSignsRequest struct {
	BloodPressure string `json:"blood_pressure"`
	Temperature   string `json:"temperature"`
	HeartRate     string `json:"heart_rate"`
	Weight        string `json:"weight"`
	Height        string `json:"height"`
	OxygenSat     string `json:"oxygen_saturation"`
}

type CreateMedicalRecordRequest struct {
	AppointmentID  string             `json:"appointment_id"`
	DoctorID       string             `json:"doctor_id" binding:"required"`
	VisitDate      string             `json:"visit_date"`
	ChiefComplaint string             `json:"chief_complaint"`
	Diagnosis      string             `json:"diagnosis"`
	Treatment      string             `json:"treatment"`
	Prescriptions  string             `json:"prescriptions"`
	VitalSigns     *VitalSignsRequest `json:"vital_signs"`
	FollowUpDate   string             `json:"follow_up_date"`
	Notes          string             `json:"notes"`
}

type UpdateMedicalRecordRequest struct {
	ChiefComplaint string             `json:"chief_complaint"`
	Diagnosis      string             `json:"diagnosis"`
	Treatment      string             `json:"treatment"`
	Prescriptions  string             `json:"prescriptions"`
	VitalSigns     *VitalSignsRequest `json:"vital_signs"`
	FollowUpDate   string             `json:"follow_up_date"`
	Notes          string             `json:"notes"`
}

// GET /api/patients/:id/records
func GetMedicalRecords(c *gin.Context) {
	clinicID := c.MustGet("clinic_id").(uuid.UUID)

	patientID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		response.BadRequest(c, "invalid patient id")
		return
	}

	records, err := services.ListMedicalRecords(patientID, clinicID)
	if err != nil {
		response.InternalError(c, "failed to fetch records")
		return
	}

	response.OK(c, gin.H{"records": records})
}

// POST /api/patients/:id/records
func CreateMedicalRecord(c *gin.Context) {
	clinicID := c.MustGet("clinic_id").(uuid.UUID)

	patientID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		response.BadRequest(c, "invalid patient id")
		return
	}

	var req CreateMedicalRecordRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, err.Error())
		return
	}

	doctorID, err := uuid.Parse(req.DoctorID)
	if err != nil {
		response.BadRequest(c, "invalid doctor_id")
		return
	}

	input := services.CreateMedicalRecordInput{
		PatientID:      patientID,
		DoctorID:       doctorID,
		VisitDate:      req.VisitDate,
		ChiefComplaint: req.ChiefComplaint,
		Diagnosis:      req.Diagnosis,
		Treatment:      req.Treatment,
		Prescriptions:  req.Prescriptions,
		FollowUpDate:   req.FollowUpDate,
		Notes:          req.Notes,
	}

	if req.AppointmentID != "" {
		apptID, err := uuid.Parse(req.AppointmentID)
		if err != nil {
			response.BadRequest(c, "invalid appointment_id")
			return
		}
		input.AppointmentID = &apptID
	}

	if req.VitalSigns != nil {
		input.VitalSigns = &models.VitalSigns{
			BloodPressure: req.VitalSigns.BloodPressure,
			Temperature:   req.VitalSigns.Temperature,
			HeartRate:     req.VitalSigns.HeartRate,
			Weight:        req.VitalSigns.Weight,
			Height:        req.VitalSigns.Height,
			OxygenSat:     req.VitalSigns.OxygenSat,
		}
	}

	record, err := services.CreateMedicalRecord(clinicID, input)
	if err != nil {
		response.InternalError(c, "failed to create record")
		return
	}

	response.Created(c, record)
}

// PUT /api/patients/:id/records/:recordId
func UpdateMedicalRecord(c *gin.Context) {
	clinicID := c.MustGet("clinic_id").(uuid.UUID)

	var req UpdateMedicalRecordRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, err.Error())
		return
	}

	input := services.UpdateMedicalRecordInput{
		ChiefComplaint: req.ChiefComplaint,
		Diagnosis:      req.Diagnosis,
		Treatment:      req.Treatment,
		Prescriptions:  req.Prescriptions,
		FollowUpDate:   req.FollowUpDate,
		Notes:          req.Notes,
	}

	if req.VitalSigns != nil {
		input.VitalSigns = &models.VitalSigns{
			BloodPressure: req.VitalSigns.BloodPressure,
			Temperature:   req.VitalSigns.Temperature,
			HeartRate:     req.VitalSigns.HeartRate,
			Weight:        req.VitalSigns.Weight,
			Height:        req.VitalSigns.Height,
			OxygenSat:     req.VitalSigns.OxygenSat,
		}
	}

	record, err := services.UpdateMedicalRecord(c.Param("recordId"), clinicID, input)
	if err != nil {
		if errors.Is(err, services.ErrNotFound) {
			response.NotFound(c, "record not found")
			return
		}
		response.InternalError(c, "failed to update record")
		return
	}

	response.OK(c, record)
}

// DELETE /api/patients/:id/records/:recordId
func DeleteMedicalRecord(c *gin.Context) {
	clinicID := c.MustGet("clinic_id").(uuid.UUID)

	if err := services.DeleteMedicalRecord(c.Param("recordId"), clinicID); err != nil {
		if errors.Is(err, services.ErrNotFound) {
			response.NotFound(c, "record not found")
			return
		}
		response.InternalError(c, "failed to delete record")
		return
	}

	response.Message(c, "record deleted")
}
