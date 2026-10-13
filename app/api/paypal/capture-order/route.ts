// app/api/paypal/capture-order/route.ts
import { NextResponse } from "next/server";
import { capturePayPalOrder } from "@/lib/paypal";
import type { Language } from "@/lib/translations";

export const dynamic = "force-dynamic";

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

    // Wywołanie autoryzacji i przechwycenia środków w PayPal REST API v2
    const captureResult = await capturePayPalOrder(orderId.trim());

    // Sukces – zwracamy pełny status transakcji z PayPal
    return NextResponse.json({
      success: true,
      orderId: orderId.trim(),
      status: captureResult.status || "COMPLETED",
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
