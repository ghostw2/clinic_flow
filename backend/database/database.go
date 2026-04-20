package database

import (
	"log"

	"github.com/clinicflow/backend/config"
	"github.com/clinicflow/backend/models"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

var DB *gorm.DB

func Connect() {
	var err error
	DB, err = gorm.Open(postgres.Open(config.App.DatabaseURL), &gorm.Config{
		Logger: logger.Default.LogMode(logger.Info),
	})
	if err != nil {
		log.Fatalf("Failed to connect to database: %v", err)
	}

	log.Println("Database connected successfully")
	autoMigrate()
}

func autoMigrate() {
	if err := DB.AutoMigrate(
		&models.Clinic{},
		&models.User{},
		&models.Session{},
		&models.PreAuthSession{},
		&models.Patient{},
		&models.Appointment{},
		&models.Notification{},
	); err != nil {
		log.Fatalf("AutoMigrate failed: %v", err)
	}
	log.Println("Database migration complete")
}
