package db

import (
	"context"
	"database/sql"
	"fmt"
	"log"

	_ "github.com/jackc/pgx/v5/stdlib"
)

// Connect opens and pings a PostgreSQL connection using the pgx stdlib driver.
func Connect(databaseURL string) *sql.DB {
	db, err := sql.Open("pgx", databaseURL)
	if err != nil {
		log.Fatalf("db: failed to open: %v", err)
	}
	if err := db.PingContext(context.Background()); err != nil {
		log.Fatalf("db: failed to ping: %v", err)
	}
	fmt.Println("db: connected")
	return db
}
