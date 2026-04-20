package services

import (
	"time"

	"github.com/clinicflow/backend/models"
	"github.com/clinicflow/backend/repositories"
	"github.com/google/uuid"
)

type DashboardStats struct {
	TodayCount    int64                `json:"today_count"`
	TotalPatients int64                `json:"total_patients"`
	MonthlyCount  int64                `json:"monthly_count"`
	PendingCount  int64                `json:"pending_count"`
	Upcoming      []models.Appointment `json:"upcoming"`
}

func GetDashboardStats(clinicID uuid.UUID, role string, userID uuid.UUID) (DashboardStats, error) {
	now := time.Now()
	todayStart := time.Date(now.Year(), now.Month(), now.Day(), 0, 0, 0, 0, now.Location())
	todayEnd := todayStart.Add(24 * time.Hour)
	monthStart := time.Date(now.Year(), now.Month(), 1, 0, 0, 0, 0, now.Location())

	f := repositories.DashboardFilters{
		OnlyDoctor: role == string(models.RoleDoctor),
		UserID:     userID,
	}

	todayCount, err := repositories.CountAppointments(clinicID, f, &todayStart, &todayEnd, "")
	if err != nil {
		return DashboardStats{}, err
	}

	monthlyCount, err := repositories.CountAppointments(clinicID, f, &monthStart, nil, "")
	if err != nil {
		return DashboardStats{}, err
	}

	pendingCount, err := repositories.CountAppointments(clinicID, f, nil, nil, models.StatusPending)
	if err != nil {
		return DashboardStats{}, err
	}

	totalPatients, err := repositories.CountPatients(clinicID)
	if err != nil {
		return DashboardStats{}, err
	}

	upcoming, err := repositories.GetUpcomingAppointments(clinicID, f, now, 5)
	if err != nil {
		return DashboardStats{}, err
	}

	return DashboardStats{
		TodayCount:    todayCount,
		TotalPatients: totalPatients,
		MonthlyCount:  monthlyCount,
		PendingCount:  pendingCount,
		Upcoming:      upcoming,
	}, nil
}
