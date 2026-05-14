package jwt

import (
	"errors"
	"fmt"
	"time"

	"github.com/gkj-eben-haezer/gkj-eh-be/internal/config"
	"github.com/gkj-eben-haezer/gkj-eh-be/internal/model"
	gojwt "github.com/golang-jwt/jwt/v5"
)

const (
	TokenTypeAccess  = "access"
	TokenTypeRefresh = "refresh"
)

type Claims struct {
	gojwt.RegisteredClaims
	Type  string `json:"type"`
	Role  string `json:"role,omitempty"`
	Email string `json:"email,omitempty"`
}

// SignAccess creates a short-lived access token for the given user.
func SignAccess(cfg *config.Config, user *model.User) (string, error) {
	now := time.Now()
	claims := Claims{
		RegisteredClaims: gojwt.RegisteredClaims{
			Subject:   user.ID,
			IssuedAt:  gojwt.NewNumericDate(now),
			ExpiresAt: gojwt.NewNumericDate(now.Add(cfg.JWTAccessTTL)),
		},
		Type:  TokenTypeAccess,
		Role:  user.Role,
		Email: user.Email,
	}
	return gojwt.NewWithClaims(gojwt.SigningMethodHS256, claims).SignedString([]byte(cfg.JWTSecret))
}

// SignRefresh creates a long-lived refresh token for the given user ID.
func SignRefresh(cfg *config.Config, userID string) (string, error) {
	now := time.Now()
	claims := Claims{
		RegisteredClaims: gojwt.RegisteredClaims{
			Subject:   userID,
			IssuedAt:  gojwt.NewNumericDate(now),
			ExpiresAt: gojwt.NewNumericDate(now.Add(cfg.JWTRefreshTTL)),
		},
		Type: TokenTypeRefresh,
	}
	return gojwt.NewWithClaims(gojwt.SigningMethodHS256, claims).SignedString([]byte(cfg.JWTSecret))
}

// Verify parses and validates a token string, returning its claims.
func Verify(cfg *config.Config, tokenStr string) (*Claims, error) {
	token, err := gojwt.ParseWithClaims(tokenStr, &Claims{}, func(t *gojwt.Token) (any, error) {
		if _, ok := t.Method.(*gojwt.SigningMethodHMAC); !ok {
			return nil, fmt.Errorf("unexpected signing method: %v", t.Header["alg"])
		}
		return []byte(cfg.JWTSecret), nil
	})
	if err != nil {
		return nil, err
	}
	claims, ok := token.Claims.(*Claims)
	if !ok || !token.Valid {
		return nil, errors.New("invalid token claims")
	}
	return claims, nil
}

// issueTokenPair is a convenience used by handlers.
func IssueTokenPair(cfg *config.Config, user *model.User) (accessToken, refreshToken string, err error) {
	accessToken, err = SignAccess(cfg, user)
	if err != nil {
		return
	}
	refreshToken, err = SignRefresh(cfg, user.ID)
	return
}
