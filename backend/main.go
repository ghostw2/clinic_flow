package main

import (
	"context"
	"fmt"
	"log"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

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
	go services.StartReminderScheduler()

	r := gin.Default()
	r.Use(middleware.CORS())

	routes.Register(r)

	// Health check
	r.GET("/health", func(c *gin.Context) {
		c.JSON(200, gin.H{"status": "ok", "service": "ClinicFlow API"})
	})

	addr := fmt.Sprintf(":%s", config.App.Port)
	srv := &http.Server{Addr: addr, Handler: r}

	go func() {
		log.Printf("ClinicFlow API running on %s", addr)
		if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Fatalf("Server failed: %v", err)
		}
	}()

	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit
	log.Println("Shutting down server...")

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()
	if err := srv.Shutdown(ctx); err != nil {
		log.Fatalf("Server forced to shutdown: %v", err)
	}
	log.Println("Server exited cleanly")
}
