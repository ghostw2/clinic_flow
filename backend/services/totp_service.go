package services

import (
	"encoding/base64"
	"errors"

	"github.com/clinicflow/backend/models"
	"github.com/clinicflow/backend/repositories"
	"github.com/google/uuid"
	"github.com/pquerna/otp/totp"
	"github.com/skip2/go-qrcode"
	"gorm.io/gorm"
)

// Setup2FA generates a new TOTP secret and QR code for the user.
// The secret is stored but 2FA is not yet enabled until Enable2FA confirms it.
func Setup2FA(userID uuid.UUID) (secret, qrDataURL string, err error) {
	user, err := repositories.GetUserWithClinic(userID)
	if err != nil {
		if err == gorm.ErrRecordNotFound {
			return "", "", ErrNotFound
		}
		return "", "", err
	}

	if user.Clinic.IsDemo {
		return "", "", ErrForbidden
	}

	key, err := totp.Generate(totp.GenerateOpts{
		Issuer:      "ClinicFlow",
		AccountName: user.Email,
	})
	if err != nil {
		return "", "", err
	}

	if err := repositories.SetUser2FASecret(userID, key.Secret()); err != nil {
		return "", "", err
	}

	png, err := qrcode.Encode(key.URL(), qrcode.Medium, 256)
	if err != nil {
		return "", "", err
	}

	qrDataURL = "data:image/png;base64," + base64.StdEncoding.EncodeToString(png)
	return key.Secret(), qrDataURL, nil
}

// Enable2FA verifies the first TOTP code and activates 2FA for the account.
func Enable2FA(userID uuid.UUID, code string) error {
	user, err := repositories.GetUserByID(userID)
	if err != nil {
		if err == gorm.ErrRecordNotFound {
			return ErrNotFound
		}
		return err
	}

	if user.TwoFactorSecret == "" {
		return errors.New("2FA setup not initiated — call /2fa/setup first")
	}

	if !totp.Validate(code, user.TwoFactorSecret) {
		return ErrInvalidCode
	}

	return repositories.SetUser2FAEnabled(userID, true, true)
}

// Verify2FA validates a pre-auth token + TOTP code and issues a full session.
func Verify2FA(preAuthToken, code string) (models.Session, models.User, error) {
	preAuth, err := repositories.GetPreAuthSessionByID(preAuthToken)
	if err != nil {
		if err == gorm.ErrRecordNotFound {
			return models.Session{}, models.User{}, ErrNotFound
		}
		return models.Session{}, models.User{}, err
	}

	user, err := repositories.GetUserByID(preAuth.UserID)
	if err != nil {
		return models.Session{}, models.User{}, err
	}

	if !totp.Validate(code, user.TwoFactorSecret) {
		return models.Session{}, models.User{}, ErrInvalidCode
	}

	// Consume the pre-auth token — it's single-use
	repositories.DeletePreAuthSession(preAuthToken)

	session, err := createFullSession(user)
	if err != nil {
		return models.Session{}, models.User{}, err
	}

	return session, user, nil
}

// Disable2FA verifies the TOTP code and removes 2FA from the account.
func Disable2FA(userID uuid.UUID, code string) error {
	user, err := repositories.GetUserByID(userID)
	if err != nil {
		if err == gorm.ErrRecordNotFound {
			return ErrNotFound
		}
		return err
	}

	if !user.TwoFactorEnabled {
		return errors.New("2FA is not enabled")
	}

	if !totp.Validate(code, user.TwoFactorSecret) {
		return ErrInvalidCode
	}

	return repositories.SetUser2FAEnabled(userID, false, false)
}
