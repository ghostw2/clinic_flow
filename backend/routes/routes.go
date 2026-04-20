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
	protected.Use(middleware.AuthRequired())
	{
		// Dashboard
		protected.GET("/dashboard/stats", handlers.GetDashboardStats)

		// Appointments
		protected.GET("/appointments", handlers.GetAppointments)
		protected.POST("/appointments", handlers.CreateAppointment)
		protected.PUT("/appointments/:id", handlers.UpdateAppointment)
		protected.DELETE("/appointments/:id", handlers.DeleteAppointment)

		// Patients
		protected.GET("/patients", handlers.GetPatients)
		protected.GET("/patients/:id", handlers.GetPatient)
		protected.POST("/patients", handlers.CreatePatient)
		protected.PUT("/patients/:id", handlers.UpdatePatient)
		protected.DELETE("/patients/:id", handlers.DeletePatient)

		// Users (admin only)
		protected.GET("/users", middleware.RequireRole("admin", "staff"), handlers.GetUsers)
		protected.POST("/users", middleware.RequireRole("admin"), handlers.CreateUser)

		// Notifications
		protected.POST("/notifications/send", middleware.RequireRole("admin", "staff"), handlers.SendNotification)
	}
}
