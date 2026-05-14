package middleware

import (
	"context"
	"net/http"
	"strings"

	"github.com/gkj-eben-haezer/gkj-eh-be/internal/config"
	"github.com/gkj-eben-haezer/gkj-eh-be/internal/jwt"
)

type contextKey string

const claimsKey contextKey = "claims"

// RequireAuth validates a Bearer access token and stores its claims in the request context.
func RequireAuth(cfg *config.Config) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			auth := r.Header.Get("Authorization")
			if !strings.HasPrefix(auth, "Bearer ") {
				http.Error(w, `{"message":"Unauthorized"}`, http.StatusUnauthorized)
				return
			}
			tokenStr := auth[7:]
			claims, err := jwt.Verify(cfg, tokenStr)
			if err != nil || claims.Type != jwt.TokenTypeAccess {
				http.Error(w, `{"message":"Unauthorized"}`, http.StatusUnauthorized)
				return
			}
			ctx := context.WithValue(r.Context(), claimsKey, claims)
			next.ServeHTTP(w, r.WithContext(ctx))
		})
	}
}

// ClaimsFromContext retrieves JWT claims stored by RequireAuth.
func ClaimsFromContext(ctx context.Context) *jwt.Claims {
	c, _ := ctx.Value(claimsKey).(*jwt.Claims)
	return c
}
