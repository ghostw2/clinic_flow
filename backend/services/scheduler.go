package services

import (
	"log"
	"time"

	"github.com/clinicflow/backend/models"
	"github.com/clinicflow/backend/repositories"
)

// StartReminderScheduler ticks every 30 minutes and sends 24h reminder emails.
// Call as a goroutine from main: go services.StartReminderScheduler()
func StartReminderScheduler() {
	ticker := time.NewTicker(30 * time.Minute)
	defer ticker.Stop()
	for range ticker.C {
		runReminderBatch()
	}
}

func runReminderBatch() {
	appts, err := repositories.GetUpcomingAppointmentsForReminder()
	if err != nil {
		log.Printf("reminder scheduler: query error: %v", err)
		return
	}
	for _, appt := range appts {
		already, err := repositories.HasReminderSent(appt.ID)
		if err != nil || already {
			continue
		}
		status := models.NotifSent
		if err := SendEmailReminder(appt); err != nil {
			log.Printf("reminder: email failed for appt %s: %v", appt.ID, err)
			status = models.NotifFailed
		}
now := time.Now()
		notif := &models.Notification{
			AppointmentID: appt.ID,
			Type:          models.NotifEmail,
			Status:        status,
		}
		if status == models.NotifSent {
			notif.SentAt = &now
		}
		repositories.CreateNotification(notif)
	}
}
