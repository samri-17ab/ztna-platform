package services

import (
	"log"
	"os"

	"gorm.io/driver/postgres"
	"gorm.io/gorm"
	"github.com/ztna-platform/api/models"
)

var DB *gorm.DB

func InitDB() {
	// e.g. "host=postgres user=ztna_admin password=securepassword123 dbname=ztna_core port=5432 sslmode=disable"
	dsn := "host=" + os.Getenv("DB_HOST") +
		" user=" + os.Getenv("DB_USER") +
		" password=" + os.Getenv("DB_PASS") +
		" dbname=" + os.Getenv("DB_NAME") +
		" port=5432 sslmode=disable"

	log.Println("Connecting to Postgres Database at", os.Getenv("DB_HOST"))

	// Note: Disable actual connection failure for scaffold building without live DB
	db, err := gorm.Open(postgres.Open(dsn), &gorm.Config{})
	if err != nil {
		log.Printf("Warning: Failed to connect to database (Expected during pure scaffolding): %v", err)
		return
	}

	DB = db
	log.Println("Database connection established.")

	// Auto Migrate all models
	err = DB.AutoMigrate(&models.Device{}, &models.Policy{}, &models.User{}, &models.AuditLog{})
	if err != nil {
		log.Printf("Warning: Failed to auto-migrate database schema: %v", err)
	} else {
		log.Println("Database schema auto-migrated successfully.")
	}
}

