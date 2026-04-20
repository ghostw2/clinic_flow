package services

import (
	"fmt"
	"time"

	"github.com/clinicflow/backend/config"
	"github.com/clinicflow/backend/models"
	"github.com/resend/resend-go/v2"
)

// SendEmailReminder sends a 24h appointment reminder via Resend.
func SendEmailReminder(appt models.Appointment) error {
	if config.App.ResendAPIKey == "" {
		return fmt.Errorf("RESEND_API_KEY not configured")
	}

	client := resend.NewClient(config.App.ResendAPIKey)

	patientName := appt.Patient.Name
	doctorName := appt.Doctor.Name
	dateStr := appt.Datetime.Format("Monday, January 2, 2006 at 3:04 PM")
	toEmail := appt.Patient.Email
	if toEmail == "" {
		return fmt.Errorf("patient has no email address")
	}

	subject := fmt.Sprintf("Appointment Reminder – %s", dateStr)
	html := buildEmailHTML(patientName, doctorName, dateStr)

	params := &resend.SendEmailRequest{
		From:    "ClinicFlow <noreply@clinicflow.app>",
		To:      []string{toEmail},
		Subject: subject,
		Html:    html,
	}

	_, err := client.Emails.Send(params)
	return err
}

func buildEmailHTML(patientName, doctorName, dateStr string) string {
	return fmt.Sprintf(`<!DOCTYPE html>
<html>
<body style="font-family:sans-serif;color:#1a1a1a;max-width:600px;margin:0 auto;padding:24px">
  <div style="background:#2563eb;padding:24px;border-radius:8px 8px 0 0;">
    <h1 style="color:#fff;margin:0;font-size:24px">ClinicFlow</h1>
  </div>
  <div style="background:#f8fafc;padding:32px;border-radius:0 0 8px 8px;border:1px solid #e2e8f0">
    <h2 style="margin-top:0">Appointment Reminder</h2>
    <p>Hi <strong>%s</strong>,</p>
    <p>This is a reminder for your upcoming appointment:</p>
    <table style="width:100%%;background:#fff;border:1px solid #e2e8f0;border-radius:6px;padding:16px;margin:16px 0">
      <tr><td style="color:#64748b;padding:4px 0">Doctor</td><td><strong>%s</strong></td></tr>
      <tr><td style="color:#64748b;padding:4px 0">Date &amp; Time</td><td><strong>%s</strong></td></tr>
    </table>
    <p>Please arrive 10 minutes early. If you need to cancel or reschedule, contact the clinic as soon as possible.</p>
    <p style="color:#64748b;font-size:14px;margin-top:32px">Sent by ClinicFlow Appointment System</p>
  </div>
</body>
</html>`, patientName, doctorName, dateStr)
}

// SendSMSReminder sends an SMS reminder via Twilio (placeholder).
func SendSMSReminder(appt models.Appointment) error {
	if config.App.TwilioSID == "" || config.App.TwilioToken == "" {
		return fmt.Errorf("Twilio credentials not configured")
	}

	// Twilio REST API call via net/http
	phone := appt.Patient.Phone
	if phone == "" {
		return fmt.Errorf("patient has no phone number")
	}

	dateStr := appt.Datetime.Format(time.RFC1123)
	body := fmt.Sprintf("Reminder: You have an appointment with Dr. %s on %s. Reply STOP to unsubscribe.",
		appt.Doctor.Name, dateStr)

	_ = body // In production, call Twilio REST API here
	return nil
}
