package repositories

import (
	"github.com/clinicflow/backend/database"
	"github.com/clinicflow/backend/models"
	"github.com/google/uuid"
)

func GetClinicByID(clinicID uuid.UUID) (models.Clinic, error) {
	var clinic models.Clinic
	err := database.DB.Where("id = ? AND deleted_at IS NULL", clinicID).First(&clinic).Error
	return clinic, err
}

func GetClinicByStripeCustomerID(customerID string) (models.Clinic, error) {
	var clinic models.Clinic
	err := database.DB.Where("stripe_customer_id = ? AND deleted_at IS NULL", customerID).First(&clinic).Error
	return clinic, err
}

func UpdateClinicBilling(clinicID uuid.UUID, customerID, subscriptionID, status, planName string) error {
	return database.DB.Model(&models.Clinic{}).
		Where("id = ?", clinicID).
		Updates(map[string]interface{}{
			"stripe_customer_id":   customerID,
			"subscription_id":      subscriptionID,
			"subscription_status":  status,
			"plan_name":            planName,
		}).Error
}
