package services

import (
	"time"

	"github.com/clinicflow/backend/config"
	"github.com/clinicflow/backend/models"
	"github.com/clinicflow/backend/repositories"
	"github.com/google/uuid"
	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"
)

type LoginResult struct {
	User         models.User
	Session      *models.Session    // set when 2FA is not required
	PreAuthToken string             // set when 2FA is required
	Requires2FA  bool
}

func Login(email, password string) (LoginResult, error) {
	user, err := repositories.GetUserByEmail(email)
	if err != nil {
		if err == gorm.ErrRecordNotFound {
			return LoginResult{}, ErrNotFound
		}
		return LoginResult{}, err
	}

	if err := bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte(password)); err != nil {
		return LoginResult{}, ErrNotFound
	}

	// Password valid — check if 2FA is required
	if user.TwoFactorEnabled && user.TwoFactorVerified {
		preAuth := models.PreAuthSession{
			ID:        uuid.New().String(),
			UserID:    user.ID,
			ExpiresAt: time.Now().Add(5 * time.Minute),
		}
		if err := repositories.CreatePreAuthSession(&preAuth); err != nil {
			return LoginResult{}, err
		}
		return LoginResult{User: user, PreAuthToken: preAuth.ID, Requires2FA: true}, nil
	}

	session, err := createFullSession(user)
	if err != nil {
		return LoginResult{}, err
	}
	return LoginResult{User: user, Session: &session}, nil
}

func Logout(sessionID string) error {
	return repositories.DeleteSession(sessionID)
}

func GetSession(sessionID string) (models.Session, error) {
	session, err := repositories.GetSessionByID(sessionID)
	if err != nil {
		if err == gorm.ErrRecordNotFound {
			return models.Session{}, ErrNotFound
		}
		return models.Session{}, err
	}
	return session, nil
}

func RefreshSession(sessionID string) error {
	_, err := repositories.GetSessionByID(sessionID)
	if err != nil {
		if err == gorm.ErrRecordNotFound {
			return ErrNotFound
		}
		return err
	}
	expiry := time.Duration(config.App.SessionExpiryHours) * time.Hour
	return repositories.ExtendSession(sessionID, time.Now().Add(expiry))
}

func createFullSession(user models.User) (models.Session, error) {
	expiry := time.Duration(config.App.SessionExpiryHours) * time.Hour
	session := models.Session{
		ID:        uuid.New().String(),
		UserID:    user.ID,
		ClinicID:  user.ClinicID,
		Role:      string(user.Role),
		ExpiresAt: time.Now().Add(expiry),
	}
	return session, repositories.CreateSession(&session)
}
