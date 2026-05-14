package handler

import (
	"encoding/json"
	"net/http"
	"strconv"

	"github.com/go-chi/chi/v5"
	"github.com/gkj-eben-haezer/gkj-eh-be/internal/middleware"
	"github.com/gkj-eben-haezer/gkj-eh-be/internal/model"
	"github.com/gkj-eben-haezer/gkj-eh-be/internal/store"
)

type ContentHandler struct {
	content *store.ContentStore
}

func NewContentHandler(content *store.ContentStore) *ContentHandler {
	return &ContentHandler{content: content}
}

func parseListParams(r *http.Request) model.ContentListParams {
	q := r.URL.Query()
	p := model.ContentListParams{
		Type:   q.Get("type"),
		Status: q.Get("status"),
		Search: q.Get("search"),
	}
	if v, err := strconv.Atoi(q.Get("page")); err == nil && v > 0 {
		p.Page = v
	}
	if v, err := strconv.Atoi(q.Get("limit")); err == nil && v > 0 {
		p.Limit = v
	}
	return p
}

// GET /api/content/public
func (h *ContentHandler) ListPublic(w http.ResponseWriter, r *http.Request) {
	result, err := h.content.List(r.Context(), parseListParams(r), true)
	if err != nil {
		respondError(w, http.StatusInternalServerError, "failed to list content")
		return
	}
	respondJSON(w, http.StatusOK, result)
}

// GET /api/content/public/slug/:slug
func (h *ContentHandler) GetPublicBySlug(w http.ResponseWriter, r *http.Request) {
	slug := chi.URLParam(r, "slug")
	c, err := h.content.GetBySlug(r.Context(), slug, true)
	if err != nil {
		respondError(w, http.StatusInternalServerError, "failed to get content")
		return
	}
	if c == nil {
		respondError(w, http.StatusNotFound, "content not found")
		return
	}
	respondJSON(w, http.StatusOK, c)
}

// GET /api/content  (authenticated)
func (h *ContentHandler) List(w http.ResponseWriter, r *http.Request) {
	result, err := h.content.List(r.Context(), parseListParams(r), false)
	if err != nil {
		respondError(w, http.StatusInternalServerError, "failed to list content")
		return
	}
	respondJSON(w, http.StatusOK, result)
}

// POST /api/content  (authenticated)
func (h *ContentHandler) Create(w http.ResponseWriter, r *http.Request) {
	claims := middleware.ClaimsFromContext(r.Context())
	var in model.ContentCreateInput
	if err := json.NewDecoder(r.Body).Decode(&in); err != nil {
		respondError(w, http.StatusBadRequest, "invalid request body")
		return
	}
	if in.Title == "" || in.Slug == "" || in.Type == "" {
		respondError(w, http.StatusBadRequest, "title, slug and type are required")
		return
	}
	c, err := h.content.Create(r.Context(), in, claims.Subject)
	if err != nil {
		respondError(w, http.StatusInternalServerError, "failed to create content")
		return
	}
	respondJSON(w, http.StatusCreated, c)
}

// GET /api/content/:id  (authenticated)
func (h *ContentHandler) GetByID(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	c, err := h.content.GetByID(r.Context(), id)
	if err != nil {
		respondError(w, http.StatusInternalServerError, "failed to get content")
		return
	}
	if c == nil {
		respondError(w, http.StatusNotFound, "content not found")
		return
	}
	respondJSON(w, http.StatusOK, c)
}

// PUT /api/content/:id  (authenticated)
func (h *ContentHandler) Update(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	var in model.ContentUpdateInput
	if err := json.NewDecoder(r.Body).Decode(&in); err != nil {
		respondError(w, http.StatusBadRequest, "invalid request body")
		return
	}
	c, err := h.content.Update(r.Context(), id, in)
	if err != nil {
		respondError(w, http.StatusInternalServerError, "failed to update content")
		return
	}
	if c == nil {
		respondError(w, http.StatusNotFound, "content not found")
		return
	}
	respondJSON(w, http.StatusOK, c)
}

// DELETE /api/content/:id  (authenticated)
func (h *ContentHandler) Delete(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	if err := h.content.Delete(r.Context(), id); err != nil {
		respondError(w, http.StatusInternalServerError, "failed to delete content")
		return
	}
	w.WriteHeader(http.StatusNoContent)
}
