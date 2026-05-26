package handlers

import (
	"fmt"
	"net/http"
	"os"
	"path/filepath"

	"github.com/clinicflow/backend/config"
	"github.com/clinicflow/backend/models"
	"github.com/clinicflow/backend/pkg/response"
	"github.com/clinicflow/backend/repositories"
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

const maxUploadSize = 50 << 20 // 50 MB

// GET /api/appointments/:id/documents
func ListDocuments(c *gin.Context) {
	clinicID := c.MustGet("clinic_id").(uuid.UUID)
	apptID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		response.BadRequest(c, "validation.invalid_id")
		return
	}

	docs, err := repositories.GetDocuments(apptID, clinicID)
	if err != nil {
		response.InternalError(c, "document.fetch_failed")
		return
	}

	response.OK(c, docs)
}

// POST /api/appointments/:id/documents  (multipart/form-data: file + doc_type)
func UploadDocument(c *gin.Context) {
	clinicID := c.MustGet("clinic_id").(uuid.UUID)
	userID := c.MustGet("user_id").(uuid.UUID)

	apptID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		response.BadRequest(c, "validation.invalid_id")
		return
	}

	if _, err := repositories.GetAppointmentByID(apptID.String(), clinicID); err != nil {
		response.NotFound(c, "appointment.not_found")
		return
	}

	c.Request.Body = http.MaxBytesReader(c.Writer, c.Request.Body, maxUploadSize)

	file, header, err := c.Request.FormFile("file")
	if err != nil {
		response.BadRequest(c, "document.no_file")
		return
	}
	defer file.Close()

	docType := c.PostForm("doc_type")
	if docType == "" {
		docType = "other"
	}

	storedName := uuid.New().String() + filepath.Ext(header.Filename)
	dir := filepath.Join(config.App.UploadsDir, clinicID.String(), apptID.String())
	if err := os.MkdirAll(dir, 0755); err != nil {
		response.InternalError(c, "document.storage_failed")
		return
	}

	dst := filepath.Join(dir, storedName)
	if err := c.SaveUploadedFile(header, dst); err != nil {
		response.InternalError(c, "document.storage_failed")
		return
	}

	mimeType := header.Header.Get("Content-Type")
	if mimeType == "" {
		mimeType = "application/octet-stream"
	}

	doc := &models.AppointmentDocument{
		ClinicID:      clinicID,
		AppointmentID: apptID,
		UploadedBy:    userID,
		OriginalName:  header.Filename,
		StoredName:    storedName,
		MimeType:      mimeType,
		Size:          header.Size,
		DocType:       docType,
	}

	if err := repositories.CreateDocument(doc); err != nil {
		os.Remove(dst)
		response.InternalError(c, "document.save_failed")
		return
	}

	response.Created(c, doc)
}

// GET /api/appointments/:id/documents/:docId/file
func DownloadDocument(c *gin.Context) {
	clinicID := c.MustGet("clinic_id").(uuid.UUID)

	apptID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		response.BadRequest(c, "validation.invalid_id")
		return
	}
	docID, err := uuid.Parse(c.Param("docId"))
	if err != nil {
		response.BadRequest(c, "validation.invalid_id")
		return
	}

	doc, err := repositories.GetDocumentByID(docID, apptID, clinicID)
	if err != nil {
		response.NotFound(c, "document.not_found")
		return
	}

	filePath := filepath.Join(config.App.UploadsDir, clinicID.String(), apptID.String(), doc.StoredName)

	inline := c.Query("inline") == "1"
	if inline {
		c.Header("Content-Disposition", fmt.Sprintf(`inline; filename="%s"`, doc.OriginalName))
	} else {
		c.Header("Content-Disposition", fmt.Sprintf(`attachment; filename="%s"`, doc.OriginalName))
	}
	c.Header("Content-Type", doc.MimeType)
	c.File(filePath)
}

// DELETE /api/appointments/:id/documents/:docId
func DeleteDocument(c *gin.Context) {
	clinicID := c.MustGet("clinic_id").(uuid.UUID)

	apptID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		response.BadRequest(c, "validation.invalid_id")
		return
	}
	docID, err := uuid.Parse(c.Param("docId"))
	if err != nil {
		response.BadRequest(c, "validation.invalid_id")
		return
	}

	doc, err := repositories.GetDocumentByID(docID, apptID, clinicID)
	if err != nil {
		response.NotFound(c, "document.not_found")
		return
	}

	filePath := filepath.Join(config.App.UploadsDir, clinicID.String(), apptID.String(), doc.StoredName)
	os.Remove(filePath)

	if err := repositories.DeleteDocument(&doc); err != nil {
		response.InternalError(c, "document.delete_failed")
		return
	}

	response.Message(c, "document deleted")
}
