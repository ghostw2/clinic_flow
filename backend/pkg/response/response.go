package response

import (
	"net/http"

	"github.com/gin-gonic/gin"
)

type SuccessResponse struct {
	Success bool        `json:"success"`
	Data    interface{} `json:"data,omitempty"`
	Message string      `json:"message,omitempty"`
}

type APIErrorCode struct {
	Code  string `json:"code"`
	Field string `json:"field,omitempty"`
}

type ErrorResponse struct {
	Success bool         `json:"success"`
	Error   APIErrorCode `json:"error"`
}

// OK sends a 200 with the data envelope.
func OK(c *gin.Context, data interface{}) {
	c.JSON(http.StatusOK, SuccessResponse{Success: true, Data: data})
}

// Created sends a 201 with the data envelope.
func Created(c *gin.Context, data interface{}) {
	c.JSON(http.StatusCreated, SuccessResponse{Success: true, Data: data})
}

// Message sends a 200 with only a message (no data).
func Message(c *gin.Context, msg string) {
	c.JSON(http.StatusOK, SuccessResponse{Success: true, Message: msg})
}

// Err sends an error response with the given HTTP status and error code.
func Err(c *gin.Context, status int, code string) {
	c.JSON(status, ErrorResponse{Success: false, Error: APIErrorCode{Code: code}})
}

// ErrField sends an error response with an error code and the affected field name.
func ErrField(c *gin.Context, status int, code, field string) {
	c.JSON(status, ErrorResponse{Success: false, Error: APIErrorCode{Code: code, Field: field}})
}

// Abort stops the chain and sends an error response.
func Abort(c *gin.Context, status int, code string) {
	c.AbortWithStatusJSON(status, ErrorResponse{Success: false, Error: APIErrorCode{Code: code}})
}

// ── Shortcuts ──────────────────────────────────────────────────────────────

func BadRequest(c *gin.Context, code string)    { Err(c, http.StatusBadRequest, code) }
func Unauthorized(c *gin.Context, code string)  { Err(c, http.StatusUnauthorized, code) }
func Forbidden(c *gin.Context, code string)     { Err(c, http.StatusForbidden, code) }
func NotFound(c *gin.Context, code string)      { Err(c, http.StatusNotFound, code) }
func Conflict(c *gin.Context, code string)      { Err(c, http.StatusConflict, code) }
func InternalError(c *gin.Context, code string) { Err(c, http.StatusInternalServerError, code) }
