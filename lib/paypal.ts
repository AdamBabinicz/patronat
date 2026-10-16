// lib/paypal.ts
// Oficjalny moduł komunikacji z PayPal REST API v2 (Orders & Captures)
// Zoptymalizowany pod kątem Vercel Serverless z cachowaniem tokenu OAuth i idempotencją.

export interface CreateOrderParams {
  amount: number;
  currency?: string;
  goal?: string;
  description?: string;
  patronName?: string;
  donorName?: string;
  donorNote?: string;
  clubName?: string;
  cancelUrl?: string;
  returnUrl?: string;
  locale?: string;
}

export interface PayPalOrderResponse {
  id: string;
  status:
    | "CREATED"
    | "SAVED"
    | "APPROVED"
    | "VOIDED"
    | "COMPLETED"
    | "PAYER_ACTION_REQUIRED";
  links?: Array<{ href: string; rel: string; method: string }>;
}

export interface CaptureOrderResponse {
  id: string;
  status: "COMPLETED" | "FAILED" | "PENDING";
  payer?: {
    name?: { given_name?: string; surname?: string };
    email_address?: string;
    payer_id?: string;
  };
  purchase_units?: Array<{
    reference_id?: string;
    payments?: {
      captures?: Array<{
        id: string;
        status: string;
        amount: { value: string; currency_code: string };
      }>;
    };
  }>;
}

// Globalny bufor tokenu OAuth w pamięci instancji serverless
let tokenCache: {
  accessToken: string;
  expiresAt: number; // Unix timestamp w milisekundach
} | null = null;

/**
 * Zwraca bazowy adres URL PayPal API na podstawie konfiguracji środowiska
 */
function getPayPalBaseUrl(): string {
  if (process.env.PAYPAL_API_URL) {
    return process.env.PAYPAL_API_URL.replace(/\/$/, "");
  }
  const mode = (process.env.PAYPAL_MODE || "sandbox").toLowerCase();
  return mode === "live"
    ? "https://api-m.paypal.com"
    : "https://api-m.sandbox.paypal.com";
}

/**
 * Pobiera i cachuje Access Token OAuth 2.0 z PayPal REST API
 */
export async function getPayPalAccessToken(): Promise<string> {
  const clientId =
    process.env.PAYPAL_CLIENT_ID ||
    process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID ||
    "";
  const clientSecret = process.env.PAYPAL_CLIENT_SECRET || "";

  if (!clientId || clientId === "test" || !clientSecret) {
    throw new Error("MISSING_PAYPAL_CREDENTIALS");
  }

  const now = Date.now();
  // Zwróć z pamięci, jeśli token istnieje i ma jeszcze co najmniej 60 sekund ważności
  if (tokenCache && tokenCache.expiresAt > now + 60_000) {
    return tokenCache.accessToken;
  }

  const auth = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");
  const baseUrl = getPayPalBaseUrl();

  const response = await fetch(`${baseUrl}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
    cache: "no-store",
  });

  if (!response.ok) {
    const errText = await response.text();
    console.error("PayPal OAuth Error:", errText);
    throw new Error(`PAYPAL_AUTH_ERROR_${response.status}: ${errText}`);
  }

  const data = await response.json();
  const expiresInSeconds = Number(data.expires_in) || 32400; // domyślnie 9h

  tokenCache = {
    accessToken: data.access_token,
    expiresAt: now + expiresInSeconds * 1000,
  };

  return tokenCache.accessToken;
}

/**
 * Tworzy zamówienie płatności (Order) w standardzie PayPal v2 z obsługą idempotencji i integracją z SDK
 */
export async function createPayPalOrder(
  params: CreateOrderParams,
): Promise<PayPalOrderResponse> {
  const currency = params.currency || "PLN";
  const formattedAmount = Number(params.amount).toFixed(2);
  const cleanGoal = (params.goal || params.description || "").slice(0, 120);
  const cleanPatron = (params.patronName || params.donorName || "").slice(
    0,
    120,
  );
  const cleanClub = (params.clubName || "").slice(0, 127);

  // Zgodność ze standardem BCP-47 wymaganym przez PayPal Orders v2
  const paypalLocale = params.locale === "en" ? "en-US" : "pl-PL";

  const descriptionParts = [cleanClub, cleanGoal].filter(Boolean).join(" - ");
  const orderDescription = (
    descriptionParts ||
    cleanGoal ||
    cleanClub ||
    currency
  ).slice(0, 127);

  const accessToken = await getPayPalAccessToken();
  const baseUrl = getPayPalBaseUrl();
  const requestId = `PATRON-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

  const response = await fetch(`${baseUrl}/v2/checkout/orders`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      "PayPal-Request-Id": requestId,
    },
    body: JSON.stringify({
      intent: "CAPTURE",
      purchase_units: [
        {
          reference_id: requestId,
          description: orderDescription,
          custom_id: cleanPatron ? cleanPatron.slice(0, 127) : undefined,
          amount: {
            currency_code: currency,
            value: formattedAmount,
          },
        },
      ],
      application_context: {
        brand_name: cleanClub || undefined,
        locale: paypalLocale,
        landing_page: "NO_PREFERENCE",
        shipping_preference: "NO_SHIPPING",
        user_action: "PAY_NOW",
      },
    }),
    cache: "no-store",
  });

  if (!response.ok) {
    const errorData = await response.text();
    console.error("PayPal API Create Order Error:", errorData);
    throw new Error(`PAYPAL_CREATE_ORDER_ERROR: ${errorData}`);
  }

  return response.json();
}

/**
 * Przechwytuje i zatwierdza płatność (Capture) po autoryzacji mecenasa
 */
export async function capturePayPalOrder(
  orderId: string,
): Promise<CaptureOrderResponse> {
  if (!orderId || typeof orderId !== "string") {
    throw new Error("INVALID_PAYPAL_ORDER_ID");
  }

  const accessToken = await getPayPalAccessToken();
  const baseUrl = getPayPalBaseUrl();
  const requestId = `CAPTURE-${orderId}-${Date.now()}`;

  const response = await fetch(
    `${baseUrl}/v2/checkout/orders/${orderId}/capture`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
        "PayPal-Request-Id": requestId,
      },
      cache: "no-store",
    },
  );

  if (!response.ok) {
    const errorData = await response.text();
    console.error("PayPal API Capture Order Error:", errorData);
    throw new Error(`PAYPAL_CAPTURE_ORDER_ERROR: ${errorData}`);
  }

  return response.json();
}
