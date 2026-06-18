package config

import (
	"log"
	"os"
	"strconv"

	"github.com/joho/godotenv"
)

type Config struct {
	Port               string
	DatabaseURL        string
	SessionExpiryHours int
	SessionSecure      bool
	ResendAPIKey       string
	FrontendURL        string
	TwilioSID          string
	TwilioToken        string
	TwilioPhone        string
	StripeSecretKey     string
	StripeWebhookSecret string
	StripePriceStarter  string
	StripePriceGrowth   string
	StripePriceClinic   string
	StripeAmountStarter string
	StripeAmountGrowth  string
	StripeAmountClinic  string
	UploadsDir          string
}

var App Config

func Load() {
	if err := godotenv.Load(); err != nil {
		log.Println("No .env file found, reading from environment")
	}

	expiryHours, _ := strconv.Atoi(getEnv("SESSION_EXPIRY_HOURS", "24"))
	sessionSecure, _ := strconv.ParseBool(getEnv("SESSION_SECURE", "false"))

	dbURL := os.Getenv("DATABASE_URL")
	if dbURL == "" {
		if os.Getenv("GIN_MODE") == "release" {
			log.Fatal("DATABASE_URL is required in production")
		}
		dbURL = "postgres://clinicflow:clinicflow_secret@localhost:5432/clinicflow?sslmode=disable"
		log.Println("WARNING: DATABASE_URL not set — using local dev default")
	}

	App = Config{
		Port:                getEnv("PORT", "8080"),
		DatabaseURL:         dbURL,
		SessionExpiryHours:  expiryHours,
		SessionSecure:       sessionSecure,
		ResendAPIKey:        getEnv("RESEND_API_KEY", ""),
		FrontendURL:         getEnv("FRONTEND_URL", "http://localhost:3000"),
		TwilioSID:           getEnv("TWILIO_ACCOUNT_SID", ""),
		TwilioToken:         getEnv("TWILIO_AUTH_TOKEN", ""),
		TwilioPhone:         getEnv("TWILIO_PHONE_NUMBER", ""),
		StripeSecretKey:     getEnv("STRIPE_SECRET_KEY", ""),
		StripeWebhookSecret: getEnv("STRIPE_WEBHOOK_SECRET", ""),
		StripePriceStarter:  getEnv("STRIPE_PRICE_STARTER", ""),
		StripePriceGrowth:   getEnv("STRIPE_PRICE_GROWTH", ""),
		StripePriceClinic:   getEnv("STRIPE_PRICE_CLINIC", ""),
		StripeAmountStarter: getEnv("STRIPE_AMOUNT_STARTER", "9.99"),
		StripeAmountGrowth:  getEnv("STRIPE_AMOUNT_GROWTH", "19.99"),
		StripeAmountClinic:  getEnv("STRIPE_AMOUNT_CLINIC", "29.99"),
		UploadsDir:          getEnv("UPLOADS_DIR", "./uploads"),
	}
}

func getEnv(key, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return fallback
}
