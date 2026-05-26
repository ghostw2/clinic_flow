package services

import (
	"fmt"

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
		From:    "ClinicFlow <onboarding@resend.dev>",
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

// SendBookingConfirmation notifies a patient that their appointment is confirmed.
func SendBookingConfirmation(appt models.Appointment) error {
	if config.App.ResendAPIKey == "" {
		return fmt.Errorf("RESEND_API_KEY not configured")
	}
	if appt.Patient.Email == "" {
		return fmt.Errorf("patient has no email address")
	}
	client := resend.NewClient(config.App.ResendAPIKey)
	dateStr := appt.Datetime.Format("Monday, January 2, 2006 at 3:04 PM")
	html := fmt.Sprintf(`<!DOCTYPE html>
<html>
<body style="font-family:sans-serif;color:#1a1a1a;max-width:600px;margin:0 auto;padding:24px">
  <div style="background:#2563eb;padding:24px;border-radius:8px 8px 0 0;">
    <h1 style="color:#fff;margin:0;font-size:24px">ClinicFlow</h1>
  </div>
  <div style="background:#f8fafc;padding:32px;border-radius:0 0 8px 8px;border:1px solid #e2e8f0">
    <h2 style="margin-top:0">Appointment Confirmed</h2>
    <p>Hi <strong>%s</strong>,</p>
    <p>Your appointment has been successfully booked:</p>
    <table style="width:100%%;background:#fff;border:1px solid #e2e8f0;border-radius:6px;padding:16px;margin:16px 0">
      <tr><td style="color:#64748b;padding:4px 0">Doctor</td><td><strong>%s</strong></td></tr>
      <tr><td style="color:#64748b;padding:4px 0">Date &amp; Time</td><td><strong>%s</strong></td></tr>
    </table>
    <p>Please arrive 10 minutes early. To cancel or reschedule, contact the clinic as soon as possible.</p>
    <p style="color:#64748b;font-size:14px;margin-top:32px">Sent by ClinicFlow Appointment System</p>
  </div>
</body>
</html>`, appt.Patient.Name, appt.Doctor.Name, dateStr)

	_, err := client.Emails.Send(&resend.SendEmailRequest{
		From:    "ClinicFlow <onboarding@resend.dev>",
		To:      []string{appt.Patient.Email},
		Subject: fmt.Sprintf("Appointment Confirmed – %s", dateStr),
		Html:    html,
	})
	return err
}

// SendCancellationNotice notifies a patient that their appointment has been cancelled.
func SendCancellationNotice(appt models.Appointment) error {
	if config.App.ResendAPIKey == "" {
		return fmt.Errorf("RESEND_API_KEY not configured")
	}
	if appt.Patient.Email == "" {
		return fmt.Errorf("patient has no email address")
	}
	client := resend.NewClient(config.App.ResendAPIKey)
	dateStr := appt.Datetime.Format("Monday, January 2, 2006 at 3:04 PM")
	html := fmt.Sprintf(`<!DOCTYPE html>
<html>
<body style="font-family:sans-serif;color:#1a1a1a;max-width:600px;margin:0 auto;padding:24px">
  <div style="background:#ef4444;padding:24px;border-radius:8px 8px 0 0;">
    <h1 style="color:#fff;margin:0;font-size:24px">ClinicFlow</h1>
  </div>
  <div style="background:#f8fafc;padding:32px;border-radius:0 0 8px 8px;border:1px solid #e2e8f0">
    <h2 style="margin-top:0">Appointment Cancelled</h2>
    <p>Hi <strong>%s</strong>,</p>
    <p>Your appointment has been cancelled:</p>
    <table style="width:100%%;background:#fff;border:1px solid #e2e8f0;border-radius:6px;padding:16px;margin:16px 0">
      <tr><td style="color:#64748b;padding:4px 0">Doctor</td><td><strong>%s</strong></td></tr>
      <tr><td style="color:#64748b;padding:4px 0">Date &amp; Time</td><td><strong>%s</strong></td></tr>
    </table>
    <p>If you have any questions, please contact the clinic directly.</p>
    <p style="color:#64748b;font-size:14px;margin-top:32px">Sent by ClinicFlow Appointment System</p>
  </div>
</body>
</html>`, appt.Patient.Name, appt.Doctor.Name, dateStr)

	_, err := client.Emails.Send(&resend.SendEmailRequest{
		From:    "ClinicFlow <onboarding@resend.dev>",
		To:      []string{appt.Patient.Email},
		Subject: fmt.Sprintf("Appointment Cancelled – %s", dateStr),
		Html:    html,
	})
	return err
}

// SendRescheduledNotice notifies a patient that their appointment has been rescheduled.
func SendRescheduledNotice(appt models.Appointment) error {
	if config.App.ResendAPIKey == "" {
		return fmt.Errorf("RESEND_API_KEY not configured")
	}
	if appt.Patient.Email == "" {
		return fmt.Errorf("patient has no email address")
	}
	client := resend.NewClient(config.App.ResendAPIKey)
	dateStr := appt.Datetime.Format("Monday, January 2, 2006 at 3:04 PM")
	html := fmt.Sprintf(`<!DOCTYPE html>
<html>
<body style="font-family:sans-serif;color:#1a1a1a;max-width:600px;margin:0 auto;padding:24px">
  <div style="background:#f59e0b;padding:24px;border-radius:8px 8px 0 0;">
    <h1 style="color:#fff;margin:0;font-size:24px">ClinicFlow</h1>
  </div>
  <div style="background:#f8fafc;padding:32px;border-radius:0 0 8px 8px;border:1px solid #e2e8f0">
    <h2 style="margin-top:0">Appointment Rescheduled</h2>
    <p>Hi <strong>%s</strong>,</p>
    <p>Your appointment has been rescheduled to a new date and time:</p>
    <table style="width:100%%;background:#fff;border:1px solid #e2e8f0;border-radius:6px;padding:16px;margin:16px 0">
      <tr><td style="color:#64748b;padding:4px 0">Doctor</td><td><strong>%s</strong></td></tr>
      <tr><td style="color:#64748b;padding:4px 0">New Date &amp; Time</td><td><strong>%s</strong></td></tr>
    </table>
    <p>Please arrive 10 minutes early. To cancel or reschedule again, contact the clinic as soon as possible.</p>
    <p style="color:#64748b;font-size:14px;margin-top:32px">Sent by ClinicFlow Appointment System</p>
  </div>
</body>
</html>`, appt.Patient.Name, appt.Doctor.Name, dateStr)

	_, err := client.Emails.Send(&resend.SendEmailRequest{
		From:    "ClinicFlow <onboarding@resend.dev>",
		To:      []string{appt.Patient.Email},
		Subject: fmt.Sprintf("Appointment Rescheduled – New time: %s", dateStr),
		Html:    html,
	})
	return err
}

