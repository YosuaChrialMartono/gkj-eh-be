package migrate

import (
	"database/sql"
	"fmt"
	"os"
	"path/filepath"
	"sort"
	"strconv"
	"strings"
)

// Migration holds a single migration file parsed from disk.
type Migration struct {
	Version int
	Name    string
	SQL     string
}

// Run applies all pending migrations from dir to db. Idempotent: already-applied
// migrations are skipped. Migrations run in ascending version order inside individual
// transactions so a failure stops the chain without corrupting applied state.
func Run(db *sql.DB, dir string) error {
	if err := ensureTable(db); err != nil {
		return fmt.Errorf("migrate: ensure table: %w", err)
	}

	pending, err := pendingMigrations(db, dir)
	if err != nil {
		return fmt.Errorf("migrate: list pending: %w", err)
	}

	if len(pending) == 0 {
		fmt.Println("migrate: all migrations already applied")
		return nil
	}

	for _, m := range pending {
		if err := apply(db, m); err != nil {
			return fmt.Errorf("migrate: apply %03d_%s: %w", m.Version, m.Name, err)
		}
		fmt.Printf("migrate: applied %03d_%s\n", m.Version, m.Name)
	}

	fmt.Printf("migrate: %d migration(s) applied\n", len(pending))
	return nil
}

// ensureTable creates the schema_migrations tracking table if it doesn't exist.
func ensureTable(db *sql.DB) error {
	_, err := db.Exec(`
		CREATE TABLE IF NOT EXISTS schema_migrations (
			version    INTEGER PRIMARY KEY,
			name       TEXT NOT NULL,
			applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
		)
	`)
	return err
}

// appliedVersions returns the set of already-applied migration version numbers.
func appliedVersions(db *sql.DB) (map[int]bool, error) {
	rows, err := db.Query(`SELECT version FROM schema_migrations`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	applied := make(map[int]bool)
	for rows.Next() {
		var v int
		if err := rows.Scan(&v); err != nil {
			return nil, err
		}
		applied[v] = true
	}
	return applied, rows.Err()
}

// loadFiles reads all *.sql files from dir and returns sorted Migration slices.
// Filename format: NNN_description.sql  (e.g. 001_create_users.sql)
func loadFiles(dir string) ([]Migration, error) {
	entries, err := os.ReadDir(dir)
	if err != nil {
		return nil, err
	}

	var migrations []Migration
	for _, e := range entries {
		if e.IsDir() || !strings.HasSuffix(e.Name(), ".sql") {
			continue
		}
		m, err := parseFile(filepath.Join(dir, e.Name()), e.Name())
		if err != nil {
			return nil, err
		}
		migrations = append(migrations, m)
	}

	sort.Slice(migrations, func(i, j int) bool {
		return migrations[i].Version < migrations[j].Version
	})
	return migrations, nil
}

// parseFile parses a migration file given its filename (e.g. "001_create_users.sql").
func parseFile(path, filename string) (Migration, error) {
	parts := strings.SplitN(strings.TrimSuffix(filename, ".sql"), "_", 2)
	if len(parts) < 1 {
		return Migration{}, fmt.Errorf("invalid migration filename: %s", filename)
	}
	version, err := strconv.Atoi(parts[0])
	if err != nil {
		return Migration{}, fmt.Errorf("invalid version in filename %s: %w", filename, err)
	}
	name := ""
	if len(parts) == 2 {
		name = parts[1]
	}
	content, err := os.ReadFile(path)
	if err != nil {
		return Migration{}, err
	}
	return Migration{Version: version, Name: name, SQL: string(content)}, nil
}

// pendingMigrations returns migrations from dir that have not yet been applied.
func pendingMigrations(db *sql.DB, dir string) ([]Migration, error) {
	all, err := loadFiles(dir)
	if err != nil {
		return nil, err
	}
	applied, err := appliedVersions(db)
	if err != nil {
		return nil, err
	}
	var pending []Migration
	for _, m := range all {
		if !applied[m.Version] {
			pending = append(pending, m)
		}
	}
	return pending, nil
}

// apply runs a single migration inside a transaction and records it in schema_migrations.
func apply(db *sql.DB, m Migration) error {
	tx, err := db.Begin()
	if err != nil {
		return err
	}
	defer tx.Rollback() //nolint:errcheck

	if _, err := tx.Exec(m.SQL); err != nil {
		return err
	}
	if _, err := tx.Exec(
		`INSERT INTO schema_migrations (version, name) VALUES ($1, $2)`,
		m.Version, m.Name,
	); err != nil {
		return err
	}
	return tx.Commit()
}
