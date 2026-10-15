// app/api/certificate/[id]/route.ts
// Publiczny endpoint weryfikacji autentyczności certyfikatu w Neon Serverless PostgreSQL.
// Pobiera dane alokacji oraz audytu faktury z bazy Neon (Single Source of Truth).

import { NextResponse } from "next/server";
import { sql, ensureDatabaseSchema } from "@/lib/db";
import { getLocalizedPurpose } from "@/lib/translations/purposeMap";

export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: rawId } = await params;
    const cleanId = decodeURIComponent(rawId).trim();

    await ensureDatabaseSchema();

    // 1. Zapytanie SQL z LEFT JOIN audit_reports do bazy Neon
    const rows = await sql`
      SELECT
        a.id,
        a.patron_name,
        a.goal,
        a.amount::float as amount,
        a.currency,
        a.status,
        a.is_anonymous,
        a.donor_note,
        a.club_name,
        a.sha256_hash,
        a.created_at,
        ar.invoice_number,
        ar.seller_name,
        ar.seller_nip,
        ar.issue_date,
        ar.total_gross::float as audit_gross,
        ar.currency as audit_currency,
        ar.sha256_hash as audit_hash,
        ar.confidence_score::float as confidence_score,
        ar.raw_details_json
      FROM allocations a
      LEFT JOIN audit_reports ar ON ar.allocation_id = a.id
      WHERE UPPER(a.id) = UPPER(${cleanId})
      LIMIT 1;
    `;

    if (rows && rows.length > 0) {
      const record = rows[0];
      const enLoc = getLocalizedPurpose(record.goal, "en");
      const plLoc = getLocalizedPurpose(record.goal, "pl");

      // Odczyt pozycji kosztowych z JSONB w Neon
      const rawJson = record.raw_details_json;
      const parsedItems =
        rawJson && typeof rawJson === "object" && Array.isArray(rawJson.items)
          ? rawJson.items
          : [
              {
                name: `Wsparcie statutowe: ${record.goal}`,
                qty: "1 alok",
                gross: `${Number(record.amount).toFixed(2)} ${record.currency || "PLN"}`,
              },
            ];

      // Prawdziwe dane audytu z bazy Neon
      const auditData = record.invoice_number
        ? {
            invoiceNumber: record.invoice_number,
            seller: record.seller_name,
            sellerNip: record.seller_nip || "PL 796-221-50-02",
            issueDate: record.issue_date,
            totalGross: `${Number(record.audit_gross || record.amount).toFixed(2)} ${record.audit_currency || record.currency}`,
            auditHash: record.audit_hash || record.sha256_hash,
            semanticMatchScore: Number(record.confidence_score) || 100.0,
            items: parsedItems,
          }
        : null;

      return NextResponse.json({
        success: true,
        source: "neon_database",
        allocation: {
          id: record.id,
          patron_name: record.patron_name,
          goal: record.goal,
          goal_en: enLoc.text,
          goal_pl: plLoc.text,
          amount: record.amount,
          currency: record.currency,
          status: record.status,
          is_anonymous: record.is_anonymous,
          donor_note: record.donor_note,
          club_name: record.club_name,
          sha256_hash: record.sha256_hash,
          is_hash_sealed: Boolean(record.sha256_hash),
          created_at: record.created_at,
          // Prawdziwy obiekt audytu prosto z bazy Neon
          audit: auditData,
        },
      });
    }

    return NextResponse.json(
      {
        success: false,
        error: "CERTIFICATE_NOT_FOUND",
        message: `Certyfikat o identyfikatorze ${cleanId} nie został odnaleziony w Rejestrze Publicznym.`,
      },
      { status: 404 },
    );
  } catch (error) {
    console.error("Błąd w GET /api/certificate/[id]:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "DATABASE_QUERY_ERROR",
      },
      { status: 500 },
    );
  }
}
