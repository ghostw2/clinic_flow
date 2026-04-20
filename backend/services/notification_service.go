package services

import (
	"time"

	"github.com/clinicflow/backend/models"
	"github.com/clinicflow/backend/repositories"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

func SendNotification(apptID uuid.UUID, clinicID uuid.UUID, notifType string) (models.Notification, error) {
	appt, err := repositories.GetAppointmentWithRelations(apptID.String(), clinicID)
	if err != nil {
		if err == gorm.ErrRecordNotFound {
			return models.Notification{}, ErrNotFound
		}
		return models.Notification{}, err
	}

	var sendErr error
	switch notifType {
	case "email":
		sendErr = SendEmailReminder(appt)
	case "sms":
		sendErr = SendSMSReminder(appt)
	}

	status := models.NotifSent
	if sendErr != nil {
		status = models.NotifFailed
	}

	notif := models.Notification{
		AppointmentID: apptID,
		Type:          models.NotificationType(notifType),
		Status:        status,
	}

	if status == models.NotifSent {
		now := time.Now()
		notif.SentAt = &now
	}

	repositories.CreateNotification(&notif)

	if sendErr != nil {
		return notif, sendErr
	}
	return notif, nil
}
