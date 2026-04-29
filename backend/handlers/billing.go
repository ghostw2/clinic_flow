package handlers

import (
	"io"
	"log"
	"net/http"
	"strings"

	"github.com/clinicflow/backend/config"
	"github.com/clinicflow/backend/pkg/response"
	"github.com/clinicflow/backend/services"
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

type planInfo struct {
	Key         string `json:"key"`
	Name        string `json:"name"`
	Amount      string `json:"amount"`
	Description string `json:"description"`
}

// GET /api/billing/plans  (public)
func GetPlans(c *gin.Context) {
	plans := []planInfo{
		{Key: "starter", Name: "Starter", Amount: config.App.StripeAmountStarter, Description: "Perfect for solo practitioners"},
		{Key: "growth", Name: "Growth", Amount: config.App.StripeAmountGrowth, Description: "Growing clinics"},
		{Key: "clinic", Name: "Clinic", Amount: config.App.StripeAmountClinic, Description: "Large clinics & multi-doctor"},
	}
	response.OK(c, plans)
}

// POST /api/billing/checkout
func CreateCheckout(c *gin.Context) {
	clinicID := c.MustGet("clinic_id").(uuid.UUID)

	var req struct {
		Plan       string `json:"plan" binding:"required"`
		SuccessURL string `json:"success_url"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, err.Error())
		return
	}

	successURL := config.App.FrontendURL + "/settings?payment=success"
	if req.SuccessURL != "" && strings.HasPrefix(req.SuccessURL, "/") {
		successURL = config.App.FrontendURL + req.SuccessURL
	}

	url, err := services.CreateCheckoutSession(clinicID, req.Plan, successURL)
	if err != nil {
		log.Printf("[billing] checkout error for clinic %s plan %q: %v", clinicID, req.Plan, err)
		response.InternalError(c, err.Error())
		return
	}

	response.OK(c, gin.H{"url": url})
}

// POST /api/billing/portal
func CreatePortal(c *gin.Context) {
	clinicID := c.MustGet("clinic_id").(uuid.UUID)

	url, err := services.CreatePortalSession(clinicID)
	if err != nil {
		log.Printf("[billing] portal error for clinic %s: %v", clinicID, err)
		response.BadRequest(c, err.Error())
		return
	}

	response.OK(c, gin.H{"url": url})
}

// POST /api/billing/webhook
func BillingWebhook(c *gin.Context) {
	payload, err := io.ReadAll(c.Request.Body)
	if err != nil {
		c.Status(http.StatusBadRequest)
		return
	}

	sigHeader := c.GetHeader("Stripe-Signature")
	if err := services.HandleStripeWebhook(payload, sigHeader); err != nil {
		log.Printf("[billing] webhook error: %v", err)
		c.Status(http.StatusBadRequest)
		return
	}

	c.Status(http.StatusOK)
}
