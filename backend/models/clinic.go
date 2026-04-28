package models

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type Clinic struct {
	ID                 uuid.UUID      `json:"id" gorm:"type:uuid;primaryKey;default:gen_random_uuid()"`
	Name               string         `json:"name" gorm:"not null"`
	Address            string         `json:"address"`
	Phone              string         `json:"phone"`
	Email              string         `json:"email"`
	IsDemo             bool           `json:"is_demo" gorm:"column:is_demo;default:false"`
	StripeCustomerID   string         `json:"-" gorm:"column:stripe_customer_id"`
	SubscriptionID     string         `json:"-" gorm:"column:subscription_id"`
	SubscriptionStatus string         `json:"subscription_status" gorm:"column:subscription_status;default:'free'"`
	PlanName           string         `json:"plan_name" gorm:"column:plan_name;default:'free'"`
	CreatedAt          time.Time      `json:"created_at"`
	UpdatedAt          time.Time      `json:"updated_at"`
	DeletedAt          gorm.DeletedAt `json:"-" gorm:"index"`
}

func (c *Clinic) BeforeCreate(tx *gorm.DB) error {
	if c.ID == uuid.Nil {
		c.ID = uuid.New()
	}
	return nil
}
