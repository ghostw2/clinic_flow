package services

import (
	"fmt"
	"io"
	"net/http"
	"net/url"
	"strings"
	"time"

	"github.com/clinicflow/backend/config"
	"github.com/clinicflow/backend/models"
)

// sendSMS makes the Twilio REST API call.
func sendSMS(to, body string) error {
	if config.App.TwilioSID == "" || config.App.TwilioToken == "" {
		return fmt.Errorf("Twilio credentials not configured")
	}
	if to == "" {
		return fmt.Errorf("no recipient phone number")
	}

	endpoint := fmt.Sprintf(
		"https://api.twilio.com/2010-04-01/Accounts/%s/Messages.json",
		config.App.TwilioSID,
	)

	form := url.Values{}
	form.Set("To", to)
	form.Set("From", config.App.TwilioPhone)
	form.Set("Body", body)

	req, err := http.NewRequest(http.MethodPost, endpoint, strings.NewReader(form.Encode()))
	if err != nil {
		return err
	}
	req.SetBasicAuth(config.App.TwilioSID, config.App.TwilioToken)
	req.Header.Set("Content-Type", "application/x-www-form-urlencoded")

	client := &http.Client{Timeout: 15 * time.Second}
	resp, err := client.Do(req)
	if err != nil {
		return err
	}
	defer resp.Body.Close()

	if resp.StatusCode >= 400 {
		raw, _ := io.ReadAll(resp.Body)
		return fmt.Errorf("twilio error %d: %s", resp.StatusCode, string(raw))
	}
	return nil
}

// SendSMSBookingConfirmation notifies a patient that their appointment is booked.
func SendSMSBookingConfirmation(appt models.Appointment) error {
	if appt.Patient.Phone == "" {
		return fmt.Errorf("patient has no phone number")
	}
	dateStr := appt.Datetime.Format("Mon Jan 2 at 3:04 PM")
	body := fmt.Sprintf(
		"ClinicFlow: Your appointment with Dr. %s is confirmed for %s. Reply STOP to unsubscribe.",
		appt.Doctor.Name, dateStr,
	)
	return sendSMS(appt.Patient.Phone, body)
}

// SendSMSReminder sends a 24h appointment reminder.
func SendSMSReminder(appt models.Appointment) error {
	if appt.Patient.Phone == "" {
		return fmt.Errorf("patient has no phone number")
	}
	dateStr := appt.Datetime.Format("Mon Jan 2 at 3:04 PM")
	body := fmt.Sprintf(
		"ClinicFlow Reminder: You have an appointment with Dr. %s tomorrow, %s. Reply STOP to unsubscribe.",
		appt.Doctor.Name, dateStr,
	)
	return sendSMS(appt.Patient.Phone, body)
}

// SendSMSCancellationNotice notifies a patient that their appointment was cancelled.
func SendSMSCancellationNotice(appt models.Appointment) error {
	if appt.Patient.Phone == "" {
		return fmt.Errorf("patient has no phone number")
	}
	dateStr := appt.Datetime.Format("Mon Jan 2 at 3:04 PM")
	body := fmt.Sprintf(
		"ClinicFlow: Your appointment with Dr. %s on %s has been cancelled. Contact us to reschedule. Reply STOP to unsubscribe.",
		appt.Doctor.Name, dateStr,
	)
	return sendSMS(appt.Patient.Phone, body)
}

// SendSMSRescheduledNotice notifies a patient that their appointment was rescheduled.
func SendSMSRescheduledNotice(appt models.Appointment) error {
	if appt.Patient.Phone == "" {
		return fmt.Errorf("patient has no phone number")
	}
	dateStr := appt.Datetime.Format("Mon Jan 2 at 3:04 PM")
	body := fmt.Sprintf(
		"ClinicFlow: Your appointment with Dr. %s has been rescheduled to %s. Reply STOP to unsubscribe.",
		appt.Doctor.Name, dateStr,
	)
	return sendSMS(appt.Patient.Phone, body)
}
