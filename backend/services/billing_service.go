package services

import (
	"encoding/json"
	"errors"
	"fmt"
	"log"
	"strings"

	stripe "github.com/stripe/stripe-go/v76"
	checkoutsession "github.com/stripe/stripe-go/v76/checkout/session"
	stripecustomer "github.com/stripe/stripe-go/v76/customer"
	portalsession "github.com/stripe/stripe-go/v76/billingportal/session"
	stripeproduct "github.com/stripe/stripe-go/v76/product"
	"github.com/stripe/stripe-go/v76/webhook"

	"github.com/clinicflow/backend/config"
	"github.com/clinicflow/backend/repositories"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

// ResolvePriceIDs converts any prod_* IDs in config to their default price_* IDs.
// Called once at startup so users can put either product or price IDs in env.
func ResolvePriceIDs() {
	if config.App.StripeSecretKey == "" {
		return
	}
	stripe.Key = config.App.StripeSecretKey

	resolve := func(field *string, label string) {
		if !strings.HasPrefix(*field, "prod_") {
			return
		}
		p, err := stripeproduct.Get(*field, &stripe.ProductParams{
			Params: stripe.Params{Expand: []*string{stripe.String("default_price")}},
		})
		if err != nil {
			log.Printf("[billing] WARNING: could not resolve product %s (%s): %v", *field, label, err)
			return
		}
		if p.DefaultPrice == nil {
			log.Printf("[billing] WARNING: product %s (%s) has no default price — set a default price in Stripe Dashboard", *field, label)
			return
		}
		log.Printf("[billing] resolved %s: %s → %s", label, *field, p.DefaultPrice.ID)
		*field = p.DefaultPrice.ID
	}

	resolve(&config.App.StripePriceStarter, "STRIPE_PRICE_STARTER")
	resolve(&config.App.StripePriceGrowth, "STRIPE_PRICE_GROWTH")
	resolve(&config.App.StripePriceClinic, "STRIPE_PRICE_CLINIC")
}

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
		return "", fmt.Errorf("price ID for plan %q is not configured", planKey)
	}
	if !strings.HasPrefix(id, "price_") {
		return "", fmt.Errorf("price ID for plan %q is still a product ID (%q) — ResolvePriceIDs may have failed at startup", planKey, id)
	}
	return id, nil
}

// CreateCheckoutSession creates a Stripe Checkout session.
// successURL must be a full URL (e.g. https://app.com/dashboard?payment=success).
func CreateCheckoutSession(clinicID uuid.UUID, planKey, successURL string) (string, error) {
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
		SuccessURL: stripe.String(successURL),
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
			return nil
		}
		repositories.UpdateClinicBilling(clinicID, cs.Customer, cs.Subscription, "active", cs.Metadata["plan"])

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
		plan := clinic.PlanName
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

	case "invoice.payment_failed":
		var inv struct {
			Customer string `json:"customer"`
		}
		if err := json.Unmarshal(event.Data.Raw, &inv); err != nil {
			return err
		}
		if clinic, err := repositories.GetClinicByStripeCustomerID(inv.Customer); err == nil {
			log.Printf("[billing] payment failed for clinic %s", clinic.ID)
			repositories.UpdateClinicBilling(clinic.ID, clinic.StripeCustomerID, clinic.SubscriptionID, "past_due", clinic.PlanName)
		}

	case "invoice.paid":
		var inv struct {
			Customer string `json:"customer"`
		}
		if err := json.Unmarshal(event.Data.Raw, &inv); err != nil {
			return err
		}
		if clinic, err := repositories.GetClinicByStripeCustomerID(inv.Customer); err == nil {
			if clinic.SubscriptionStatus == "past_due" {
				repositories.UpdateClinicBilling(clinic.ID, clinic.StripeCustomerID, clinic.SubscriptionID, "active", clinic.PlanName)
			}
		}
	}

	return nil
}
