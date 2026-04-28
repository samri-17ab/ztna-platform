package services

import (
	"context"
	"encoding/json"
	"log"
	"os"

	"github.com/redis/go-redis/v9"
)

var RedisClient *redis.Client
var ctx = context.Background()

const RiskEventsChannel = "ztna_risk_events"

func InitRedis() {
	url := os.Getenv("REDIS_URL")
	if url == "" {
		url = "localhost:6379"
	}

	RedisClient = redis.NewClient(&redis.Options{
		Addr: url,
	})

	_, err := RedisClient.Ping(ctx).Result()
	if err != nil {
		log.Printf("Warning: Failed to connect to Redis at %s: %v", url, err)
	} else {
		log.Printf("Redis client successfully connected at %s", url)
	}
}

type RiskEvent struct {
	MACAddress string `json:"mac"`
	RiskScore  int    `json:"risk_score"`
}

func PublishRiskEvent(mac string, score int) {
	if RedisClient == nil {
		return
	}

	event := RiskEvent{
		MACAddress: mac,
		RiskScore:  score,
	}

	data, err := json.Marshal(event)
	if err != nil {
		log.Printf("Error marshaling risk event: %v", err)
		return
	}

	err = RedisClient.Publish(ctx, RiskEventsChannel, data).Err()
	if err != nil {
		log.Printf("Error publishing risk event to Redis: %v", err)
	} else {
		log.Printf("Published High Risk Event for %s (Score: %d)", mac, score)
	}
}
