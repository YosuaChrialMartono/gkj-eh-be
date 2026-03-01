package main

import (
	"fmt"
	"log"
	"net/http"
	"strings"

	"github.com/go-chi/chi/v5"
	chiMiddleware "github.com/go-chi/chi/v5/middleware"
	"github.com/gkj-eben-haezer/gkj-eh-be/internal/config"
	"github.com/gkj-eben-haezer/gkj-eh-be/internal/db"
	"github.com/gkj-eben-haezer/gkj-eh-be/internal/handler"
	appMiddleware "github.com/gkj-eben-haezer/gkj-eh-be/internal/middleware"
	"github.com/gkj-eben-haezer/gkj-eh-be/internal/migrate"
	"github.com/gkj-eben-haezer/gkj-eh-be/internal/store"
	"github.com/joho/godotenv"
)

func main() {
	// Load .env if present (ignored in production where env is set externally)
	_ = godotenv.Load()

	cfg := config.Load()
	database := db.Connect(cfg.DatabaseURL)
	defer database.Close()

	// Run idempotent migrations on every start
	if err := migrate.Run(database, "migrations"); err != nil {
		log.Fatalf("migration failed: %v", err)
	}

	// Stores
	users := store.NewUserStore(database)
	content := store.NewContentStore(database)
	pelayan := store.NewPelayanStore(database)

	// Handlers
	authH := handler.NewAuthHandler(cfg, users)
	contentH := handler.NewContentHandler(content)
	pelayanH := handler.NewPelayanHandler(pelayan)

	// Router
	r := chi.NewRouter()
	r.Use(chiMiddleware.Logger)
	r.Use(chiMiddleware.Recoverer)
	r.Use(corsMiddleware(cfg.AllowedOrigins))

	r.Route("/api", func(r chi.Router) {
		// Auth (public)
		r.Route("/auth", func(r chi.Router) {
			r.Post("/login", authH.Login)
			r.Post("/register", authH.Register)
			r.Post("/google", authH.Google)
			r.Post("/refresh", authH.Refresh)
			r.Post("/logout", authH.Logout)
		})

		// Content — public endpoints first, then protected
		r.Get("/content/public", contentH.ListPublic)
		r.Get("/content/public/slug/{slug}", contentH.GetPublicBySlug)

		r.Group(func(r chi.Router) {
			r.Use(appMiddleware.RequireAuth(cfg))
			r.Get("/content", contentH.List)
			r.Post("/content", contentH.Create)
			r.Get("/content/{id}", contentH.GetByID)
			r.Put("/content/{id}", contentH.Update)
			r.Delete("/content/{id}", contentH.Delete)

			// Pelayan
			r.Get("/pelayan/roles", pelayanH.ListRoles)
			r.Post("/pelayan/roles", pelayanH.CreateRole)
			r.Put("/pelayan/roles/{id}", pelayanH.UpdateRole)
			r.Delete("/pelayan/roles/{id}", pelayanH.DeleteRole)

			r.Get("/pelayan/persons", pelayanH.ListPersons)
			r.Post("/pelayan/persons", pelayanH.CreatePerson)
			r.Delete("/pelayan/persons/{id}", pelayanH.DeletePerson)

			r.Get("/pelayan/services", pelayanH.ListServices)
			r.Post("/pelayan/services", pelayanH.CreateService)
			r.Put("/pelayan/services/{id}", pelayanH.UpdateService)
			r.Delete("/pelayan/services/{id}", pelayanH.DeleteService)

			r.Get("/pelayan/assignments", pelayanH.ListAssignments)
			r.Post("/pelayan/assignments", pelayanH.UpsertAssignment)
			r.Delete("/pelayan/assignments/{id}", pelayanH.DeleteAssignment)
		})
	})

	addr := ":" + cfg.Port
	fmt.Printf("server: listening on %s\n", addr)
	if err := http.ListenAndServe(addr, r); err != nil {
		log.Fatalf("server: %v", err)
	}
}

// corsMiddleware adds permissive CORS headers for configured origins.
func corsMiddleware(allowedOrigins string) func(http.Handler) http.Handler {
	origins := strings.Split(allowedOrigins, ",")
	originSet := make(map[string]bool, len(origins))
	for _, o := range origins {
		originSet[strings.TrimSpace(o)] = true
	}

	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			origin := r.Header.Get("Origin")
			if originSet[origin] {
				w.Header().Set("Access-Control-Allow-Origin", origin)
				w.Header().Set("Access-Control-Allow-Credentials", "true")
				w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
				w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")
			}
			if r.Method == http.MethodOptions {
				w.WriteHeader(http.StatusNoContent)
				return
			}
			next.ServeHTTP(w, r)
		})
	}
}
