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

type ErrorResponse struct {
	Success bool   `json:"success"`
	Error   string `json:"error"`
	Detail  string `json:"detail,omitempty"`
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

// Err sends an error response with the given HTTP status.
func Err(c *gin.Context, status int, msg string) {
	c.JSON(status, ErrorResponse{Success: false, Error: msg})
}

// ErrDetail sends an error response with an extra detail field.
func ErrDetail(c *gin.Context, status int, msg, detail string) {
	c.JSON(status, ErrorResponse{Success: false, Error: msg, Detail: detail})
}

// Abort stops the chain and sends an error response.
func Abort(c *gin.Context, status int, msg string) {
	c.AbortWithStatusJSON(status, ErrorResponse{Success: false, Error: msg})
}

// ── Shortcuts ──────────────────────────────────────────────────────────────

func BadRequest(c *gin.Context, msg string)   { Err(c, http.StatusBadRequest, msg) }
func Unauthorized(c *gin.Context, msg string) { Err(c, http.StatusUnauthorized, msg) }
func Forbidden(c *gin.Context, msg string)    { Err(c, http.StatusForbidden, msg) }
func NotFound(c *gin.Context, msg string)     { Err(c, http.StatusNotFound, msg) }
func Conflict(c *gin.Context, msg string)     { Err(c, http.StatusConflict, msg) }
func InternalError(c *gin.Context, msg string) {
	Err(c, http.StatusInternalServerError, msg)
}
