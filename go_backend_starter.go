// Go backend starter for VendoAI Single Page Application
// Files included below (concatenated for convenience):
// 1) main.go - server entry using Gin
// 2) handlers.go - route handlers and simple in-memory stores
// 3) models.go - request/response models
// 4) Dockerfile - container image
// 5) .env.example - environment variables

/* --------------------------- main.go --------------------------- */
package main

import (
	"log"
	"net/http"
	"os"
	"time"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"
)

func main() {
	// Load env
	if err := godotenv.Load(); err != nil {
		log.Println(".env not found, relying on environment variables")
	}

	mode := os.Getenv("GIN_MODE")
	if mode == "release" {
		gin.SetMode(gin.ReleaseMode)
	}

	r := gin.New()
	r.Use(gin.Logger())
	r.Use(gin.Recovery())

	// CORS - allow your frontend origin in production via ENV
	cfg := cors.Config{
		AllowOrigins:     []string{os.Getenv("FRONTEND_ORIGIN")},
		AllowMethods:     []string{"GET", "POST", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Accept", "Authorization"},
		ExposeHeaders:    []string{"Content-Length"},
		AllowCredentials: true,
		MaxAge:           12 * time.Hour,
	}
	// If FRONTEND_ORIGIN is empty in dev, allow all (change for prod)
	if cfg.AllowOrigins[0] == "" {
		cfg.AllowOrigins = []string{"*"}
	}
	r.Use(cors.New(cfg))

	// API routes
	api := r.Group("/api")
	{
		api.POST("/subscribe", SubscribeHandler)
		api.POST("/contact", ContactHandler)
		api.POST("/demo", DemoHandler)
		api.GET("/vendors/search", VendorSearchHandler)
		api.POST("/rfps/generate", GenerateRFPHandler)
	}

	// Serve static frontend (assumes build in ./frontend/build)
	frontendPath := os.Getenv("FRONTEND_PATH")
	if frontendPath == "" {
		frontendPath = "./frontend/build"
	}

	// If build directory exists, serve it. Otherwise, provide a simple endpoint.
	if _, err := os.Stat(frontendPath); err == nil {
		r.StaticFS("/", http.Dir(frontendPath))
		// fallback to index.html for SPA routing
		r.NoRoute(func(c *gin.Context) {
			c.File(frontendPath + "/index.html")
		})
	} else {
		log.Println("Frontend build not found at", frontendPath)
		r.GET("/", func(c *gin.Context) { c.String(200, "VendoAI backend running") })
	}

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}
	log.Println("Starting server on :" + port)
	if err := r.Run(":" + port); err != nil {
		log.Fatal(err)
	}
}

/* --------------------------- models.go --------------------------- */

package main

import "time"

// SubscribeRequest represents the subscribe endpoint payload
type SubscribeRequest struct {
	Email string `json:"email" binding:"required,email"`
}

// ContactRequest represents the contact form payload
type ContactRequest struct {
	Name    string `json:"name" binding:"required"`
	Email   string `json:"email" binding:"required,email"`
	Message string `json:"message" binding:"required"`
}

// DemoRequest represents the demo request payload
type DemoRequest struct {
	Name    string `json:"name" binding:"required"`
	Email   string `json:"email" binding:"required,email"`
	Company string `json:"company" binding:"required"`
	Size    string `json:"size"`
	Message string `json:"message"`
}

// RfpRequest contains fields to generate an RFP
type RfpRequest struct {
	Goal   string `json:"goal" binding:"required"`
	Scope  string `json:"scope"`
	Budget string `json:"budget"`
}

// Vendor represents a mock vendor entry returned by search
type Vendor struct {
	ID      string `json:"id"`
	Name    string `json:"name"`
	Domain  string `json:"domain"`
	Summary string `json:"summary"`
}

// Simple audit/log entry
type AuditEntry struct {
	Event     string    `json:"event"`
	Timestamp time.Time `json:"timestamp"`
	Payload   any       `json:"payload"`
}

/* --------------------------- handlers.go --------------------------- */

package main

import (
	"fmt"
	"net/http"
	"os"
	"strings"
	"sync"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

var (
	// In-memory stores - replace with DB in production
	subscribers = struct {
		sync.Mutex
		m map[string]SubscribeRequest
	}{m: make(map[string]SubscribeRequest)}

	contacts = struct {
		sync.Mutex
		m []ContactRequest
	}{m: []ContactRequest{}}

	demos = struct {
		sync.Mutex
		m []DemoRequest
	}{m: []DemoRequest{}}

	audit = struct {
		sync.Mutex
		m []AuditEntry
	}{m: []AuditEntry{}}

	// sample vendors
	sampleVendors = []Vendor{
		{ID: "v-001", Name: "KYCify", Domain: "KYC / Identity", Summary: "Specialized fintech KYC provider, scalable APIs."},
		{ID: "v-002", Name: "CloudPay Solutions", Domain: "Payments", Summary: "Payment gateway integrator with reconciliation."},
		{ID: "v-003", Name: "InfraOpt", Domain: "DevOps", Summary: "Managed infra and CI/CD for enterprise workloads."},
	}
)

func recordAudit(event string, payload any) {
	audit.Lock()
	defer audit.Unlock()
	audit.m = append(audit.m, AuditEntry{Event: event, Timestamp: time.Now().UTC(), Payload: payload})
}

// SubscribeHandler accepts email subscriptions
func SubscribeHandler(c *gin.Context) {
	var req SubscribeRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	subscribers.Lock()
	subscribers.m[strings.ToLower(req.Email)] = req
	subscribers.Unlock()

	recordAudit("subscribe", req)

	// In production: send confirmation email via SMTP/SES etc.
	c.JSON(http.StatusOK, gin.H{"status": "subscribed"})
}

// ContactHandler receives contact messages
func ContactHandler(c *gin.Context) {
	var req ContactRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	contacts.Lock()
	contacts.m = append(contacts.m, req)
	contacts.Unlock()

	recordAudit("contact", req)

	// In production: store to DB and optionally create a CRM lead
	c.JSON(http.StatusOK, gin.H{"status": "received"})
}

// DemoHandler stores demo requests
func DemoHandler(c *gin.Context) {
	var req DemoRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	demos.Lock()
	demos.m = append(demos.m, req)
	demos.Unlock()

	recordAudit("demo_request", req)

	// Optionally: send to scheduling system
	c.JSON(http.StatusOK, gin.H{"status": "queued"})
}

// VendorSearchHandler returns simple filtered vendors
func VendorSearchHandler(c *gin.Context) {
	q := strings.TrimSpace(c.Query("q"))
	if q == "" {
		c.JSON(http.StatusOK, sampleVendors)
		return
	}
	q = strings.ToLower(q)
	res := []Vendor{}
	for _, v := range sampleVendors {
		if strings.Contains(strings.ToLower(v.Name), q) || strings.Contains(strings.ToLower(v.Domain), q) || strings.Contains(strings.ToLower(v.Summary), q) {
			res = append(res, v)
		}
	}
	c.JSON(http.StatusOK, res)
}

// GenerateRFPHandler returns a simple RFP draft based on templates
func GenerateRFPHandler(c *gin.Context) {
	var req RfpRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Simple deterministic draft. In production, you may call an LLM or template engine.
	draft := buildRfpDraft(req)

	recordAudit("rfp_generated", gin.H{"id": uuid.New().String(), "goal": req.Goal})

	c.JSON(http.StatusOK, gin.H{"draft": draft})
}

func buildRfpDraft(r RfpRequest) string {
	return fmt.Sprintf(`RFP Draft\n\nGoal:\n%s\n\nScope:\n%s\n\nEstimated Budget:\n%s\n\nEvaluation Criteria:\n1. Technical fit (40)\n2. Delivery timeline (20)\n3. Cost (20)\n4. Support & SLA (10)\n5. Compliance & Security (10)\n\nSubmission Instructions:\nProvide company profile, references, proposed approach, cost breakdown, and timeline.`, r.Goal, emptyIfNil(r.Scope), emptyIfNil(r.Budget))
}

func emptyIfNil(s string) string { if s == "" { return "(not specified)" } ; return s }

/* --------------------------- Dockerfile --------------------------- */

// Dockerfile
// ----------
// FROM golang:1.21-alpine as builder
// WORKDIR /app
// COPY go.mod go.sum ./
// RUN go mod download
// COPY . .
// RUN CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build -o /vendoai-server ./
//
// FROM alpine:3.18
// RUN apk add --no-cache ca-certificates
// COPY --from=builder /vendoai-server /vendoai-server
// WORKDIR /
// ENV PORT=8080
// EXPOSE 8080
// CMD ["/vendoai-server"]

/* --------------------------- .env.example --------------------------- */

// PORT=8080
// FRONTEND_PATH=./frontend/build
// FRONTEND_ORIGIN=http://localhost:3000
// GIN_MODE=debug
