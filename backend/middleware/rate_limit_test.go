package middleware

import (
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"github.com/gin-gonic/gin"
)

func init() {
	gin.SetMode(gin.TestMode)
}

func newRateLimitRouter(n int, window time.Duration) *gin.Engine {
	r := gin.New()
	r.GET("/", RateLimit(n, window), func(c *gin.Context) {
		c.Status(http.StatusOK)
	})
	return r
}

func TestRateLimit_AllowsUpToLimit(t *testing.T) {
	const limit = 3
	r := newRateLimitRouter(limit, time.Minute)

	for i := range limit {
		w := httptest.NewRecorder()
		req := httptest.NewRequest(http.MethodGet, "/", nil)
		req.RemoteAddr = "1.2.3.4:0"
		r.ServeHTTP(w, req)
		if w.Code != http.StatusOK {
			t.Fatalf("request %d: got %d, want 200", i+1, w.Code)
		}
	}
}

func TestRateLimit_BlocksAfterLimit(t *testing.T) {
	const limit = 3
	r := newRateLimitRouter(limit, time.Minute)

	for range limit {
		w := httptest.NewRecorder()
		req := httptest.NewRequest(http.MethodGet, "/", nil)
		req.RemoteAddr = "1.2.3.4:0"
		r.ServeHTTP(w, req)
	}

	w := httptest.NewRecorder()
	req := httptest.NewRequest(http.MethodGet, "/", nil)
	req.RemoteAddr = "1.2.3.4:0"
	r.ServeHTTP(w, req)

	if w.Code != http.StatusTooManyRequests {
		t.Fatalf("got %d, want 429 after limit exceeded", w.Code)
	}
}

func TestRateLimit_DifferentIPsAreIndependent(t *testing.T) {
	const limit = 2
	r := newRateLimitRouter(limit, time.Minute)

	// Exhaust IP A
	for range limit + 1 {
		w := httptest.NewRecorder()
		req := httptest.NewRequest(http.MethodGet, "/", nil)
		req.RemoteAddr = "10.0.0.1:0"
		r.ServeHTTP(w, req)
	}

	// IP B should still be allowed
	w := httptest.NewRecorder()
	req := httptest.NewRequest(http.MethodGet, "/", nil)
	req.RemoteAddr = "10.0.0.2:0"
	r.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Fatalf("IP B got %d, want 200 (independent from IP A)", w.Code)
	}
}
