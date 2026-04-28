package main

import (
	"context"
	"encoding/json"
	"log"
	"os"
	"time"

	"github.com/google/uuid"
	"github.com/redis/go-redis/v9"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

// Device model mirrored from API for DB updates
type Device struct {
	ID            uuid.UUID `gorm:"type:uuid;primaryKey"`
	MACAddress    string    `gorm:"uniqueIndex"`
	PostureStatus string
	LastRiskScore int
	UpdatedAt     time.Time
}

// AuditLog model mirrored from API
type AuditLog struct {
	ID          uuid.UUID `gorm:"type:uuid;primaryKey"`
	EventType   string
	MACAddress  string
	RiskScore   int
	ActionTaken string
	Reason      string
	CreatedAt   time.Time
}

var (
	DB          *gorm.DB
	RedisClient *redis.Client
	ctx         = context.Background()
)

const RiskEventsChannel = "ztna_risk_events"

func main() {
	initDB()
	initRedis()

	log.Printf("Worker successfully connected logic pipeline. Waiting for high-risk events...")

	pubsub := RedisClient.Subscribe(ctx, RiskEventsChannel)
	defer pubsub.Close()

	ch := pubsub.Channel()

	for msg := range ch {
		processEvent(msg.Payload)
	}
}

func initDB() {
	dsn := "host=" + os.Getenv("DB_HOST") +
		" user=" + os.Getenv("DB_USER") +
		" password=" + os.Getenv("DB_PASS") +
		" dbname=" + os.Getenv("DB_NAME") +
		" port=5432 sslmode=disable"

	if os.Getenv("DB_HOST") == "" {
		dsn = "host=localhost user=ztna_admin password=securepassword123 dbname=ztna_core port=5432 sslmode=disable"
	}

	db, err := gorm.Open(postgres.Open(dsn), &gorm.Config{})
	if err != nil {
		log.Fatalf("Worker failed to connect to database: %v", err)
	}
	DB = db
	log.Println("Worker connected to Database.")
}

func initRedis() {
	url := os.Getenv("REDIS_URL")
	if url == "" {
		url = "redis:6379"
	}

	RedisClient = redis.NewClient(&redis.Options{
		Addr: url,
	})

	_, err := RedisClient.Ping(ctx).Result()
	if err != nil {
		log.Fatalf("Worker failed to connect to Redis: %v", err)
	}
	log.Println("Worker connected to Redis.")
}

type RiskEvent struct {
	MACAddress string `json:"mac"`
	RiskScore  int    `json:"risk_score"`
}

func processEvent(payload string) {
	var event RiskEvent
	if err := json.Unmarshal([]byte(payload), &event); err != nil {
		log.Printf("Error unmarshaling event: %v", err)
		return
	}

	log.Printf("[Continuous Monitoring] DETECTED HIGH RISK: MAC %s (Score: %d)", event.MACAddress, event.RiskScore)

	// Update Device Status to Quarantined in DB
	var device Device
	if result := DB.Where("mac_address = ?", event.MACAddress).First(&device); result.Error == nil {
		device.PostureStatus = "Quarantined"
		device.LastRiskScore = event.RiskScore
		DB.Save(&device)
		log.Printf("[NAC Enforcement] Device %s has been AUTOMATICALLY QUARANTINED.", event.MACAddress)

		// Create Audit Log entry
		audit := AuditLog{
			EventType:   "posture_degraded",
			MACAddress:  event.MACAddress,
			RiskScore:   event.RiskScore,
			ActionTaken: "AUTO_QUARANTINE",
			Reason:      "Continuous monitoring detected risk score > 80",
			CreatedAt:   time.Now(),
		}
		DB.Create(&audit)
	} else {
		log.Printf("Error: Device %s not found in database for quarantine action.", event.MACAddress)
	}
}
