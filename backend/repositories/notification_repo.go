package repositories

import (
	"time"

	"github.com/clinicflow/backend/database"
	"github.com/clinicflow/backend/models"
	"github.com/google/uuid"
)

func CreateNotification(notif *models.Notification) error {
	return database.DB.Create(notif).Error
}

func HasReminderSent(apptID uuid.UUID) (bool, error) {
	var count int64
	err := database.DB.Model(&models.Notification{}).
		Where("appointment_id = ? AND type = ? AND status = ?",
			apptID, models.NotifEmail, models.NotifSent).
		Count(&count).Error
	return count > 0, err
}

func GetUpcomingAppointmentsForReminder() ([]models.Appointment, error) {
	now := time.Now()
	var appts []models.Appointment
	err := database.DB.
		Preload("Patient").Preload("Doctor").
		Where("datetime BETWEEN ? AND ? AND status != ?",
			now.Add(23*time.Hour), now.Add(25*time.Hour), "cancelled").
		Find(&appts).Error
	return appts, err
}
