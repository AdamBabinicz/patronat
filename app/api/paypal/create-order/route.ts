// app/api/paypal/create-order/route.ts
import { NextResponse } from "next/server";
import { createPayPalOrder } from "@/lib/paypal";
import { getTranslations, type Language } from "@/lib/translations";

export const dynamic = "force-dynamic";

const errorDictionary = {
  pl: {
    invalidAmount: "Nieprawidłowa kwota wsparcia.",
    internalError: "Wystąpił błąd podczas tworzenia zlecenia płatności.",
  },
  en: {
    invalidAmount: "Invalid patronage amount.",
    internalError: "An error occurred while creating the payment order.",
  },
};

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { clubName } = body;

    // Odczytanie języka z żądania (domyślnie 'pl')
    const locale: Language = body.locale === "en" ? "en" : "pl";
    const t = getTranslations(locale);
    const errDict = errorDictionary[locale] || errorDictionary.pl;

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

    // Walidacja kwoty z komunikatem ze słownika i18n
    if (!amount || isNaN(amount) || amount <= 0) {
      return NextResponse.json(
        {
          code: "INVALID_AMOUNT",
          error: errDict.invalidAmount,
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

    // Dane darczyńcy – w razie braku pobierane z klucza i18n
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

    // Obsługa trybu symulacji dla sędziów (Zero-Config Developer Simulation)
    const configuredClientId =
      process.env.PAYPAL_CLIENT_ID ||
      process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID ||
      "test";

    if (configuredClientId === "test") {
      const simulatedId = `SIM-ORD-${Date.now()}`;
      return NextResponse.json({
        id: simulatedId,
        orderId: simulatedId,
        status: "CREATED",
      });
    }

    // Utworzenie zamówienia w autentycznym PayPal REST API v2
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
    console.error("PayPal Order Creation Error:", message);
    return NextResponse.json(
      {
        code: "PAYPAL_ORDER_CREATION_FAILED",
        error: message,
      },
      { status: 500 },
    );
  }
}
