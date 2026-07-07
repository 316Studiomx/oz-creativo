CREATE TABLE IF NOT EXISTS book_reviews (
  id serial PRIMARY KEY,
  author text NOT NULL,
  role text NOT NULL,
  quote text NOT NULL,
  active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS book_reviews_active_sort_idx ON book_reviews (active, sort_order);
CREATE INDEX IF NOT EXISTS book_reviews_created_at_idx ON book_reviews (created_at);

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'netlifydb_readonly') THEN
    EXECUTE 'GRANT SELECT, INSERT, UPDATE, DELETE ON book_reviews TO netlifydb_readonly';
    EXECUTE 'GRANT USAGE, SELECT, UPDATE ON SEQUENCE book_reviews_id_seq TO netlifydb_readonly';
  END IF;
END
$$;
