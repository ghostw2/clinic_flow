package services

import (
	"encoding/json"
	"errors"
	"fmt"
	"strings"

	stripe "github.com/stripe/stripe-go/v76"
	checkoutsession "github.com/stripe/stripe-go/v76/checkout/session"
	stripecustomer "github.com/stripe/stripe-go/v76/customer"
	portalsession "github.com/stripe/stripe-go/v76/billingportal/session"
	"github.com/stripe/stripe-go/v76/webhook"

	"github.com/clinicflow/backend/config"
	"github.com/clinicflow/backend/repositories"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

func planPriceID(planKey string) (string, error) {
	var id string
	switch planKey {
	case "starter":
		id = config.App.StripePriceStarter
	case "growth":
		id = config.App.StripePriceGrowth
	case "clinic":
		id = config.App.StripePriceClinic
	default:
		return "", fmt.Errorf("unknown plan: %q", planKey)
	}
	if id == "" {
		return "", fmt.Errorf("price ID for plan %q is not configured (STRIPE_PRICE_%s is empty)", planKey, strings.ToUpper(planKey))
	}
	if !strings.HasPrefix(id, "price_") {
		return "", fmt.Errorf("price ID for plan %q looks like a product ID (%q) — use the price ID starting with 'price_' found under the product's pricing section in the Stripe dashboard", planKey, id)
	}
	return id, nil
}

func CreateCheckoutSession(clinicID uuid.UUID, planKey string) (string, error) {
	priceID, err := planPriceID(planKey)
	if err != nil {
		return "", err
	}

	stripe.Key = config.App.StripeSecretKey

	clinic, err := repositories.GetClinicByID(clinicID)
	if err != nil {
		if err == gorm.ErrRecordNotFound {
			return "", ErrNotFound
		}
		return "", err
	}

	customerID := clinic.StripeCustomerID
	if customerID == "" {
		c, err := stripecustomer.New(&stripe.CustomerParams{
			Email: stripe.String(clinic.Email),
			Name:  stripe.String(clinic.Name),
		})
		if err != nil {
			return "", fmt.Errorf("stripe customer: %w", err)
		}
		customerID = c.ID
		repositories.UpdateClinicBilling(clinicID, customerID, clinic.SubscriptionID, clinic.SubscriptionStatus, clinic.PlanName)
	}

	params := &stripe.CheckoutSessionParams{
		Customer: stripe.String(customerID),
		Mode:     stripe.String(string(stripe.CheckoutSessionModeSubscription)),
		LineItems: []*stripe.CheckoutSessionLineItemParams{
			{
				Price:    stripe.String(priceID),
				Quantity: stripe.Int64(1),
			},
		},
		SuccessURL: stripe.String(config.App.FrontendURL + "/settings?payment=success"),
		CancelURL:  stripe.String(config.App.FrontendURL + "/settings"),
		Metadata: map[string]string{
			"clinic_id": clinicID.String(),
			"plan":      planKey,
		},
	}

	s, err := checkoutsession.New(params)
	if err != nil {
		return "", fmt.Errorf("stripe checkout: %w", err)
	}
	return s.URL, nil
}

func CreatePortalSession(clinicID uuid.UUID) (string, error) {
	stripe.Key = config.App.StripeSecretKey

	clinic, err := repositories.GetClinicByID(clinicID)
	if err != nil {
		if err == gorm.ErrRecordNotFound {
			return "", ErrNotFound
		}
		return "", err
	}

	if clinic.StripeCustomerID == "" {
		return "", errors.New("no active subscription")
	}

	params := &stripe.BillingPortalSessionParams{
		Customer:  stripe.String(clinic.StripeCustomerID),
		ReturnURL: stripe.String(config.App.FrontendURL + "/settings"),
	}

	s, err := portalsession.New(params)
	if err != nil {
		return "", fmt.Errorf("stripe portal: %w", err)
	}
	return s.URL, nil
}

// HandleStripeWebhook verifies the event signature and updates the clinic subscription.
func HandleStripeWebhook(payload []byte, sigHeader string) error {
	event, err := webhook.ConstructEvent(payload, sigHeader, config.App.StripeWebhookSecret)
	if err != nil {
		return fmt.Errorf("webhook signature: %w", err)
	}

	switch event.Type {
	case "checkout.session.completed":
		var cs struct {
			Customer     string            `json:"customer"`
			Subscription string            `json:"subscription"`
			Metadata     map[string]string `json:"metadata"`
		}
		if err := json.Unmarshal(event.Data.Raw, &cs); err != nil {
			return err
		}
		clinicID, err := uuid.Parse(cs.Metadata["clinic_id"])
		if err != nil {
			return nil // unknown clinic, skip
		}
		plan := cs.Metadata["plan"]
		repositories.UpdateClinicBilling(clinicID, cs.Customer, cs.Subscription, "active", plan)

	case "customer.subscription.updated":
		var sub struct {
			ID       string `json:"id"`
			Customer string `json:"customer"`
			Status   string `json:"status"`
			Items    struct {
				Data []struct {
					Price struct {
						ID string `json:"id"`
					} `json:"price"`
				} `json:"data"`
			} `json:"items"`
		}
		if err := json.Unmarshal(event.Data.Raw, &sub); err != nil {
			return err
		}
		clinic, err := repositories.GetClinicByStripeCustomerID(sub.Customer)
		if err != nil {
			return nil
		}
		plan := ""
		if len(sub.Items.Data) > 0 {
			for _, p := range []struct{ key, priceID string }{
				{"starter", config.App.StripePriceStarter},
				{"growth", config.App.StripePriceGrowth},
				{"clinic", config.App.StripePriceClinic},
			} {
				if sub.Items.Data[0].Price.ID == p.priceID {
					plan = p.key
					break
				}
			}
		}
		if plan == "" {
			plan = clinic.PlanName
		}
		repositories.UpdateClinicBilling(clinic.ID, sub.Customer, sub.ID, sub.Status, plan)

	case "customer.subscription.deleted":
		var sub struct {
			Customer string `json:"customer"`
			ID       string `json:"id"`
		}
		if err := json.Unmarshal(event.Data.Raw, &sub); err != nil {
			return err
		}
		clinic, err := repositories.GetClinicByStripeCustomerID(sub.Customer)
		if err != nil {
			return nil
		}
		repositories.UpdateClinicBilling(clinic.ID, sub.Customer, sub.ID, "cancelled", "free")
	}

	return nil
}
