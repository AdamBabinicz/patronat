-- ============================================================================
--  PatronAI · migracja 003 — tabela audit_reports (AI Vision Expense Audit)
--  Plik: migrations/003_create_audit_reports.sql
--  Wymaga: 002   ·   Rollback: DROP TABLE
-- ============================================================================

-- +migrate Up ---------------------------------------------------------------
BEGIN;

CREATE TABLE IF NOT EXISTS audit_reports (
  id                  uuid          PRIMARY KEY DEFAULT gen_random_uuid(),
  allocation_id       uuid          NOT NULL REFERENCES allocations(id) ON DELETE CASCADE,
  report_ref          text          NOT NULL,

  engine              text          NOT NULL DEFAULT 'gemini-multimodal-vision',
  engine_model        text,
  source_kind         text          NOT NULL DEFAULT 'upload',
  mime_type           text,
  image_sha256        char(64),

  merchant_name       text,
  merchant_nip        text,
  invoice_number      text,
  invoice_date        date,
  line_items          jsonb         NOT NULL DEFAULT '[]'::jsonb,
  net_total           numeric(12,2),
  vat_total           numeric(12,2),
  gross_total         numeric(12,2),
  document_currency   char(3)       NOT NULL DEFAULT 'PLN',

  allocation_goal     text,
  semantic_match      boolean,
  match_confidence    numeric(4,3),
  mismatch_reason     text,
  flag_status         text          NOT NULL DEFAULT 'pending',

  raw_extraction      jsonb         NOT NULL DEFAULT '{}'::jsonb,
  audit_hash          char(64),
  audited_at          timestamptz,

  created_at          timestamptz   NOT NULL DEFAULT now(),
  updated_at          timestamptz   NOT NULL DEFAULT now(),

  CONSTRAINT audit_reports_report_ref_key UNIQUE (report_ref),
  CONSTRAINT audit_reports_engine_chk     CHECK (engine = 'gemini-multimodal-vision'),
  CONSTRAINT audit_reports_source_chk     CHECK (source_kind IN ('upload','camera','seed')),
  CONSTRAINT audit_reports_flag_chk       CHECK (flag_status IN ('pending','match','mismatch')),
  CONSTRAINT audit_reports_nip_chk        CHECK (merchant_nip IS NULL OR merchant_nip ~ '^[0-9]{10}$'),
  CONSTRAINT audit_reports_currency_chk   CHECK (document_currency IN ('PLN','EUR','USD')),
  CONSTRAINT audit_reports_confidence_chk CHECK (match_confidence IS NULL
    OR (match_confidence >= 0 AND match_confidence <= 1)),
  CONSTRAINT audit_reports_line_items_chk CHECK (jsonb_typeof(line_items) = 'array'),
  CONSTRAINT audit_reports_raw_chk        CHECK (jsonb_typeof(raw_extraction) = 'object'),
  CONSTRAINT audit_reports_audit_hash_chk CHECK (audit_hash IS NULL OR audit_hash ~ '^[0-9a-f]{64}$')
);

COMMENT ON TABLE audit_reports IS
  'Wynik audytu AI Vision (OCR + weryfikacja semantyczna wobec celu alokacji). Rozbieżność ustawia flag_status = mismatch, nigdy cichej akceptacji.';

INSERT INTO schema_migrations (version, name)
VALUES ('003', 'create_audit_reports')
ON CONFLICT (version) DO NOTHING;

COMMIT;

-- +migrate Down -------------------------------------------------------------
BEGIN;

DROP TABLE IF EXISTS audit_reports;
DELETE FROM schema_migrations WHERE version = '003';

COMMIT;
