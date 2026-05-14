package handler

import (
	"encoding/json"
	"net/http"

	"github.com/go-chi/chi/v5"
	"github.com/gkj-eben-haezer/gkj-eh-be/internal/model"
	"github.com/gkj-eben-haezer/gkj-eh-be/internal/store"
)

type PelayanHandler struct {
	pelayan *store.PelayanStore
}

func NewPelayanHandler(pelayan *store.PelayanStore) *PelayanHandler {
	return &PelayanHandler{pelayan: pelayan}
}

// ─── Roles ───────────────────────────────────────────────────────────────────

// GET /api/pelayan/roles
func (h *PelayanHandler) ListRoles(w http.ResponseWriter, r *http.Request) {
	roles, err := h.pelayan.ListRoles(r.Context())
	if err != nil {
		respondError(w, http.StatusInternalServerError, "failed to list roles")
		return
	}
	respondJSON(w, http.StatusOK, roles)
}

// POST /api/pelayan/roles
func (h *PelayanHandler) CreateRole(w http.ResponseWriter, r *http.Request) {
	var in model.PelayanRoleInput
	if err := json.NewDecoder(r.Body).Decode(&in); err != nil || in.Name == "" {
		respondError(w, http.StatusBadRequest, "name is required")
		return
	}
	role, err := h.pelayan.CreateRole(r.Context(), in)
	if err != nil {
		respondError(w, http.StatusInternalServerError, "failed to create role")
		return
	}
	respondJSON(w, http.StatusCreated, role)
}

// PUT /api/pelayan/roles/:id
func (h *PelayanHandler) UpdateRole(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	var in model.PelayanRoleInput
	if err := json.NewDecoder(r.Body).Decode(&in); err != nil || in.Name == "" {
		respondError(w, http.StatusBadRequest, "name is required")
		return
	}
	role, err := h.pelayan.UpdateRole(r.Context(), id, in)
	if err != nil {
		respondError(w, http.StatusInternalServerError, "failed to update role")
		return
	}
	if role == nil {
		respondError(w, http.StatusNotFound, "role not found")
		return
	}
	respondJSON(w, http.StatusOK, role)
}

// DELETE /api/pelayan/roles/:id
func (h *PelayanHandler) DeleteRole(w http.ResponseWriter, r *http.Request) {
	if err := h.pelayan.DeleteRole(r.Context(), chi.URLParam(r, "id")); err != nil {
		respondError(w, http.StatusInternalServerError, "failed to delete role")
		return
	}
	w.WriteHeader(http.StatusNoContent)
}

// ─── Persons ─────────────────────────────────────────────────────────────────

// GET /api/pelayan/persons
func (h *PelayanHandler) ListPersons(w http.ResponseWriter, r *http.Request) {
	persons, err := h.pelayan.ListPersons(r.Context())
	if err != nil {
		respondError(w, http.StatusInternalServerError, "failed to list persons")
		return
	}
	respondJSON(w, http.StatusOK, persons)
}

// POST /api/pelayan/persons
func (h *PelayanHandler) CreatePerson(w http.ResponseWriter, r *http.Request) {
	var body struct {
		Name string `json:"name"`
	}
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil || body.Name == "" {
		respondError(w, http.StatusBadRequest, "name is required")
		return
	}
	person, err := h.pelayan.CreatePerson(r.Context(), body.Name)
	if err != nil {
		respondError(w, http.StatusInternalServerError, "failed to create person")
		return
	}
	respondJSON(w, http.StatusCreated, person)
}

// DELETE /api/pelayan/persons/:id
func (h *PelayanHandler) DeletePerson(w http.ResponseWriter, r *http.Request) {
	if err := h.pelayan.DeletePerson(r.Context(), chi.URLParam(r, "id")); err != nil {
		respondError(w, http.StatusInternalServerError, "failed to delete person")
		return
	}
	w.WriteHeader(http.StatusNoContent)
}

// ─── Services ────────────────────────────────────────────────────────────────

// GET /api/pelayan/services?month=YYYY-MM
func (h *PelayanHandler) ListServices(w http.ResponseWriter, r *http.Request) {
	month := r.URL.Query().Get("month")
	svcs, err := h.pelayan.ListServices(r.Context(), month)
	if err != nil {
		respondError(w, http.StatusInternalServerError, "failed to list services")
		return
	}
	respondJSON(w, http.StatusOK, svcs)
}

// POST /api/pelayan/services
func (h *PelayanHandler) CreateService(w http.ResponseWriter, r *http.Request) {
	var in model.PelayanServiceInput
	if err := json.NewDecoder(r.Body).Decode(&in); err != nil || in.Date == "" {
		respondError(w, http.StatusBadRequest, "date is required")
		return
	}
	svc, err := h.pelayan.CreateService(r.Context(), in)
	if err != nil {
		respondError(w, http.StatusInternalServerError, "failed to create service")
		return
	}
	respondJSON(w, http.StatusCreated, svc)
}

// PUT /api/pelayan/services/:id
func (h *PelayanHandler) UpdateService(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	var in model.PelayanServiceInput
	if err := json.NewDecoder(r.Body).Decode(&in); err != nil || in.Date == "" {
		respondError(w, http.StatusBadRequest, "date is required")
		return
	}
	svc, err := h.pelayan.UpdateService(r.Context(), id, in)
	if err != nil {
		respondError(w, http.StatusInternalServerError, "failed to update service")
		return
	}
	if svc == nil {
		respondError(w, http.StatusNotFound, "service not found")
		return
	}
	respondJSON(w, http.StatusOK, svc)
}

// DELETE /api/pelayan/services/:id
func (h *PelayanHandler) DeleteService(w http.ResponseWriter, r *http.Request) {
	if err := h.pelayan.DeleteService(r.Context(), chi.URLParam(r, "id")); err != nil {
		respondError(w, http.StatusInternalServerError, "failed to delete service")
		return
	}
	w.WriteHeader(http.StatusNoContent)
}

// ─── Assignments ─────────────────────────────────────────────────────────────

// GET /api/pelayan/assignments?serviceId=...
func (h *PelayanHandler) ListAssignments(w http.ResponseWriter, r *http.Request) {
	serviceID := r.URL.Query().Get("serviceId")
	if serviceID == "" {
		respondError(w, http.StatusBadRequest, "serviceId is required")
		return
	}
	assignments, err := h.pelayan.ListAssignments(r.Context(), serviceID)
	if err != nil {
		respondError(w, http.StatusInternalServerError, "failed to list assignments")
		return
	}
	respondJSON(w, http.StatusOK, assignments)
}

// POST /api/pelayan/assignments  (upsert)
func (h *PelayanHandler) UpsertAssignment(w http.ResponseWriter, r *http.Request) {
	var in model.PelayanAssignmentInput
	if err := json.NewDecoder(r.Body).Decode(&in); err != nil {
		respondError(w, http.StatusBadRequest, "invalid request body")
		return
	}
	if in.ServiceID == "" || in.RoleID == "" || in.PelayanName == "" {
		respondError(w, http.StatusBadRequest, "serviceId, roleId and pelayanName are required")
		return
	}
	a, err := h.pelayan.UpsertAssignment(r.Context(), in)
	if err != nil {
		respondError(w, http.StatusInternalServerError, "failed to save assignment")
		return
	}
	respondJSON(w, http.StatusCreated, a)
}

// DELETE /api/pelayan/assignments/:id
func (h *PelayanHandler) DeleteAssignment(w http.ResponseWriter, r *http.Request) {
	if err := h.pelayan.DeleteAssignment(r.Context(), chi.URLParam(r, "id")); err != nil {
		respondError(w, http.StatusInternalServerError, "failed to delete assignment")
		return
	}
	w.WriteHeader(http.StatusNoContent)
}
