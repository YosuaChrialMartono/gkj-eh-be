CREATE TABLE IF NOT EXISTS pelayan_roles (
    id      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name    TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS pelayan_persons (
    id   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS pelayan_services (
    id       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    date     DATE NOT NULL UNIQUE,
    label    TEXT,
    is_extra BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE TABLE IF NOT EXISTS pelayan_assignments (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    service_id   UUID NOT NULL REFERENCES pelayan_services(id) ON DELETE CASCADE,
    role_id      UUID NOT NULL REFERENCES pelayan_roles(id)    ON DELETE CASCADE,
    pelayan_name TEXT NOT NULL,
    UNIQUE(service_id, role_id)
);
