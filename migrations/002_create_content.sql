CREATE TABLE IF NOT EXISTS content (
    id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title              TEXT NOT NULL,
    slug               TEXT NOT NULL UNIQUE,
    type               TEXT NOT NULL,
    status             TEXT NOT NULL DEFAULT 'draft',
    body               TEXT NOT NULL DEFAULT '',
    author_id          UUID NOT NULL REFERENCES users(id),
    featured_image_url TEXT,
    published_at       TIMESTAMPTZ,
    created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS content_status_idx ON content(status);
CREATE INDEX IF NOT EXISTS content_type_idx   ON content(type);
CREATE INDEX IF NOT EXISTS content_slug_idx   ON content(slug);
