package middleware

import (
	"net/http"
	"sync"
	"time"

	"github.com/gin-gonic/gin"
	"golang.org/x/time/rate"
)

type ipLimiter struct {
	limiter  *rate.Limiter
	lastSeen time.Time
}

// RateLimit allows n requests per window per remote IP.
func RateLimit(n int, window time.Duration) gin.HandlerFunc {
	r := rate.Limit(float64(n) / window.Seconds())
	var (
		mu       sync.Mutex
		limiters = map[string]*ipLimiter{}
	)
	go func() {
		for {
			time.Sleep(5 * time.Minute)
			mu.Lock()
			for ip, l := range limiters {
				if time.Since(l.lastSeen) > 10*time.Minute {
					delete(limiters, ip)
				}
			}
			mu.Unlock()
		}
	}()
	return func(c *gin.Context) {
		ip := c.ClientIP()
		mu.Lock()
		l, ok := limiters[ip]
		if !ok {
			l = &ipLimiter{limiter: rate.NewLimiter(r, n)}
			limiters[ip] = l
		}
		l.lastSeen = time.Now()
		allowed := l.limiter.Allow()
		mu.Unlock()
		if !allowed {
			c.AbortWithStatus(http.StatusTooManyRequests)
			return
		}
		c.Next()
	}
}
