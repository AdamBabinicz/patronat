// lib/db.ts
// Moduł połączenia z serverless bazą Neon PostgreSQL oraz definicja schematu danych PatronAI.

import { neon, neonConfig } from "@neondatabase/serverless";

// Bezpieczne sprawdzanie obecności connection stringa
const databaseUrl = process.env.DATABASE_URL || "";

if (!databaseUrl && process.env.NODE_ENV === "production") {
  console.warn(
    "OSTRZEŻENIE: Brak zmiennej DATABASE_URL w środowisku produkcyjnym.",
  );
}

// Inicjalizacja klienta Neon Serverless SQL
export const sql = neon(databaseUrl);

// Interfejs reprezentujący alokację w bazie danych
export interface DbAllocation {
  id: string; // np. ROSZADA-2026-880 lub ORD-...
  patron_name: string;
  goal: string;
  amount: number;
  currency: string;
  status: string; // COMPLETED | PENDING | VERIFIED | ARCHIVED
  is_anonymous: boolean;
  donor_note?: string | null;
  club_name: string;
  sha256_hash?: string | null;
  created_at: string;
}

// Interfejs reprezentujący raport z audytu faktury przez AI OCR
export interface DbAuditReport {
  id?: number;
  allocation_id: string;
  invoice_number: string;
  seller_name: string;
  seller_nip?: string | null;
  issue_date: string;
  total_gross: number;
  currency: string;
  sha256_hash: string;
  confidence_score: number;
  verified_by_ai: boolean;
  raw_details_json?: any;
  created_at?: string;
}

// Interfejs reprezentujący agregaty z widoku v_ledger_totals
export interface DbLedgerTotals {
  currency: string;
  allocations_count: number;
  total_gross: number;
  total_pln_equivalent: number;
  first_entry_at: string;
  last_entry_at: string;
}

// Flaga zapobiegająca wielokrotnej weryfikacji schematu w tej samej instancji lambdy
let schemaInitialized = false;

/**
 * Automatyczna inicjalizacja tabel i widoków w bazie Neon PostgreSQL (DDL)
 * Tworzy tabele alokacji, audytów oraz widoki analityczne, jeśli jeszcze nie istnieją.
 */
export async function ensureDatabaseSchema(): Promise<void> {
  if (schemaInitialized || !databaseUrl) {
    return;
  }

  try {
    // 1. Tabela alokacji mecenasów (Public Ledger)
    await sql`
      CREATE TABLE IF NOT EXISTS allocations (
        id VARCHAR(64) PRIMARY KEY,
        patron_name VARCHAR(255) NOT NULL,
        goal TEXT NOT NULL,
        amount NUMERIC(10, 2) NOT NULL,
        currency VARCHAR(10) NOT NULL DEFAULT 'PLN',
        status VARCHAR(32) NOT NULL DEFAULT 'COMPLETED',
        is_anonymous BOOLEAN DEFAULT FALSE,
        donor_note TEXT,
        club_name VARCHAR(255) NOT NULL DEFAULT 'UKS Roszada Radom',
        sha256_hash VARCHAR(128),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `;

    // 2. Indeksy dla szybkiego sortowania, wyszukiwania i grupowania mecenasów
    await sql`
      CREATE INDEX IF NOT EXISTS idx_allocations_created_at ON allocations (created_at DESC);
    `;
    await sql`
      CREATE INDEX IF NOT EXISTS idx_allocations_status ON allocations (status);
    `;
    await sql`
      CREATE INDEX IF NOT EXISTS idx_allocations_patron_name ON allocations (patron_name);
    `;

    // 3. Tabela audytów faktur OCR (Gemini Vision)
    await sql`
      CREATE TABLE IF NOT EXISTS audit_reports (
        id SERIAL PRIMARY KEY,
        allocation_id VARCHAR(64) NOT NULL REFERENCES allocations(id) ON DELETE CASCADE,
        invoice_number VARCHAR(128) NOT NULL,
        seller_name VARCHAR(255) NOT NULL,
        seller_nip VARCHAR(32),
        issue_date VARCHAR(64) NOT NULL,
        total_gross NUMERIC(10, 2) NOT NULL,
        currency VARCHAR(10) NOT NULL DEFAULT 'PLN',
        sha256_hash VARCHAR(128) NOT NULL,
        confidence_score NUMERIC(5, 2) NOT NULL DEFAULT 98.5,
        verified_by_ai BOOLEAN NOT NULL DEFAULT TRUE,
        raw_details_json JSONB,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `;

    // 4. Widok analityczny sum i metryk rejestru (Single Source of Truth)
    await sql`
      CREATE OR REPLACE VIEW v_ledger_totals AS
      SELECT
        currency,
        COUNT(*)::integer                               AS allocations_count,
        SUM(amount)                                     AS total_gross,
        SUM(amount)                                     AS total_pln_equivalent,
        MIN(created_at)                                 AS first_entry_at,
        MAX(created_at)                                 AS last_entry_at
      FROM allocations
      GROUP BY currency;
    `;

    schemaInitialized = true;
  } catch (error) {
    console.error(
      "Błąd podczas inicjalizacji schematu bazy danych Neon:",
      error,
    );
    throw error;
  }
}
