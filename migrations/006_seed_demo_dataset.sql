-- ============================================================================
--  PatronAI · migracja 006 — seed hipotetycznego zbioru demonstracyjnego
--  Plik: migrations/006_seed_demo_dataset.sql
--  Wymaga: 002–005
--
--  ⚠️  ZASTRZEŻENIE: 100% hipotetyczny zbiór demonstracyjny.
--     130 alokacji · 19 945,00 PLN (suma księgowana w PLN). Dane generowane
--     z potrzeb klubu (lib/needsCatalog.ts) wyłącznie po to, by pokazać
--     przepływ: dopasowanie → płatność → audyt AI Vision → certyfikat.
--     Realne środki zebrane: 0,00 PLN. Brak produkcyjnego konta PayPal.
--
--  Charakterystyka zbioru (deterministyczny, idempotentny):
--    • 127 wpisów finansowych:  91 × 141,00 PLN + 36 × 139,00 PLN = 17 835,00 PLN
--    •   3 wpisy barterowe:   1180,00 (gold) + 620,00 (silver) + 310,00 (bronze)
--      = 2 110,00 PLN
--    • RAZEM: 19 945,00 PLN — dokładnie wartość prezentowana w README
--    • 4 wpisy z rozbieżnością audytu (flag_status = mismatch)
--    • kursy demonstracyjne: PLN 1,00 · EUR 4,30 · USD 4,00
--      (amount_pln_equivalent = wartość księgowana w PLN — podstawa sumy rejestru)
-- ============================================================================

-- +migrate Up ---------------------------------------------------------------
BEGIN;

-- --- 1. 130 wpisów rejestru (deterministycznie, suma = 19 945,00 PLN) -------
WITH needs(idx, code, title_pl, title_en, category) AS (
  VALUES
    (1, 'NEED-001', 'Zegary szachowe DGT 2010',        'DGT 2010 chess clocks',         'equipment'),
    (2, 'NEED-002', 'Opłaty startowe turniejów',       'Tournament entry fees',         'tournament'),
    (3, 'NEED-003', 'Transport na mistrzostwa',        'Championship bus transit',      'transport'),
    (4, 'NEED-004', 'Figury i szachownice turniejowe', 'Tournament pieces & boards',    'equipment'),
    (5, 'NEED-005', 'Wynajem sali treningowej',        'Training hall rental',          'coaching'),
    (6, 'NEED-006', 'Dyplomy, puchary i medale',       'Trophies, medals & diplomas',   'tournament'),
    (7, 'NEED-007', 'Materiały szkoleniowe i druk',    'Training materials & printing', 'coaching'),
    (8, 'NEED-008', 'Zegary szachowe DGT 2010',        'DGT 2010 chess clocks',         'equipment')
),
patrons(idx, name, ptype, domain, category) AS (
  VALUES
    (1, 'Drukarnia Virgo sp. z o.o.',   'company',    'drukarnia-virgo.pl',  'Druk i poligrafia'),
    (2, 'Zakłady Mięsne Radom SA',      'company',    'zm-radom.pl',         'Przemysł spożywczy'),
    (3, 'Transport Kamil Wójcik',       'company',    'transport-wojcik.pl', 'Transport i logistyka'),
    (4, 'Radomska Grupa IT sp. z o.o.', 'company',    'rgit.pl',             'IT i oprogramowanie'),
    (5, 'Piekarnia Złoty Kłos',         'company',    'zlotyklos-radom.pl',  'Pieczywo i gastronomia'),
    (6, 'Jan Kowalski',                 'individual', NULL,                  NULL),
    (7, 'Patron anonimowy',             'anonymous',  NULL,                  NULL)
),
base AS (
  SELECT
    g.i,
    CASE WHEN g.i IN (37, 74, 111) THEN 'in_kind' ELSE 'financial' END   AS contribution_type,
    CASE WHEN g.i IN (37, 74, 111) THEN 'PLN'
         WHEN g.i % 3 = 0          THEN 'EUR'
         WHEN g.i % 5 = 0          THEN 'USD'
         ELSE 'PLN' END                                                   AS currency,
    CASE WHEN g.i IN (37, 74, 111) THEN 'pending'
         WHEN g.i % 29 = 0         THEN 'flagged'
         ELSE 'verified' END                                              AS status,
    CASE
      WHEN g.i = 37  THEN 1180.00
      WHEN g.i = 74  THEN 620.00
      WHEN g.i = 111 THEN 310.00
      WHEN (((g.i - (g.i / 37) - 1) * 37) % 127) < 91 THEN 141.00
      ELSE 139.00
    END::numeric(12,2)                                                    AS pln_amount,
    CASE
      WHEN g.i IN (37, 74, 111) THEN 1.000000
      WHEN g.i % 3 = 0          THEN 4.300000
      WHEN g.i % 5 = 0          THEN 4.000000
      ELSE 1.000000
    END::numeric(12,6)                                                    AS fx_rate,
    ((g.i - 1) % 8) + 1                                                   AS need_idx,
    ((g.i - 1) % 7) + 1                                                   AS patron_idx,
    CASE WHEN g.i % 7 = 0 THEN 3 WHEN g.i % 5 = 0 THEN 2 ELSE 1 END       AS qty
  FROM generate_series(1, 130) AS g(i)
)
INSERT INTO allocations (
  ledger_entry_no, public_ref, status, contribution_type,
  patron_display_name, patron_type, patron_email, patron_url, patron_domain, business_category,
  need_code, need_title_pl, need_title_en, need_category, need_quantity,
  amount_gross, currency, amount_pln_equivalent, fx_rate,
  ave_market_value, barter_tier, barter_item,
  beneficiaries_count, training_hours_funded, competition_access_pct, sdg_tags,
  integrity_hash, hash_algo, hashed_at, certificate_issued_at, qr_payload,
  locale, data_source, is_demo_data, invoice_reference, paid_at,
  created_at, updated_at
)
SELECT
  1000 + b.i                                                               AS ledger_entry_no,
  'PA-2026-' || lpad(b.i::text, 4, '0')                                    AS public_ref,
  b.status,
  b.contribution_type,
  p.name,
  p.ptype,
  CASE WHEN p.ptype = 'anonymous' THEN NULL
       ELSE 'patron' || b.i::text || '@example.org' END                    AS patron_email,
  CASE WHEN p.domain IS NULL THEN NULL ELSE 'https://' || p.domain END     AS patron_url,
  p.domain,
  p.category,
  n.code,
  n.title_pl,
  n.title_en,
  n.category,
  b.qty,
  round((b.pln_amount / b.fx_rate)::numeric, 2)                            AS amount_gross,
  b.currency,
  b.pln_amount                                                             AS amount_pln_equivalent,
  b.fx_rate,
  CASE WHEN b.contribution_type = 'in_kind' THEN b.pln_amount END          AS ave_market_value,
  CASE WHEN b.contribution_type = 'in_kind'
       THEN CASE WHEN b.pln_amount >= 1000 THEN 'gold'
                 WHEN b.pln_amount >= 500  THEN 'silver'
                 ELSE 'bronze' END END                                     AS barter_tier,
  CASE WHEN b.contribution_type = 'in_kind' THEN n.title_pl END            AS barter_item,
  (b.qty * 8) + (b.i % 12)                                                 AS beneficiaries_count,
  round(((b.qty * 4) + (b.i % 7))::numeric, 2)                             AS training_hours_funded,
  round(LEAST(100, 40 + (b.i % 60))::numeric, 2)                           AS competition_access_pct,
  ARRAY['SDG-3', 'SDG-4']::text[]                                          AS sdg_tags,
  encode(sha256(('patronai-demo|' || (1000 + b.i)::text || '|' ||
                 b.pln_amount::text)::bytea), 'hex')::char(64)             AS integrity_hash,
  'sha256',
  now() - ((131 - b.i) || ' days')::interval,
  now() - ((131 - b.i) || ' days')::interval,
  'https://patronat.vercel.app/certyfikat/PA-2026-' || lpad(b.i::text, 4, '0'),
  CASE WHEN b.i % 4 = 0 THEN 'en' ELSE 'pl' END,
  'hypothetical_demo_dataset',
  true,
  'DEMO/' || to_char(now() - ((131 - b.i) || ' days')::interval, 'YYYY/MM') || '/' || lpad(b.i::text, 4, '0'),
  now() - ((131 - b.i) || ' days')::interval,
  now() - ((131 - b.i) || ' days')::interval,
  now() - ((131 - b.i) || ' days')::interval
FROM base b
JOIN needs   n ON n.idx = b.need_idx
JOIN patrons p ON p.idx = b.patron_idx
ON CONFLICT (public_ref) DO NOTHING;

-- --- 2. Raporty audytu AI Vision (po jednym na wpis) ----------------------
WITH ranked AS (
  SELECT
    a.id, a.public_ref, a.need_title_pl, a.need_category, a.amount_gross, a.currency,
    a.status, a.need_quantity, a.contribution_type, a.paid_at,
    row_number() OVER (ORDER BY a.ledger_entry_no) AS rn
  FROM allocations a
  WHERE a.data_source = 'hypothetical_demo_dataset'
)
INSERT INTO audit_reports (
  allocation_id, report_ref, engine, engine_model, source_kind, mime_type, image_sha256,
  merchant_name, merchant_nip, invoice_number, invoice_date,
  line_items, net_total, vat_total, gross_total, document_currency,
  allocation_goal, semantic_match, match_confidence, mismatch_reason, flag_status,
  raw_extraction, audit_hash, audited_at, created_at, updated_at
)
SELECT
  r.id,
  'AUD-' || r.public_ref,
  'gemini-multimodal-vision',
  NULL,
  CASE WHEN r.rn % 3 = 0 THEN 'camera' WHEN r.rn % 11 = 0 THEN 'seed' ELSE 'upload' END,
  'image/jpeg',
  encode(sha256(('audit-image|' || r.public_ref)::bytea), 'hex')::char(64),
  CASE WHEN r.rn % 4 = 0 THEN 'Drukarnia Virgo sp. z o.o.'
       ELSE 'Szach-Mat Sprzęt Sportowy sp. z o.o.' END,
  lpad(((r.rn * 7919) % 10000000000)::text, 10, '0'),
  'FV/DEMO/' || to_char(r.paid_at, 'YYYY') || '/' || lpad(r.rn::text, 5, '0'),
  r.paid_at::date,
  jsonb_build_array(
    jsonb_build_object(
      'name', r.need_title_pl,
      'qty', r.need_quantity,
      'unit_price', round((round((r.amount_gross * 0.85)::numeric, 2) / r.need_quantity)::numeric, 2),
      'gross', round((r.amount_gross * 0.85)::numeric, 2)
    ),
    jsonb_build_object(
      'name', 'Akcesoria turniejowe (demonstracja)',
      'qty', 2,
      'unit_price', round(((r.amount_gross - round((r.amount_gross * 0.85)::numeric, 2)) / 2)::numeric, 2),
      'gross', round((r.amount_gross - round((r.amount_gross * 0.85)::numeric, 2))::numeric, 2)
    )
  ),
  round((r.amount_gross / 1.23)::numeric, 2)                               AS net_total,
  round((r.amount_gross - round((r.amount_gross / 1.23)::numeric, 2))::numeric, 2) AS vat_total,
  r.amount_gross,
  r.currency,
  r.need_title_pl,
  r.status <> 'flagged',
  CASE WHEN r.status = 'flagged' THEN 0.421
       ELSE 0.930 + ((r.rn % 7) * 0.01) END,
  CASE WHEN r.status = 'flagged'
       THEN 'Pozycje faktury nie pokrywają się z celem alokacji — dokument wstrzymany do wyjaśnienia.'
       END,
  CASE WHEN r.status = 'flagged' THEN 'mismatch'
       WHEN r.status = 'pending' THEN 'pending'
       ELSE 'match' END,
  jsonb_build_object(
    'ocr_engine', 'gemini-multimodal-vision',
    'document_confidence', 0.94,
    'demo_dataset', true,
    'note', 'Hipotetyczny dokument demonstracyjny — brak realnych faktur.'
  ),
  encode(sha256(('audit-hash|' || r.public_ref)::bytea), 'hex')::char(64),
  r.paid_at + interval '2 hours',
  r.paid_at + interval '2 hours',
  r.paid_at + interval '2 hours'
FROM ranked r
ON CONFLICT (report_ref) DO NOTHING;

-- --- 3. Zamówienia PayPal (tryb sandbox/simulation — bez realnych środków) --
WITH ranked AS (
  SELECT
    a.id, a.public_ref, a.amount_gross, a.currency, a.contribution_type, a.status, a.paid_at,
    row_number() OVER (ORDER BY a.ledger_entry_no) AS rn
  FROM allocations a
  WHERE a.data_source = 'hypothetical_demo_dataset'
    AND a.contribution_type = 'financial'
)
INSERT INTO payment_orders (
  allocation_id, paypal_order_id, paypal_capture_id, paypal_payer_id,
  mode, status, contribution_type, amount, currency, simulated,
  request_payload, capture_response, created_at, captured_at, updated_at
)
SELECT
  r.id,
  'DEMO-ORDER-' || lpad(r.rn::text, 6, '0'),
  'DEMO-CAPTURE-' || lpad(r.rn::text, 6, '0'),
  'DEMO-PAYER-' || lpad(((r.rn * 31) % 9999)::text, 4, '0'),
  'simulation',
  CASE WHEN r.status = 'flagged' THEN 'captured' ELSE 'completed' END,
  'financial',
  r.amount_gross,
  r.currency,
  true,
  jsonb_build_object('public_ref', r.public_ref, 'simulated', true, 'environment', 'sandbox'),
  jsonb_build_object(
    'public_ref', r.public_ref,
    'capture_status', 'COMPLETED',
    'simulated', true,
    'note', 'Symulacja deweloperska — brak produkcyjnego konta UKS Roszada.'
  ),
  r.paid_at,
  r.paid_at,
  r.paid_at
FROM ranked r
ON CONFLICT (paypal_order_id) DO NOTHING;

INSERT INTO schema_migrations (version, name)
VALUES ('006', 'seed_demo_dataset')
ON CONFLICT (version) DO NOTHING;

COMMIT;

-- +migrate Down -------------------------------------------------------------
BEGIN;

DELETE FROM payment_orders WHERE paypal_order_id LIKE 'DEMO-ORDER-%';
DELETE FROM audit_reports  WHERE report_ref      LIKE 'AUD-PA-2026-%';
DELETE FROM allocations    WHERE data_source = 'hypothetical_demo_dataset';
DELETE FROM schema_migrations WHERE version = '006';

COMMIT;
