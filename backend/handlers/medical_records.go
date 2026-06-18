package handlers

import (
	"github.com/clinicflow/backend/models"
	"github.com/clinicflow/backend/pkg/response"
	"github.com/clinicflow/backend/services"
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

func auditRecord(c *gin.Context, action string, recordID uuid.UUID) {
	clinicID := c.MustGet("clinic_id").(uuid.UUID)
	userID := c.MustGet("user_id").(uuid.UUID)
	userName, _ := c.Get("user_name")
	name, _ := userName.(string)
	services.LogAudit(services.AuditInput{
		ClinicID:     clinicID,
		UserID:       userID,
		UserName:     name,
		Action:       action,
		ResourceType: "medical_record",
		ResourceID:   recordID,
		IPAddress:    c.ClientIP(),
	})
}

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
		response.BadRequest(c, "validation.invalid_id")
		return
	}

	records, err := services.ListMedicalRecords(patientID, clinicID)
	if handleErr(c, err) {
		return
	}

	response.OK(c, gin.H{"records": models.MedicalRecordsToResponse(records)})
}

// POST /api/patients/:id/records
func CreateMedicalRecord(c *gin.Context) {
	clinicID := c.MustGet("clinic_id").(uuid.UUID)

	patientID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		response.BadRequest(c, "validation.invalid_id")
		return
	}

	var req CreateMedicalRecordRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, "validation.invalid_input")
		return
	}

	doctorID, err := uuid.Parse(req.DoctorID)
	if err != nil {
		response.BadRequest(c, "validation.invalid_id")
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
			response.BadRequest(c, "validation.invalid_id")
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
		response.InternalError(c, "record.create_failed")
		return
	}

	auditRecord(c, "record.created", record.ID)
	response.Created(c, record.ToResponse())
}

// PUT /api/patients/:id/records/:recordId
func UpdateMedicalRecord(c *gin.Context) {
	clinicID := c.MustGet("clinic_id").(uuid.UUID)

	recordID, err := uuid.Parse(c.Param("recordId"))
	if err != nil {
		response.BadRequest(c, "validation.invalid_id")
		return
	}

	var req UpdateMedicalRecordRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, "validation.invalid_input")
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

	record, err := services.UpdateMedicalRecord(recordID.String(), clinicID, input)
	if handleErr(c, err) {
		return
	}

	auditRecord(c, "record.updated", recordID)
	response.OK(c, record.ToResponse())
}

// DELETE /api/patients/:id/records/:recordId
func DeleteMedicalRecord(c *gin.Context) {
	clinicID := c.MustGet("clinic_id").(uuid.UUID)

	recordID, err := uuid.Parse(c.Param("recordId"))
	if err != nil {
		response.BadRequest(c, "validation.invalid_id")
		return
	}

	if err := services.DeleteMedicalRecord(recordID.String(), clinicID); handleErr(c, err) {
		return
	}

	auditRecord(c, "record.deleted", recordID)
	response.Message(c, "record deleted")
}
