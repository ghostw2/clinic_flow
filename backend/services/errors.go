package services

import "errors"

var (
	ErrNotFound    = errors.New("not found")
	ErrConflict    = errors.New("scheduling conflict")
	ErrInvalidID   = errors.New("invalid id")
	ErrInvalidCode = errors.New("invalid verification code")
)
