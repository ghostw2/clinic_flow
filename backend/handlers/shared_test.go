package handlers

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/clinicflow/backend/services"
	"github.com/gin-gonic/gin"
)

func init() {
	gin.SetMode(gin.TestMode)
}

func runHandleErr(err error) int {
	w := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(w)
	c.Request = httptest.NewRequest(http.MethodGet, "/", nil)
	handleErr(c, err)
	return w.Code
}

func TestHandleErr_NilReturnsNoResponse(t *testing.T) {
	w := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(w)
	c.Request = httptest.NewRequest(http.MethodGet, "/", nil)
	handled := handleErr(c, nil)
	if handled {
		t.Fatal("handleErr(nil) returned true, want false")
	}
	if w.Code != http.StatusOK {
		t.Fatalf("unexpected status %d for nil error", w.Code)
	}
}

func TestHandleErr_ErrorMapping(t *testing.T) {
	tests := []struct {
		name     string
		err      error
		wantCode int
	}{
		{"not found", services.ErrNotFound, http.StatusNotFound},
		{"conflict", services.ErrConflict, http.StatusConflict},
		{"forbidden", services.ErrForbidden, http.StatusForbidden},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			code := runHandleErr(tt.err)
			if code != tt.wantCode {
				t.Errorf("handleErr(%v) = %d, want %d", tt.err, code, tt.wantCode)
			}
		})
	}
}

func TestHandleErr_UnknownErrorReturns500(t *testing.T) {
	w := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(w)
	c.Request = httptest.NewRequest(http.MethodGet, "/", nil)
	handleErr(c, services.ErrInvalidID)
	if w.Code != http.StatusInternalServerError {
		t.Fatalf("got %d, want 500 for unrecognised error", w.Code)
	}
}

func TestHandleErr_ResponseBodyIsJSON(t *testing.T) {
	w := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(w)
	c.Request = httptest.NewRequest(http.MethodGet, "/", nil)
	handleErr(c, services.ErrNotFound)

	var body map[string]any
	if err := json.Unmarshal(w.Body.Bytes(), &body); err != nil {
		t.Fatalf("response body is not valid JSON: %v", err)
	}
}
