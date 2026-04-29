package main

import (
	"fmt"
	"log"

	"github.com/clinicflow/backend/config"
	"github.com/clinicflow/backend/database"
	"github.com/clinicflow/backend/middleware"
	"github.com/clinicflow/backend/routes"
	"github.com/clinicflow/backend/services"
	"github.com/gin-gonic/gin"
)

func main() {
	config.Load()
	database.Connect()
	services.ResolvePriceIDs()

	r := gin.Default()
	r.Use(middleware.CORS())

	routes.Register(r)

	// Health check
	r.GET("/health", func(c *gin.Context) {
		c.JSON(200, gin.H{"status": "ok", "service": "ClinicFlow API"})
	})

	addr := fmt.Sprintf(":%s", config.App.Port)
	log.Printf("ClinicFlow API running on %s", addr)
	if err := r.Run(addr); err != nil {
		log.Fatalf("Server failed: %v", err)
	}
}
