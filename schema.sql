-- ============================================================================
--  PatronAI — Neon Serverless PostgreSQL
--  File: schema.sql  ·  Full, IDEMPOTENT baseline DDL
--  Executed by: lib/db.ts (@neondatabase/serverless, pooled DATABASE_URL)
--  Note: This DDL is executed automatically ("auto-migrating DDL")
--        on the first request to /api/ledger, /api/certificate/[id],
--        and /api/paypal/capture-order.
--  Versioned migrations: migrations/ directory (001 … 006).
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 0. Schema Migrations Log
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS schema_migrations (
  version      text        PRIMARY KEY,
  name         text        NOT NULL,
  checksum     text,
  applied_at   timestamptz NOT NULL DEFAULT now(),
  execution_ms integer
);

COMMENT ON TABLE schema_migrations IS
  'Registry of executed migrations (001…006). Utilized by database runners in lib/db.ts and CLI scripts.';

-- ---------------------------------------------------------------------------
-- 1. Public Ledger Entry Sequence (STEP 03 · Public Ledger)
-- ---------------------------------------------------------------------------
CREATE SEQUENCE IF NOT EXISTS allocations_ledger_entry_no_seq
  AS integer START WITH 1001;

-- ---------------------------------------------------------------------------
-- 2. allocations — Public Ledger Entries (Trust & Persistence Layer)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS allocations (
  id                      uuid          PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Public identification
  ledger_entry_no         integer       NOT NULL DEFAULT nextval('allocations_ledger_entry_no_seq'),
  public_ref              text          NOT NULL,          -- route slug for /certyfikat/[id]
  status                  text          NOT NULL DEFAULT 'pending',

  -- Contribution type: financial (PayPal) or in-kind/barter (AI Barter Valuator)
  contribution_type       text          NOT NULL DEFAULT 'financial',

  -- Patron details (Corporate / Individual / Anonymous)
  patron_display_name     text          NOT NULL DEFAULT 'Patron anonimowy',
  patron_type             text          NOT NULL DEFAULT 'anonymous',
  patron_email            text,
  patron_url              text,                            -- Company website parsed by PatronAgent
  patron_domain           text,
  business_category       text,                            -- Industry categorization (Gemini NLP)

  -- Snapshot of club need (Source: lib/needsCatalog.ts — catalog in code, state in DB)
  need_code               text          NOT NULL,
  need_title_pl           text          NOT NULL,
  need_title_en           text          NOT NULL,
  need_category           text,
  need_quantity           integer       NOT NULL DEFAULT 1,

  -- Gross amount and multi-currency engine (PLN / EUR / USD)
  amount_gross            numeric(12,2) NOT NULL,
  currency                char(3)       NOT NULL DEFAULT 'PLN',
  amount_pln_equivalent   numeric(12,2),
  fx_rate                 numeric(12,6),

  -- In-kind contribution / Barter (Advertising Value Equivalency - AVE & tier)
  ave_market_value        numeric(12,2),
  barter_tier             text,
  barter_item             text,

  -- Social ROI Predictor
  beneficiaries_count     integer,
  training_hours_funded   numeric(8,2),
  competition_access_pct  numeric(5,2),
  sdg_tags                text[]        NOT NULL DEFAULT '{}',

  -- Trust layer: SHA-256 seal & verification
  integrity_hash          char(64),
  hash_algo               text          NOT NULL DEFAULT 'sha256',
  hashed_at               timestamptz,
  certificate_issued_at   timestamptz,
  qr_payload              text,

  -- i18n & data lineage
  locale                  text          NOT NULL DEFAULT 'pl',
  data_source             text          NOT NULL DEFAULT 'live',
  is_demo_data            boolean       NOT NULL DEFAULT false,
  invoice_reference       text,
  paid_at                 timestamptz,

  created_at              timestamptz   NOT NULL DEFAULT now(),
  updated_at              timestamptz   NOT NULL DEFAULT now(),

  CONSTRAINT allocations_ledger_entry_no_key UNIQUE (ledger_entry_no),
  CONSTRAINT allocations_public_ref_key       UNIQUE (public_ref),
  CONSTRAINT allocations_status_chk
    CHECK (status IN ('pending','verified','flagged','rejected','refunded')),
  CONSTRAINT allocations_contribution_type_chk
    CHECK (contribution_type IN ('financial','in_kind')),
  CONSTRAINT allocations_patron_type_chk
    CHECK (patron_type IN ('individual','company','anonymous')),
  CONSTRAINT allocations_need_category_chk
    CHECK (need_category IS NULL OR need_category IN ('equipment','transport','tournament','coaching')),
  CONSTRAINT allocations_amount_chk      CHECK (amount_gross > 0),
  CONSTRAINT allocations_currency_chk    CHECK (currency IN ('PLN','EUR','USD')),
  CONSTRAINT allocations_need_qty_chk    CHECK (need_quantity > 0),
  CONSTRAINT allocations_barter_tier_chk CHECK (barter_tier IS NULL OR barter_tier IN ('gold','silver','bronze')),
  CONSTRAINT allocations_benef_chk       CHECK (beneficiaries_count IS NULL OR beneficiaries_count >= 0),
  CONSTRAINT allocations_access_pct_chk  CHECK (competition_access_pct IS NULL
    OR (competition_access_pct >= 0 AND competition_access_pct <= 100)),
  CONSTRAINT allocations_hash_chk        CHECK (integrity_hash IS NULL OR integrity_hash ~ '^[0-9a-f]{64}$'),
  CONSTRAINT allocations_hash_algo_chk   CHECK (hash_algo = 'sha256'),
  CONSTRAINT allocations_locale_chk      CHECK (locale IN ('pl','en')),
  CONSTRAINT allocations_data_source_chk CHECK (data_source IN ('live','hypothetical_demo_dataset')),
  CONSTRAINT allocations_in_kind_chk     CHECK (
    contribution_type = 'financial'
    OR (contribution_type = 'in_kind' AND ave_market_value IS NOT NULL AND barter_tier IS NOT NULL)
  )
);

COMMENT ON TABLE allocations IS
  'Public ledger of allocations: patron, club need snapshot, amounts/currencies, barter AVE, SHA-256 seal, and audit state.';
COMMENT ON COLUMN allocations.integrity_hash IS
  'SHA-256 hash sealing ledger entries — serves as base for tamper-evident verification on /certyfikat/[id].';
COMMENT ON COLUMN allocations.data_source IS
  'live = real production data; hypothetical_demo_dataset = 100% hypothetical demonstration dataset (0.00 PLN live funds).';

-- ---------------------------------------------------------------------------
-- 3. audit_reports — AI Vision Expense Audit (Gemini Multimodal Vision OCR)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS audit_reports (
  id                  uuid          PRIMARY KEY DEFAULT gen_random_uuid(),
  allocation_id       uuid          NOT NULL REFERENCES allocations(id) ON DELETE CASCADE,
  report_ref          text          NOT NULL,

  engine              text          NOT NULL DEFAULT 'gemini-multimodal-vision',
  engine_model        text,                                -- Populated at runtime from Gemini config
  source_kind         text          NOT NULL DEFAULT 'upload',
  mime_type           text,
  image_sha256        char(64),

  -- Structured OCR data extracted from invoice / receipt
  merchant_name       text,
  merchant_nip        text,
  invoice_number      text,
  invoice_date        date,
  line_items          jsonb         NOT NULL DEFAULT '[]'::jsonb,
  net_total           numeric(12,2),
  vat_total           numeric(12,2),
  gross_total         numeric(12,2),
  document_currency   char(3)       NOT NULL DEFAULT 'PLN',

  -- Semantic reconciliation: allocation objective vs. actual expense
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
  'AI Vision audit results: Tax ID, invoice line items, amounts, and semantic reconciliation against allocation objective (mismatches are flagged, never silently approved).';
COMMENT ON COLUMN audit_reports.line_items IS
  'Extracted line items in structured JSON array: [{ "name", "qty", "unit_price", "gross" }, …].';

-- ---------------------------------------------------------------------------
-- 4. payment_orders — Persistent PayPal Captures (capture-order)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS payment_orders (
  id                  uuid          PRIMARY KEY DEFAULT gen_random_uuid(),
  allocation_id       uuid          REFERENCES allocations(id) ON DELETE SET NULL,

  paypal_order_id     text          NOT NULL,
  paypal_capture_id   text,
  paypal_payer_id     text,

  mode                text          NOT NULL DEFAULT 'sandbox',
  status              text          NOT NULL DEFAULT 'created',
  contribution_type   text          NOT NULL DEFAULT 'financial',
  amount              numeric(12,2) NOT NULL,
  currency            char(3)       NOT NULL DEFAULT 'PLN',
  simulated           boolean       NOT NULL DEFAULT true,

  request_payload     jsonb         NOT NULL DEFAULT '{}'::jsonb,
  capture_response    jsonb         NOT NULL DEFAULT '{}'::jsonb,
  error_message       text,

  created_at          timestamptz   NOT NULL DEFAULT now(),
  captured_at         timestamptz,
  updated_at          timestamptz   NOT NULL DEFAULT now(),

  CONSTRAINT payment_orders_order_id_key   UNIQUE (paypal_order_id),
  CONSTRAINT payment_orders_capture_id_key UNIQUE (paypal_capture_id),
  CONSTRAINT payment_orders_mode_chk       CHECK (mode IN ('sandbox','simulation','live')),
  CONSTRAINT payment_orders_status_chk
    CHECK (status IN ('created','approved','captured','completed','failed','refunded')),
  CONSTRAINT payment_orders_contrib_chk    CHECK (contribution_type IN ('financial','in_kind')),
  CONSTRAINT payment_orders_amount_chk     CHECK (amount > 0),
  CONSTRAINT payment_orders_currency_chk   CHECK (currency IN ('PLN','EUR','USD')),
  CONSTRAINT payment_orders_payload_chk    CHECK (jsonb_typeof(request_payload) = 'object'
    AND jsonb_typeof(capture_response) = 'object')
);

COMMENT ON TABLE payment_orders IS
  'Persistent PayPal checkout records. The prototype functions exclusively in sandbox/developer simulation mode (no live club merchant account).';

-- ---------------------------------------------------------------------------
-- 5. Indexes
-- ---------------------------------------------------------------------------
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

-- ---------------------------------------------------------------------------
-- 6. updated_at Trigger Function
-- ---------------------------------------------------------------------------
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

-- ---------------------------------------------------------------------------
-- 7. Views (Read-only interfaces for API Route Handlers & /certyfikat/[id])
-- ---------------------------------------------------------------------------
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

COMMENT ON VIEW v_public_ledger IS 'Public Ledger view (STEP 03) — allocation record joined with latest AI Vision expense audit.';

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

COMMENT ON VIEW v_certificate_verification IS
  'Data source for /api/certificate/[id] — real-time verification of certificate authenticity (SHA-256 seal + audit status).';

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

COMMENT ON VIEW v_ledger_totals IS
  'Aggregated ledger metrics grouped by currency and data lineage (130 records / 19,945.00 PLN demo baseline).';

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

COMMENT ON VIEW v_audit_flag_queue IS
  'Discrepancy audit queue — flagged records held for human-in-the-loop review (semantic reconciliation never silently approves mismatches).';

-- ============================================================================
-- End of baseline DDL. Demo dataset seeding: migrations/006_seed_demo_dataset.sql
-- (130 allocations / 19,945.00 PLN, data_source = 'hypothetical_demo_dataset').
-- ============================================================================