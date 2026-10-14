-- ============================================================================
--  PatronAI · migracja 002 — tabela allocations (publiczny rejestr + trust layer)
--  Plik: migrations/002_create_allocations.sql
--  Wymaga: 001   ·   Rollback: DROP TABLE (utrata rejestru alokacji!)
-- ============================================================================

-- +migrate Up ---------------------------------------------------------------
BEGIN;

CREATE SEQUENCE IF NOT EXISTS allocations_ledger_entry_no_seq
  AS integer START WITH 1001;

CREATE TABLE IF NOT EXISTS allocations (
  id                      uuid          PRIMARY KEY DEFAULT gen_random_uuid(),

  ledger_entry_no         integer       NOT NULL DEFAULT nextval('allocations_ledger_entry_no_seq'),
  public_ref              text          NOT NULL,
  status                  text          NOT NULL DEFAULT 'pending',
  contribution_type       text          NOT NULL DEFAULT 'financial',

  patron_display_name     text          NOT NULL DEFAULT 'Patron anonimowy',
  patron_type             text          NOT NULL DEFAULT 'anonymous',
  patron_email            text,
  patron_url              text,
  patron_domain           text,
  business_category       text,

  need_code               text          NOT NULL,
  need_title_pl           text          NOT NULL,
  need_title_en           text          NOT NULL,
  need_category           text,
  need_quantity           integer       NOT NULL DEFAULT 1,

  amount_gross            numeric(12,2) NOT NULL,
  currency                char(3)       NOT NULL DEFAULT 'PLN',
  amount_pln_equivalent   numeric(12,2),
  fx_rate                 numeric(12,6),

  ave_market_value        numeric(12,2),
  barter_tier             text,
  barter_item             text,

  beneficiaries_count     integer,
  training_hours_funded   numeric(8,2),
  competition_access_pct  numeric(5,2),
  sdg_tags                text[]        NOT NULL DEFAULT '{}',

  integrity_hash          char(64),
  hash_algo               text          NOT NULL DEFAULT 'sha256',
  hashed_at               timestamptz,
  certificate_issued_at   timestamptz,
  qr_payload              text,

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
  'Publiczny rejestr alokacji: patron, migawka potrzeby z lib/needsCatalog.ts, kwota/waluta, AVE + tier barterowy, hash SHA-256, status audytu.';
COMMENT ON COLUMN allocations.data_source IS
  'live = dane rzeczywiste; hypothetical_demo_dataset = w 100% hipotetyczny zbiór demonstracyjny.';

INSERT INTO schema_migrations (version, name)
VALUES ('002', 'create_allocations')
ON CONFLICT (version) DO NOTHING;

COMMIT;

-- +migrate Down -------------------------------------------------------------
BEGIN;

DROP TABLE IF EXISTS allocations;
DROP SEQUENCE IF EXISTS allocations_ledger_entry_no_seq;
DELETE FROM schema_migrations WHERE version = '002';

COMMIT;
