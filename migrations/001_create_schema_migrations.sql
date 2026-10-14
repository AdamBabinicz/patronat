-- ============================================================================
--  PatronAI · Migration 001 — Schema Migrations Registry
--  File: migrations/001_create_schema_migrations.sql
--  Prerequisites: None   ·   Execute within transaction
-- ============================================================================

-- +migrate Up ---------------------------------------------------------------
BEGIN;

CREATE TABLE IF NOT EXISTS schema_migrations (
  version      text        PRIMARY KEY,
  name         text        NOT NULL,
  checksum     text,
  applied_at   timestamptz NOT NULL DEFAULT now(),
  execution_ms integer
);

INSERT INTO schema_migrations (version, name)
VALUES ('001', 'create_schema_migrations')
ON CONFLICT (version) DO NOTHING;

COMMIT;

-- +migrate Down -------------------------------------------------------------
BEGIN;

DROP TABLE IF EXISTS schema_migrations;

COMMIT;