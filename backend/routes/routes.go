package routes

import (
	"github.com/clinicflow/backend/handlers"
	"github.com/clinicflow/backend/middleware"
	"github.com/gin-gonic/gin"
)

func Register(r *gin.Engine) {
	api := r.Group("/api")

	// Public routes
	auth := api.Group("/auth")
	{
		auth.POST("/register", handlers.Register)
		auth.POST("/login", handlers.Login)
		auth.POST("/logout", handlers.Logout)
		auth.POST("/2fa/verify", handlers.Verify2FA)
		auth.POST("/refresh", middleware.AuthRequired(), handlers.Refresh)
		auth.GET("/me", middleware.AuthRequired(), handlers.Me)
		auth.POST("/2fa/setup", middleware.AuthRequired(), handlers.Setup2FA)
		auth.POST("/2fa/enable", middleware.AuthRequired(), handlers.Enable2FA)
		auth.POST("/2fa/disable", middleware.AuthRequired(), handlers.Disable2FA)
	}

	// Protected routes
	protected := api.Group("")
	protected.Use(middleware.AuthRequired(), middleware.LoadClinicPermissions())
	{
		// Dashboard
		protected.GET("/dashboard/stats", handlers.GetDashboardStats)

		// Appointments
		protected.GET("/appointments", handlers.GetAppointments)
		protected.POST("/appointments", middleware.RequirePermission("appointment.create"), handlers.CreateAppointment)
		protected.PUT("/appointments/:id", handlers.UpdateAppointment) // permission checked in handler (status vs full update)
		protected.DELETE("/appointments/:id", middleware.RequirePermission("appointment.delete"), handlers.DeleteAppointment)

		// Appointment Documents
		protected.GET("/appointments/:id/documents", handlers.ListDocuments)
		protected.POST("/appointments/:id/documents", middleware.RequirePermission("document.upload"), handlers.UploadDocument)
		protected.GET("/appointments/:id/documents/:docId/file", handlers.DownloadDocument)
		protected.DELETE("/appointments/:id/documents/:docId", middleware.RequirePermission("document.delete"), handlers.DeleteDocument)

		// Patients
		protected.GET("/patients", handlers.GetPatients)
		protected.GET("/patients/:id", handlers.GetPatient)
		protected.POST("/patients", middleware.RequirePermission("patient.create"), handlers.CreatePatient)
		protected.PUT("/patients/:id", middleware.RequirePermission("patient.update"), handlers.UpdatePatient)
		protected.DELETE("/patients/:id", middleware.RequirePermission("patient.delete"), handlers.DeletePatient)
		protected.GET("/patients/:id/history", handlers.GetPatientHistory)
		protected.GET("/patients/:id/export", middleware.RequireRole("admin"), handlers.ExportPatient)
		protected.DELETE("/patients/:id/purge", middleware.RequireRole("admin"), handlers.PurgePatient)
		protected.GET("/patients/:id/audit", middleware.RequireRole("admin", "doctor"), handlers.GetPatientAuditLog)

		// Medical Records
		protected.GET("/patients/:id/records", handlers.GetMedicalRecords)
		protected.POST("/patients/:id/records", middleware.RequirePermission("record.create"), handlers.CreateMedicalRecord)
		protected.PUT("/patients/:id/records/:recordId", middleware.RequirePermission("record.update"), handlers.UpdateMedicalRecord)
		protected.DELETE("/patients/:id/records/:recordId", middleware.RequirePermission("record.delete"), handlers.DeleteMedicalRecord)

		// Users (admin only)
		protected.GET("/users", middleware.RequireRole("admin", "staff"), handlers.GetUsers)
		protected.POST("/users", middleware.RequireRole("admin"), handlers.CreateUser)

		// Notifications
		protected.POST("/notifications/send", middleware.RequireRole("admin", "staff"), handlers.SendNotification)

		// Billing
		protected.POST("/billing/checkout", handlers.CreateCheckout)
		protected.POST("/billing/portal", middleware.RequireSubscription(), handlers.CreatePortal)

		// Settings — Permissions
		protected.GET("/settings/permissions", handlers.GetPermissions)
		protected.PUT("/settings/permissions", middleware.RequireRole("admin"), handlers.UpdatePermissions)
	}

	// Billing — public routes
	api.GET("/billing/plans", handlers.GetPlans)
	api.POST("/billing/webhook", handlers.BillingWebhook)

	// i18n — public routes
	api.GET("/i18n/languages", handlers.GetLanguages)
	api.GET("/i18n/:lang", handlers.GetTranslations)
}
