package store

import (
	"context"
	"database/sql"
	"errors"

	"github.com/gkj-eben-haezer/gkj-eh-be/internal/model"
)

type PelayanStore struct {
	db *sql.DB
}

func NewPelayanStore(db *sql.DB) *PelayanStore {
	return &PelayanStore{db: db}
}

// ─── Roles ───────────────────────────────────────────────────────────────────

func (s *PelayanStore) ListRoles(ctx context.Context) ([]model.PelayanRole, error) {
	rows, err := s.db.QueryContext(ctx, `SELECT id, name, "order" FROM pelayan_roles ORDER BY "order", name`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var roles []model.PelayanRole
	for rows.Next() {
		var r model.PelayanRole
		if err := rows.Scan(&r.ID, &r.Name, &r.Order); err != nil {
			return nil, err
		}
		roles = append(roles, r)
	}
	if roles == nil {
		roles = []model.PelayanRole{}
	}
	return roles, rows.Err()
}

func (s *PelayanStore) CreateRole(ctx context.Context, in model.PelayanRoleInput) (*model.PelayanRole, error) {
	order := 0
	if in.Order != nil {
		order = *in.Order
	}
	r := &model.PelayanRole{}
	return r, s.db.QueryRowContext(ctx,
		`INSERT INTO pelayan_roles (name, "order") VALUES ($1, $2) RETURNING id, name, "order"`,
		in.Name, order,
	).Scan(&r.ID, &r.Name, &r.Order)
}

func (s *PelayanStore) UpdateRole(ctx context.Context, id string, in model.PelayanRoleInput) (*model.PelayanRole, error) {
	order := 0
	if in.Order != nil {
		order = *in.Order
	}
	r := &model.PelayanRole{}
	err := s.db.QueryRowContext(ctx,
		`UPDATE pelayan_roles SET name=$1, "order"=$2 WHERE id=$3 RETURNING id, name, "order"`,
		in.Name, order, id,
	).Scan(&r.ID, &r.Name, &r.Order)
	if errors.Is(err, sql.ErrNoRows) {
		return nil, nil
	}
	return r, err
}

func (s *PelayanStore) DeleteRole(ctx context.Context, id string) error {
	_, err := s.db.ExecContext(ctx, `DELETE FROM pelayan_roles WHERE id=$1`, id)
	return err
}

// ─── Persons ─────────────────────────────────────────────────────────────────

func (s *PelayanStore) ListPersons(ctx context.Context) ([]model.PelayanPerson, error) {
	rows, err := s.db.QueryContext(ctx, `SELECT id, name FROM pelayan_persons ORDER BY name`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var persons []model.PelayanPerson
	for rows.Next() {
		var p model.PelayanPerson
		if err := rows.Scan(&p.ID, &p.Name); err != nil {
			return nil, err
		}
		persons = append(persons, p)
	}
	if persons == nil {
		persons = []model.PelayanPerson{}
	}
	return persons, rows.Err()
}

func (s *PelayanStore) CreatePerson(ctx context.Context, name string) (*model.PelayanPerson, error) {
	p := &model.PelayanPerson{}
	return p, s.db.QueryRowContext(ctx,
		`INSERT INTO pelayan_persons (name) VALUES ($1) RETURNING id, name`, name,
	).Scan(&p.ID, &p.Name)
}

func (s *PelayanStore) DeletePerson(ctx context.Context, id string) error {
	_, err := s.db.ExecContext(ctx, `DELETE FROM pelayan_persons WHERE id=$1`, id)
	return err
}

// ─── Services ────────────────────────────────────────────────────────────────

func (s *PelayanStore) ListServices(ctx context.Context, month string) ([]model.PelayanService, error) {
	q := `SELECT id, to_char(date, 'YYYY-MM-DD'), label, is_extra FROM pelayan_services`
	args := []any{}
	if month != "" {
		q += ` WHERE to_char(date, 'YYYY-MM') = $1`
		args = append(args, month)
	}
	q += ` ORDER BY date`
	rows, err := s.db.QueryContext(ctx, q, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var svcs []model.PelayanService
	for rows.Next() {
		var svc model.PelayanService
		if err := rows.Scan(&svc.ID, &svc.Date, &svc.Label, &svc.IsExtra); err != nil {
			return nil, err
		}
		svcs = append(svcs, svc)
	}
	if svcs == nil {
		svcs = []model.PelayanService{}
	}
	return svcs, rows.Err()
}

func (s *PelayanStore) CreateService(ctx context.Context, in model.PelayanServiceInput) (*model.PelayanService, error) {
	isExtra := false
	if in.IsExtra != nil {
		isExtra = *in.IsExtra
	}
	svc := &model.PelayanService{}
	return svc, s.db.QueryRowContext(ctx,
		`INSERT INTO pelayan_services (date, label, is_extra) VALUES ($1, $2, $3)
		 RETURNING id, to_char(date, 'YYYY-MM-DD'), label, is_extra`,
		in.Date, in.Label, isExtra,
	).Scan(&svc.ID, &svc.Date, &svc.Label, &svc.IsExtra)
}

func (s *PelayanStore) UpdateService(ctx context.Context, id string, in model.PelayanServiceInput) (*model.PelayanService, error) {
	isExtra := false
	if in.IsExtra != nil {
		isExtra = *in.IsExtra
	}
	svc := &model.PelayanService{}
	err := s.db.QueryRowContext(ctx,
		`UPDATE pelayan_services SET date=$1, label=$2, is_extra=$3
		 WHERE id=$4 RETURNING id, to_char(date, 'YYYY-MM-DD'), label, is_extra`,
		in.Date, in.Label, isExtra, id,
	).Scan(&svc.ID, &svc.Date, &svc.Label, &svc.IsExtra)
	if errors.Is(err, sql.ErrNoRows) {
		return nil, nil
	}
	return svc, err
}

func (s *PelayanStore) DeleteService(ctx context.Context, id string) error {
	_, err := s.db.ExecContext(ctx, `DELETE FROM pelayan_services WHERE id=$1`, id)
	return err
}

// ─── Assignments ─────────────────────────────────────────────────────────────

func (s *PelayanStore) ListAssignments(ctx context.Context, serviceID string) ([]model.PelayanAssignment, error) {
	rows, err := s.db.QueryContext(ctx,
		`SELECT id, service_id, role_id, pelayan_name FROM pelayan_assignments WHERE service_id=$1`,
		serviceID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var assignments []model.PelayanAssignment
	for rows.Next() {
		var a model.PelayanAssignment
		if err := rows.Scan(&a.ID, &a.ServiceID, &a.RoleID, &a.PelayanName); err != nil {
			return nil, err
		}
		assignments = append(assignments, a)
	}
	if assignments == nil {
		assignments = []model.PelayanAssignment{}
	}
	return assignments, rows.Err()
}

func (s *PelayanStore) UpsertAssignment(ctx context.Context, in model.PelayanAssignmentInput) (*model.PelayanAssignment, error) {
	a := &model.PelayanAssignment{}
	return a, s.db.QueryRowContext(ctx,
		`INSERT INTO pelayan_assignments (service_id, role_id, pelayan_name)
		 VALUES ($1, $2, $3)
		 ON CONFLICT (service_id, role_id) DO UPDATE SET pelayan_name = EXCLUDED.pelayan_name
		 RETURNING id, service_id, role_id, pelayan_name`,
		in.ServiceID, in.RoleID, in.PelayanName,
	).Scan(&a.ID, &a.ServiceID, &a.RoleID, &a.PelayanName)
}

func (s *PelayanStore) DeleteAssignment(ctx context.Context, id string) error {
	_, err := s.db.ExecContext(ctx, `DELETE FROM pelayan_assignments WHERE id=$1`, id)
	return err
}
