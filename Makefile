.PHONY: run build tidy db-up db-down db-reset dev

run:
	go run ./cmd/server

build:
	go build -o bin/server ./cmd/server

tidy:
	go mod tidy

dev:
	air

db-up:
	docker-compose up -d

db-down:
	docker-compose down

db-reset:
	docker-compose down -v
	docker-compose up -d

setup:
	go install github.com/air-verse/air@latest
