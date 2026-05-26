package handlers

import (
	"net/http"
	"strings"

	"github.com/clinicflow/backend/locales"
	"github.com/clinicflow/backend/pkg/response"
	"github.com/gin-gonic/gin"
)

type languageInfo struct {
	Code string `json:"code"`
	Name string `json:"name"`
	Flag string `json:"flag"`
}

var supportedLanguages = []languageInfo{
	{Code: "en", Name: "English", Flag: "🇺🇸"},
	{Code: "en-GB", Name: "English (UK)", Flag: "🇬🇧"},
	{Code: "de", Name: "Deutsch", Flag: "🇩🇪"},
	{Code: "fr", Name: "Français", Flag: "🇫🇷"},
	{Code: "it", Name: "Italiano", Flag: "🇮🇹"},
	{Code: "nl", Name: "Nederlands", Flag: "🇳🇱"},
	{Code: "sq", Name: "Shqip", Flag: "🇦🇱"},
}

// GET /api/i18n/languages
func GetLanguages(c *gin.Context) {
	response.OK(c, supportedLanguages)
}

// GET /api/i18n/:lang
func GetTranslations(c *gin.Context) {
	lang := c.Param("lang")

	// Validate: only allow alphanumeric and dash
	for _, ch := range lang {
		if !((ch >= 'a' && ch <= 'z') || (ch >= 'A' && ch <= 'Z') || ch == '-') {
			response.NotFound(c, "language.not_found")
			return
		}
	}

	// Prevent path traversal
	if strings.Contains(lang, "..") || strings.Contains(lang, "/") {
		response.NotFound(c, "language.not_found")
		return
	}

	data, err := locales.FS.ReadFile(lang + ".json")
	if err != nil {
		response.NotFound(c, "language.not_found")
		return
	}

	c.Data(http.StatusOK, "application/json; charset=utf-8", data)
}
