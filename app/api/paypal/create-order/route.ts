// app/api/paypal/create-order/route.ts
import { NextResponse } from "next/server";
import { createPayPalOrder } from "@/lib/paypal";
import { getTranslations, type Language } from "@/lib/translations";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { clubName } = body;

    // Odczytanie języka z żądania (domyślnie 'pl')
    const locale: Language = body.locale === "en" ? "en" : "pl";
    const t = getTranslations(locale);

    // Normalizacja waluty
    const rawCurrency = String(body.currency || "PLN")
      .trim()
      .toUpperCase();
    const currency = ["PLN", "EUR", "USD"].includes(rawCurrency)
      ? rawCurrency
      : "PLN";

    // Pobranie i konwersja kwoty
    const rawAmount = body.amount;
    const amount =
      typeof rawAmount === "number" ? rawAmount : parseFloat(String(rawAmount));

    // Walidacja kwoty z dwujęzycznym komunikatem
    if (!amount || isNaN(amount) || amount <= 0) {
      return NextResponse.json(
        {
          code: "INVALID_AMOUNT",
          error:
            locale === "pl"
              ? "Nieprawidłowa kwota wsparcia."
              : "Invalid patronage amount.",
        },
        { status: 400 },
      );
    }

    // Cel wsparcia – w razie braku pobierany z klucza i18n
    const rawGoal =
      body.goal ||
      body.cel ||
      body.description ||
      body.target ||
      body.purpose ||
      "";
    const goal =
      typeof rawGoal === "string" && rawGoal.trim().length > 0
        ? rawGoal.trim()
        : t.checkout.defaultGoal;

    // Dane darczyńcy – w razie braku pobierany z klucza i18n (np. Anonymous Patron dla EN)
    const candidateName =
      body.patronName || body.donorName || body.donor || body.name;

    const patronName =
      typeof candidateName === "string" && candidateName.trim().length > 0
        ? candidateName.trim()
        : t.checkout.defaultAnonymous;

    // Nazwa klubu – w razie braku z klucza i18n
    const resolvedClubName =
      typeof clubName === "string" && clubName.trim().length > 0
        ? clubName.trim()
        : t.agent.clubName;

    // Utworzenie zamówienia w PayPal REST API v2
    const order = await createPayPalOrder({
      amount,
      currency,
      goal,
      patronName,
      clubName: resolvedClubName,
    });

    return NextResponse.json({
      id: order.id,
      orderId: order.id,
      status: order.status,
    });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Internal Server Error";
    console.error("Błąd w /api/paypal/create-order:", message);
    return NextResponse.json(
      {
        code: "PAYPAL_ORDER_CREATION_FAILED",
        error: message,
      },
      { status: 500 },
    );
  }
}
