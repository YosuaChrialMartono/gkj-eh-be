package handler

import (
	"encoding/json"
	"fmt"
	"net/http"
	"strings"

	"github.com/gkj-eben-haezer/gkj-eh-be/internal/config"
	appjwt "github.com/gkj-eben-haezer/gkj-eh-be/internal/jwt"
	"github.com/gkj-eben-haezer/gkj-eh-be/internal/model"
	"github.com/gkj-eben-haezer/gkj-eh-be/internal/store"
	"golang.org/x/crypto/bcrypt"
)

type AuthHandler struct {
	cfg   *config.Config
	users *store.UserStore
}

func NewAuthHandler(cfg *config.Config, users *store.UserStore) *AuthHandler {
	return &AuthHandler{cfg: cfg, users: users}
}

type authResponse struct {
	User         *model.User `json:"user"`
	AccessToken  string      `json:"accessToken"`
	RefreshToken string      `json:"refreshToken"`
}

func (h *AuthHandler) issueResponse(user *model.User) (*authResponse, error) {
	access, refresh, err := appjwt.IssueTokenPair(h.cfg, user)
	if err != nil {
		return nil, err
	}
	return &authResponse{User: user, AccessToken: access, RefreshToken: refresh}, nil
}

// POST /api/auth/login
func (h *AuthHandler) Login(w http.ResponseWriter, r *http.Request) {
	var body struct {
		Email    string `json:"email"`
		Password string `json:"password"`
	}
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		respondError(w, http.StatusBadRequest, "invalid request body")
		return
	}
	if body.Email == "" || body.Password == "" {
		respondError(w, http.StatusBadRequest, "email and password are required")
		return
	}

	user, err := h.users.GetByEmail(r.Context(), body.Email)
	if err != nil {
		respondError(w, http.StatusInternalServerError, "internal error")
		return
	}
	if user == nil || user.Password == nil {
		respondError(w, http.StatusUnauthorized, "invalid credentials")
		return
	}
	if err := bcrypt.CompareHashAndPassword([]byte(*user.Password), []byte(body.Password)); err != nil {
		respondError(w, http.StatusUnauthorized, "invalid credentials")
		return
	}

	resp, err := h.issueResponse(user)
	if err != nil {
		respondError(w, http.StatusInternalServerError, "failed to issue tokens")
		return
	}
	respondJSON(w, http.StatusOK, resp)
}

// POST /api/auth/register
func (h *AuthHandler) Register(w http.ResponseWriter, r *http.Request) {
	var body struct {
		Name     string `json:"name"`
		Email    string `json:"email"`
		Password string `json:"password"`
	}
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		respondError(w, http.StatusBadRequest, "invalid request body")
		return
	}
	if body.Name == "" || body.Email == "" || body.Password == "" {
		respondError(w, http.StatusBadRequest, "name, email and password are required")
		return
	}

	existing, err := h.users.GetByEmail(r.Context(), body.Email)
	if err != nil {
		respondError(w, http.StatusInternalServerError, "internal error")
		return
	}
	if existing != nil {
		respondError(w, http.StatusConflict, "email already taken")
		return
	}

	hash, err := bcrypt.GenerateFromPassword([]byte(body.Password), bcrypt.DefaultCost)
	if err != nil {
		respondError(w, http.StatusInternalServerError, "internal error")
		return
	}
	hashStr := string(hash)
	user, err := h.users.Create(r.Context(), body.Name, body.Email, &hashStr, nil)
	if err != nil {
		respondError(w, http.StatusInternalServerError, "failed to create user")
		return
	}

	resp, err := h.issueResponse(user)
	if err != nil {
		respondError(w, http.StatusInternalServerError, "failed to issue tokens")
		return
	}
	respondJSON(w, http.StatusOK, resp)
}

// POST /api/auth/google
func (h *AuthHandler) Google(w http.ResponseWriter, r *http.Request) {
	var body struct {
		IDToken string `json:"idToken"`
	}
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil || body.IDToken == "" {
		respondError(w, http.StatusBadRequest, "idToken is required")
		return
	}

	gInfo, err := verifyGoogleToken(body.IDToken, h.cfg.GoogleClientID)
	if err != nil {
		respondError(w, http.StatusUnauthorized, "invalid Google token: "+err.Error())
		return
	}

	user, err := h.users.UpsertGoogleUser(r.Context(), gInfo.name, gInfo.email, gInfo.avatar)
	if err != nil {
		respondError(w, http.StatusInternalServerError, "failed to upsert user")
		return
	}

	resp, err := h.issueResponse(user)
	if err != nil {
		respondError(w, http.StatusInternalServerError, "failed to issue tokens")
		return
	}
	respondJSON(w, http.StatusOK, resp)
}

// POST /api/auth/refresh  — body: { refreshToken: string }
func (h *AuthHandler) Refresh(w http.ResponseWriter, r *http.Request) {
	var body struct {
		RefreshToken string `json:"refreshToken"`
	}
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil || body.RefreshToken == "" {
		respondError(w, http.StatusUnauthorized, "refresh token required")
		return
	}

	claims, err := appjwt.Verify(h.cfg, body.RefreshToken)
	if err != nil || claims.Type != appjwt.TokenTypeRefresh {
		respondError(w, http.StatusUnauthorized, "invalid refresh token")
		return
	}

	user, err := h.users.GetByID(r.Context(), claims.Subject)
	if err != nil || user == nil {
		respondError(w, http.StatusUnauthorized, "user not found")
		return
	}

	resp, err := h.issueResponse(user)
	if err != nil {
		respondError(w, http.StatusInternalServerError, "failed to issue tokens")
		return
	}
	respondJSON(w, http.StatusOK, resp)
}

// POST /api/auth/logout  — stateless; cookie deletion is handled by the BFF
func (h *AuthHandler) Logout(w http.ResponseWriter, r *http.Request) {
	respondJSON(w, http.StatusOK, map[string]bool{"success": true})
}

// ─── Google token verification ────────────────────────────────────────────────

type googleInfo struct {
	name   string
	email  string
	avatar *string
}

// verifyGoogleToken calls Google's tokeninfo endpoint to validate an ID token.
func verifyGoogleToken(idToken, expectedAud string) (*googleInfo, error) {
	resp, err := http.Get("https://oauth2.googleapis.com/tokeninfo?id_token=" + idToken)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("google tokeninfo returned %d", resp.StatusCode)
	}

	var payload struct {
		Aud     string `json:"aud"`
		Email   string `json:"email"`
		Name    string `json:"name"`
		Picture string `json:"picture"`
	}
	if err := json.NewDecoder(resp.Body).Decode(&payload); err != nil {
		return nil, err
	}
	if expectedAud != "" && !strings.Contains(payload.Aud, expectedAud) {
		return nil, fmt.Errorf("token audience mismatch")
	}
	if payload.Email == "" {
		return nil, fmt.Errorf("missing email in token")
	}

	var avatar *string
	if payload.Picture != "" {
		avatar = &payload.Picture
	}
	return &googleInfo{name: payload.Name, email: payload.Email, avatar: avatar}, nil
}
