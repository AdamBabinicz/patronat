// app/api/paypal/capture-order/route.ts
// Zatwierdzenie płatności w PayPal REST API v2 oraz automatyczny, trwały zapis alokacji w bazie Neon PostgreSQL.

import { NextResponse } from "next/server";
import { capturePayPalOrder } from "@/lib/paypal";
import { sql, ensureDatabaseSchema } from "@/lib/db";
import type { Language } from "@/lib/translations";
import crypto from "crypto";

export const dynamic = "force-dynamic";

function generateSha256(
  id: string,
  goal: string,
  amount: number,
  club: string,
): string {
  return crypto
    .createHash("sha256")
    .update(`${id}:${goal}:${amount}:${club}:PatronAI`)
    .digest("hex");
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { orderId } = body;
    const locale: Language = body.locale === "en" ? "en" : "pl";

    if (
      !orderId ||
      typeof orderId !== "string" ||
      orderId.trim().length === 0
    ) {
      return NextResponse.json(
        {
          code: "MISSING_ORDER_ID",
          error:
            locale === "pl"
              ? "Brak wymaganego identyfikatora zamówienia (orderId)."
              : "Missing required order ID.",
        },
        { status: 400 },
      );
    }

    const cleanOrderId = orderId.trim();

    // 1. Wywołanie autoryzacji i przechwycenia środków w PayPal REST API v2
    const captureResult = await capturePayPalOrder(cleanOrderId);

    // 2. Ekstrakcja danych transakcji dla trwałego zapisu w bazie danych
    const capturedCapture =
      captureResult.purchase_units?.[0]?.payments?.captures?.[0];

    const rawAmount = capturedCapture?.amount?.value || body.amount || 100;

    const effectiveAmount = parseFloat(String(rawAmount)) || 100.0;
    const effectiveCurrency =
      capturedCapture?.amount?.currency_code || body.currency || "PLN";

    const isAnonymous = Boolean(body.isAnonymous);
    const donorFromPaypal = captureResult.payer?.name
      ? `${captureResult.payer.name.given_name || ""} ${captureResult.payer.name.surname || ""}`.trim()
      : "";

    const candidateName = body.patronName || body.donorName || donorFromPaypal;

    const effectivePatron = isAnonymous
      ? locale === "pl"
        ? "Anonimowy Darczyńca"
        : "Anonymous Supporter"
      : String(
          candidateName || (locale === "pl" ? "Mecenas Klubu" : "Club Patron"),
        ).trim();

    const effectiveGoal = String(
      body.goal ||
        body.description ||
        (locale === "pl"
          ? "Ogólny fundusz rozwoju talentów"
          : "General youth development fund"),
    ).trim();

    const effectiveClub = String(body.clubName || "UKS Roszada Radom").trim();
    const donorNote = body.donorNote || body.note || null;
    const sha256Hash = generateSha256(
      cleanOrderId,
      effectiveGoal,
      effectiveAmount,
      effectiveClub,
    );

    // 3. Trwały zapis w bazie Neon PostgreSQL
    try {
      await ensureDatabaseSchema();

      await sql`
        INSERT INTO allocations (
          id,
          patron_name,
          goal,
          amount,
          currency,
          status,
          is_anonymous,
          donor_note,
          club_name,
          sha256_hash,
          created_at
        ) VALUES (
          ${cleanOrderId},
          ${effectivePatron},
          ${effectiveGoal},
          ${effectiveAmount},
          ${effectiveCurrency},
          'VERIFIED',
          ${isAnonymous},
          ${donorNote},
          ${effectiveClub},
          ${sha256Hash},
          NOW()
        )
        ON CONFLICT (id) DO UPDATE SET
          status = 'VERIFIED',
          amount = EXCLUDED.amount;
      `;
    } catch (dbError) {
      // Logujemy błąd bazy, ale nie blokujemy sukcesu płatności PayPal dla klienta
      console.error("Błąd zapisu do Neon PostgreSQL podczas capture:", dbError);
    }

    // 4. Sukces – zwracamy pełny status transakcji z PayPal i certyfikat
    return NextResponse.json({
      success: true,
      orderId: cleanOrderId,
      status: captureResult.status || "COMPLETED",
      sha256_hash: sha256Hash,
      details: captureResult,
    });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Internal Server Error";
    console.error("Błąd w /api/paypal/capture-order:", message);

    return NextResponse.json(
      {
        code: "PAYPAL_CAPTURE_FAILED",
        error: message,
      },
      { status: 500 },
    );
  }
}
