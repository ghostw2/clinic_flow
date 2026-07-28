package handlers

import (
	"github.com/clinicflow/backend/pkg/response"
	"github.com/clinicflow/backend/services"
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

type GetTreatmentsQuery struct {
	PatientID string `form:"patient_id"`
	Status    string `form:"status"`
	Page      int    `form:"page"`
}

type CreateTreatmentRequest struct {
	PatientID     string  `json:"patient_id" binding:"required"`
	Name          string  `json:"name" binding:"required"`
	Description   string  `json:"description"`
	TotalAmount   float64 `json:"total_amount" binding:"required,gt=0"`
	PlannedVisits int     `json:"planned_visits"`
	Notes         string  `json:"notes"`
}

type UpdateTreatmentRequest struct {
	Name          string  `json:"name"`
	Description   string  `json:"description"`
	TotalAmount   float64 `json:"total_amount"`
	PlannedVisits int     `json:"planned_visits"`
	Status        string  `json:"status"`
	Notes         string  `json:"notes"`
}

type AddPaymentRequest struct {
	Amount  float64 `json:"amount" binding:"required,gt=0"`
	DueDate string  `json:"due_date"`
	Notes   string  `json:"notes"`
}

type UpdatePaymentRequest struct {
	Amount  float64 `json:"amount"`
	DueDate string  `json:"due_date"`
	Status  string  `json:"status"`
	Notes   string  `json:"notes"`
}

// GET /api/treatments
func GetTreatments(c *gin.Context) {
	clinicID := c.MustGet("clinic_id").(uuid.UUID)

	var q GetTreatmentsQuery
	if err := c.ShouldBindQuery(&q); err != nil {
		response.BadRequest(c, "validation.invalid_input")
		return
	}
	if q.Page < 1 {
		q.Page = 1
	}

	treatments, total, err := services.ListTreatments(clinicID, q.PatientID, q.Status, q.Page)
	if handleErr(c, err) {
		return
	}

	response.OK(c, gin.H{"treatments": treatments, "total": total})
}

// GET /api/patients/:id/treatments
func GetPatientTreatments(c *gin.Context) {
	clinicID := c.MustGet("clinic_id").(uuid.UUID)
	patientID := c.Param("id")

	if _, err := uuid.Parse(patientID); err != nil {
		response.BadRequest(c, "validation.invalid_id")
		return
	}

	treatments, total, err := services.ListTreatments(clinicID, patientID, "", 1)
	if handleErr(c, err) {
		return
	}

	response.OK(c, gin.H{"treatments": treatments, "total": total})
}

// GET /api/treatments/:id
func GetTreatment(c *gin.Context) {
	clinicID := c.MustGet("clinic_id").(uuid.UUID)

	treatmentID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		response.BadRequest(c, "validation.invalid_id")
		return
	}

	t, err := services.GetTreatment(treatmentID.String(), clinicID)
	if handleErr(c, err) {
		return
	}

	response.OK(c, t)
}

// POST /api/treatments
func CreateTreatment(c *gin.Context) {
	clinicID := c.MustGet("clinic_id").(uuid.UUID)
	userID := c.MustGet("user_id").(uuid.UUID)

	var req CreateTreatmentRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, "validation.invalid_input")
		return
	}

	t, err := services.CreateTreatment(clinicID, userID, services.CreateTreatmentInput{
		PatientID:     req.PatientID,
		Name:          req.Name,
		Description:   req.Description,
		TotalAmount:   req.TotalAmount,
		PlannedVisits: req.PlannedVisits,
		Notes:         req.Notes,
	})
	if handleErr(c, err) {
		return
	}

	response.Created(c, t)
}

// PUT /api/treatments/:id
func UpdateTreatment(c *gin.Context) {
	clinicID := c.MustGet("clinic_id").(uuid.UUID)
	userID := c.MustGet("user_id").(uuid.UUID)
	userName, _ := c.Get("user_name")

	treatmentID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		response.BadRequest(c, "validation.invalid_id")
		return
	}

	var req UpdateTreatmentRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, "validation.invalid_input")
		return
	}

	t, err := services.UpdateTreatment(treatmentID.String(), clinicID, services.UpdateTreatmentInput{
		Name:          req.Name,
		Description:   req.Description,
		TotalAmount:   req.TotalAmount,
		PlannedVisits: req.PlannedVisits,
		Status:        req.Status,
		Notes:         req.Notes,
	})
	if handleErr(c, err) {
		return
	}

	name, _ := userName.(string)
	services.LogAudit(services.AuditInput{
		ClinicID:     clinicID,
		UserID:       userID,
		UserName:     name,
		Action:       "treatment.updated",
		ResourceType: "treatment",
		ResourceID:   treatmentID,
		IPAddress:    c.ClientIP(),
	})

	response.OK(c, t)
}

// DELETE /api/treatments/:id  — soft-cancels (sets status = cancelled)
func CancelTreatment(c *gin.Context) {
	clinicID := c.MustGet("clinic_id").(uuid.UUID)
	userID := c.MustGet("user_id").(uuid.UUID)
	userName, _ := c.Get("user_name")

	treatmentID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		response.BadRequest(c, "validation.invalid_id")
		return
	}

	if err := services.CancelTreatment(treatmentID.String(), clinicID); err != nil {
		handleErr(c, err)
		return
	}

	name, _ := userName.(string)
	services.LogAudit(services.AuditInput{
		ClinicID:     clinicID,
		UserID:       userID,
		UserName:     name,
		Action:       "treatment.cancelled",
		ResourceType: "treatment",
		ResourceID:   treatmentID,
		IPAddress:    c.ClientIP(),
	})

	response.Message(c, "treatment cancelled")
}

// POST /api/treatments/:id/payments
func AddPayment(c *gin.Context) {
	clinicID := c.MustGet("clinic_id").(uuid.UUID)

	treatmentID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		response.BadRequest(c, "validation.invalid_id")
		return
	}

	var req AddPaymentRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, "validation.invalid_input")
		return
	}

	p, err := services.AddPayment(treatmentID.String(), clinicID, services.AddPaymentInput{
		Amount:  req.Amount,
		DueDate: req.DueDate,
		Notes:   req.Notes,
	})
	if handleErr(c, err) {
		return
	}

	response.Created(c, p)
}

// PUT /api/treatments/:id/payments/:paymentId
func UpdatePayment(c *gin.Context) {
	clinicID := c.MustGet("clinic_id").(uuid.UUID)

	treatmentID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		response.BadRequest(c, "validation.invalid_id")
		return
	}

	paymentID := c.Param("paymentId")
	if _, err := uuid.Parse(paymentID); err != nil {
		response.BadRequest(c, "validation.invalid_id")
		return
	}

	var req UpdatePaymentRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, "validation.invalid_input")
		return
	}

	p, err := services.UpdatePayment(paymentID, treatmentID, clinicID, services.UpdatePaymentInput{
		Amount:  req.Amount,
		DueDate: req.DueDate,
		Status:  req.Status,
		Notes:   req.Notes,
	})
	if handleErr(c, err) {
		return
	}

	response.OK(c, p)
}

// PATCH /api/treatments/:id/payments/:paymentId/pay
func MarkPaymentPaid(c *gin.Context) {
	clinicID := c.MustGet("clinic_id").(uuid.UUID)
	userID := c.MustGet("user_id").(uuid.UUID)

	treatmentID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		response.BadRequest(c, "validation.invalid_id")
		return
	}

	paymentID := c.Param("paymentId")
	if _, err := uuid.Parse(paymentID); err != nil {
		response.BadRequest(c, "validation.invalid_id")
		return
	}

	p, err := services.MarkPaymentPaid(paymentID, treatmentID, clinicID, userID)
	if handleErr(c, err) {
		return
	}

	response.OK(c, p)
}

// DELETE /api/treatments/:id/payments/:paymentId
func DeletePayment(c *gin.Context) {
	clinicID := c.MustGet("clinic_id").(uuid.UUID)

	treatmentID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		response.BadRequest(c, "validation.invalid_id")
		return
	}

	paymentID := c.Param("paymentId")
	if _, err := uuid.Parse(paymentID); err != nil {
		response.BadRequest(c, "validation.invalid_id")
		return
	}

	if err := services.DeletePayment(paymentID, treatmentID, clinicID); err != nil {
		handleErr(c, err)
		return
	}

	response.Message(c, "payment deleted")
}
