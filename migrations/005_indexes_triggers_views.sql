-- ============================================================================
--  PatronAI · Migration 005 — Indexes, updated_at Trigger, Views, and Analytics
--  File: migrations/005_indexes_triggers_views.sql
--  Prerequisites: 002, 003, 004
-- ============================================================================

-- +migrate Up ---------------------------------------------------------------
BEGIN;

-- --- Indexes ---------------------------------------------------------------
CREATE INDEX IF NOT EXISTS allocations_status_idx       ON allocations (status);
CREATE INDEX IF NOT EXISTS allocations_created_at_idx   ON allocations (created_at DESC);
CREATE INDEX IF NOT EXISTS allocations_currency_idx     ON allocations (currency);
CREATE INDEX IF NOT EXISTS allocations_need_code_idx    ON allocations (need_code);
CREATE INDEX IF NOT EXISTS allocations_domain_idx       ON allocations (patron_domain);
CREATE INDEX IF NOT EXISTS allocations_sdg_tags_idx     ON allocations USING gin (sdg_tags);
CREATE INDEX IF NOT EXISTS allocations_demo_idx         ON allocations (is_demo_data) WHERE is_demo_data;
CREATE INDEX IF NOT EXISTS allocations_flagged_idx      ON allocations (created_at DESC) WHERE status = 'flagged';

CREATE INDEX IF NOT EXISTS audit_reports_allocation_idx ON audit_reports (allocation_id);
CREATE INDEX IF NOT EXISTS audit_reports_flag_idx       ON audit_reports (flag_status);
CREATE INDEX IF NOT EXISTS audit_reports_line_items_idx ON audit_reports USING gin (line_items jsonb_path_ops);
CREATE INDEX IF NOT EXISTS audit_reports_invoice_idx    ON audit_reports (merchant_nip, invoice_number);

CREATE INDEX IF NOT EXISTS payment_orders_allocation_idx ON payment_orders (allocation_id);
CREATE INDEX IF NOT EXISTS payment_orders_status_idx     ON payment_orders (status);
CREATE INDEX IF NOT EXISTS payment_orders_mode_idx       ON payment_orders (mode);

-- --- updated_at Trigger Function -------------------------------------------
CREATE OR REPLACE FUNCTION patronai_set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS allocations_set_updated_at ON allocations;
CREATE TRIGGER allocations_set_updated_at
  BEFORE UPDATE ON allocations
  FOR EACH ROW EXECUTE FUNCTION patronai_set_updated_at();

DROP TRIGGER IF EXISTS audit_reports_set_updated_at ON audit_reports;
CREATE TRIGGER audit_reports_set_updated_at
  BEFORE UPDATE ON audit_reports
  FOR EACH ROW EXECUTE FUNCTION patronai_set_updated_at();

DROP TRIGGER IF EXISTS payment_orders_set_updated_at ON payment_orders;
CREATE TRIGGER payment_orders_set_updated_at
  BEFORE UPDATE ON payment_orders
  FOR EACH ROW EXECUTE FUNCTION patronai_set_updated_at();

-- --- Analytical & Interface Views -----------------------------------------
CREATE OR REPLACE VIEW v_public_ledger AS
SELECT
  a.ledger_entry_no,
  a.public_ref,
  a.status,
  a.contribution_type,
  a.patron_display_name,
  a.patron_type,
  a.patron_domain,
  a.business_category,
  a.need_code,
  a.need_title_pl,
  a.need_title_en,
  a.need_category,
  a.amount_gross,
  a.currency,
  a.amount_pln_equivalent,
  a.ave_market_value,
  a.barter_tier,
  a.integrity_hash,
  a.locale,
  a.is_demo_data,
  a.paid_at,
  a.created_at,
  COALESCE(ar.flag_status, 'pending')      AS audit_flag_status,
  ar.merchant_name,
  ar.merchant_nip,
  ar.gross_total                           AS audited_gross_total,
  ar.semantic_match,
  ar.audited_at
FROM allocations a
LEFT JOIN LATERAL (
  SELECT r.*
  FROM audit_reports r
  WHERE r.allocation_id = a.id
  ORDER BY r.audited_at DESC NULLS LAST, r.created_at DESC
  LIMIT 1
) ar ON true;

CREATE OR REPLACE VIEW v_certificate_verification AS
SELECT
  a.public_ref,
  a.ledger_entry_no,
  a.status,
  a.integrity_hash,
  a.hash_algo,
  a.hashed_at,
  a.certificate_issued_at,
  a.qr_payload,
  a.patron_display_name,
  a.need_title_pl,
  a.need_title_en,
  a.amount_gross,
  a.currency,
  a.locale,
  a.is_demo_data,
  ar.report_ref,
  ar.flag_status,
  ar.gross_total,
  ar.merchant_nip,
  ar.semantic_match,
  ar.audit_hash,
  ar.audited_at,
  (a.integrity_hash IS NOT NULL)           AS is_hash_sealed,
  (ar.flag_status = 'mismatch')            AS has_flagged_audit
FROM allocations a
LEFT JOIN audit_reports ar ON ar.allocation_id = a.id;

CREATE OR REPLACE VIEW v_ledger_totals AS
SELECT
  currency,
  is_demo_data,
  data_source,
  COUNT(*)::integer                AS allocations_count,
  SUM(amount_gross)                AS total_gross,
  SUM(COALESCE(amount_pln_equivalent, amount_gross)) AS total_pln_equivalent,
  MIN(created_at)                  AS first_entry_at,
  MAX(created_at)                  AS last_entry_at
FROM allocations
GROUP BY currency, is_demo_data, data_source;

CREATE OR REPLACE VIEW v_audit_flag_queue AS
SELECT
  a.ledger_entry_no,
  a.public_ref,
  a.status,
  a.need_title_pl,
  a.amount_gross,
  a.currency,
  ar.report_ref,
  ar.merchant_name,
  ar.merchant_nip,
  ar.gross_total,
  ar.match_confidence,
  ar.mismatch_reason,
  ar.audited_at
FROM audit_reports ar
JOIN allocations a ON a.id = ar.allocation_id
WHERE ar.flag_status = 'mismatch' OR a.status = 'flagged'
ORDER BY ar.audited_at DESC NULLS LAST;

COMMENT ON VIEW v_public_ledger IS 'Public Ledger view (STEP 03) — allocation record combined with latest AI Vision expense audit.';
COMMENT ON VIEW v_certificate_verification IS 'Data source for /api/certificate/[id] — real-time verification of certificate authenticity (SHA-256 seal + audit status).';
COMMENT ON VIEW v_ledger_totals IS 'Aggregated ledger metrics grouped by currency and data lineage.';
COMMENT ON VIEW v_audit_flag_queue IS 'Discrepancy audit queue — records held for human-in-the-loop review (semantic reconciliation never silently approves mismatches).';

INSERT INTO schema_migrations (version, name)
VALUES ('005', 'indexes_triggers_views')
ON CONFLICT (version) DO NOTHING;

COMMIT;

-- +migrate Down -------------------------------------------------------------
BEGIN;

DROP VIEW IF EXISTS v_audit_flag_queue;
DROP VIEW IF EXISTS v_ledger_totals;
DROP VIEW IF EXISTS v_certificate_verification;
DROP VIEW IF EXISTS v_public_ledger;

DROP TRIGGER IF EXISTS payment_orders_set_updated_at ON payment_orders;
DROP TRIGGER IF EXISTS audit_reports_set_updated_at ON audit_reports;
DROP TRIGGER IF EXISTS allocations_set_updated_at ON allocations;
DROP FUNCTION IF EXISTS patronai_set_updated_at();

DROP INDEX IF EXISTS payment_orders_mode_idx;
DROP INDEX IF EXISTS payment_orders_status_idx;
DROP INDEX IF EXISTS payment_orders_allocation_idx;
DROP INDEX IF EXISTS audit_reports_invoice_idx;
DROP INDEX IF EXISTS audit_reports_line_items_idx;
DROP INDEX IF EXISTS audit_reports_flag_idx;
DROP INDEX IF EXISTS audit_reports_allocation_idx;
DROP INDEX IF EXISTS allocations_flagged_idx;
DROP INDEX IF EXISTS allocations_demo_idx;
DROP INDEX IF EXISTS allocations_sdg_tags_idx;
DROP INDEX IF EXISTS allocations_domain_idx;
DROP INDEX IF EXISTS allocations_need_code_idx;
DROP INDEX IF EXISTS allocations_currency_idx;
DROP INDEX IF EXISTS allocations_created_at_idx;
DROP INDEX IF EXISTS allocations_status_idx;

DELETE FROM schema_migrations WHERE version = '005';

COMMIT;