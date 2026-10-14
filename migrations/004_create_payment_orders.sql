-- ============================================================================
--  PatronAI · Migration 004 — Payment Orders Table (PayPal capture-order)
--  File: migrations/004_create_payment_orders.sql
--  Prerequisites: 002   ·   Rollback: DROP TABLE
-- ============================================================================

-- +migrate Up ---------------------------------------------------------------
BEGIN;

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
  'Persistent PayPal order records from app/api/paypal/capture-order/route.ts. Prototype operates in sandbox / simulation mode (0.00 PLN real-money transactions).';

INSERT INTO schema_migrations (version, name)
VALUES ('004', 'create_payment_orders')
ON CONFLICT (version) DO NOTHING;

COMMIT;

-- +migrate Down -------------------------------------------------------------
BEGIN;

DROP TABLE IF EXISTS payment_orders;
DELETE FROM schema_migrations WHERE version = '004';

COMMIT;