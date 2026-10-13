// components/PayPalButton.tsx
"use client";

// Dwujęzyczny (PL / EN) komponent integrujący PayPal JS SDK.
// Stabilne renderowanie przycisków PayPal, BLIK, Przelewy24 i Karty bez pętli przeładowań DOM.
import React, { useEffect, useRef, useState } from "react";

export type Language = "pl" | "en";

export interface PayPalButtonProps {
  amount: number;
  currency?: "PLN" | "USD" | "EUR" | string;
  locale?: Language;
  description?: string;
  goal?: string;
  donorName?: string;
  patronName?: string;
  donorNote?: string;
  note?: string;
  clubName?: string;
  onSuccess: (details: any) => void;
  onError?: (error: Error) => void;
  onCancel?: () => void;
}

declare global {
  interface Window {
    paypal?: any;
  }
}

const translations = {
  pl: {
    loading: "Ładowanie bezpiecznej bramki płatności PayPal...",
    sdkError: "Nie udało się załadować PayPal JavaScript SDK.",
    renderError: "Błąd inicjalizacji przycisków płatności.",
    defaultDescription: "Wsparcie projektu",
    anonymous: "Anonimowy Darczyńca",
    orderError: "Błąd podczas tworzenia zlecenia płatności:",
    captureError: "Błąd podczas zatwierdzania płatności:",
    testModeBadge: "Tryb testowy PayPal aktywny (client-id=test)",
    simulateSuccess: "⚡ Błyskawiczny test bez logowania do PayPal",
  },
  en: {
    loading: "Loading secure PayPal checkout gateway...",
    sdkError: "Failed to load PayPal JavaScript SDK.",
    renderError: "Failed to initialize payment buttons.",
    defaultDescription: "Project donation & support",
    anonymous: "Anonymous Supporter",
    orderError: "Error creating payment order:",
    captureError: "Error capturing payment:",
    testModeBadge: "PayPal Test Mode Active (client-id=test)",
    simulateSuccess: "⚡ Instant test without PayPal login",
  },
};

export default function PayPalButton({
  amount,
  currency = "PLN",
  locale = "pl",
  description,
  goal,
  donorName,
  patronName,
  donorNote,
  note,
  clubName,
  onSuccess,
  onError,
  onCancel,
}: PayPalButtonProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [scriptError, setScriptError] = useState<string | null>(null);

  const buttonContainerRef = useRef<HTMLDivElement>(null);
  const isMountedRef = useRef<boolean>(true);
  const isRenderedRef = useRef<boolean>(false);

  // Dynamiczne referencje – gwarantują, że PayPal zawsze czyta najnowszą kwotę i cel
  const propsRef = useRef({
    amount,
    currency,
    locale,
    description,
    goal,
    donorName,
    patronName,
    donorNote,
    note,
    clubName,
    onSuccess,
    onError,
    onCancel,
  });

  propsRef.current = {
    amount,
    currency,
    locale,
    description,
    goal,
    donorName,
    patronName,
    donorNote,
    note,
    clubName,
    onSuccess,
    onError,
    onCancel,
  };

  const t = translations[locale] || translations.pl;
  const clientId = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID || "test";
  const isTestMode = clientId === "test";

  useEffect(() => {
    isMountedRef.current = true;
    isRenderedRef.current = false;
    let buttonsInstance: any = null;

    // 1. Ochrona przed fałszywymi ostrzeżeniami Zoid w konsoli
    const originalConsoleError = console.error;
    console.error = (...args: any[]) => {
      const errorString = args
        .map((arg) =>
          typeof arg === "object" ? JSON.stringify(arg) : String(arg),
        )
        .join(" ");

      if (
        errorString.includes("zoid") ||
        errorString.includes("paypal_js_sdk") ||
        errorString.includes("Detected container element removed") ||
        errorString.includes("window closed")
      ) {
        return;
      }
      originalConsoleError.apply(console, args);
    };

    const prevOnError = window.onerror;
    window.onerror = (message, source, lineno, colno, error) => {
      const msg = String(message || error?.message || "");
      if (
        msg.includes("zoid") ||
        msg.includes("paypal") ||
        msg.includes("Detected container element removed")
      ) {
        return true;
      }
      if (typeof prevOnError === "function") {
        return prevOnError(message, source, lineno, colno, error);
      }
      return false;
    };

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      const reasonStr = String(event.reason?.message || event.reason || "");
      if (
        reasonStr.includes("zoid") ||
        reasonStr.includes("Detected container element removed") ||
        reasonStr.includes("window closed")
      ) {
        event.preventDefault();
        event.stopPropagation();
      }
    };

    window.addEventListener("unhandledrejection", handleUnhandledRejection);

    const paypalLocale = locale === "pl" ? "pl_PL" : "en_US";
    const scriptId = "paypal-js-sdk";

    const renderButtons = () => {
      if (!isMountedRef.current || !buttonContainerRef.current) return;
      if (isRenderedRef.current) return;

      if (!window.paypal || !window.paypal.Buttons) {
        setScriptError(t.renderError);
        setIsLoading(false);
        return;
      }

      try {
        buttonContainerRef.current.innerHTML = "";

        buttonsInstance = window.paypal.Buttons({
          style: {
            layout: "vertical",
            color: "gold",
            shape: "rect",
            label: "paypal",
            height: 44,
          },

          createOrder: async (data: any, actions: any) => {
            const current = propsRef.current;
            const currentAmount = Math.max(1, Number(current.amount) || 10);
            const currentCurrency = current.currency || "PLN";
            const currentGoal =
              current.goal || current.description || t.defaultDescription;
            const currentDonor =
              current.donorName || current.patronName || t.anonymous;
            const currentNote = current.donorNote || current.note || "";

            // TRYB TESTOWY BROWSER-BASED (client-id=test)
            if (actions && actions.order) {
              return actions.order.create({
                purchase_units: [
                  {
                    description: currentGoal.substring(0, 127),
                    amount: {
                      currency_code: currentCurrency,
                      value: currentAmount.toFixed(2),
                    },
                  },
                ],
              });
            }

            // TRYB Z BACKENDEM REST API
            const response = await fetch("/api/paypal/create-order", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                amount: currentAmount,
                currency: currentCurrency,
                goal: currentGoal,
                patronName: currentDonor,
                donorName: currentDonor,
                donorNote: currentNote,
                clubName: current.clubName || "Klub Sportowy",
                locale: current.locale || "pl",
              }),
            });

            if (!response.ok) {
              const errorText = await response.text();
              throw new Error(`${t.orderError} ${errorText}`);
            }

            const resData = await response.json();
            return resData.id;
          },

          onApprove: async (data: any, actions: any) => {
            try {
              let details: any;

              if (actions && actions.order) {
                // W trybie przeglądarkowym pobieramy autoryzację z popupu PayPala
                details = await actions.order.capture();
              } else {
                const response = await fetch("/api/paypal/capture-order", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    orderId: data.orderID,
                    locale: propsRef.current.locale || "pl",
                  }),
                });

                if (!response.ok) {
                  const errorText = await response.text();
                  throw new Error(`${t.captureError} ${errorText}`);
                }

                details = await response.json();
              }

              const enrichedDetails = {
                ...details,
                orderID: data?.orderID || `ORD-${Date.now()}`,
                orderId:
                  data?.orderID ||
                  `ROSZADA-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`,
                amount: propsRef.current.amount,
                currency: propsRef.current.currency,
                goal: propsRef.current.goal || propsRef.current.description,
                donorName:
                  propsRef.current.donorName || propsRef.current.patronName,
                donorNote: propsRef.current.donorNote || propsRef.current.note,
              };

              propsRef.current.onSuccess(enrichedDetails);
            } catch (err: any) {
              const msg = String(err?.message || err);
              if (!msg.includes("zoid")) {
                console.error("PayPal onApprove error:", err);
                if (propsRef.current.onError) {
                  propsRef.current.onError(
                    err instanceof Error ? err : new Error(msg),
                  );
                }
              }
            }
          },

          onError: (err: any) => {
            const msg = String(err?.message || err);
            if (
              msg.includes("zoid") ||
              msg.includes("window closed") ||
              msg.includes("Detected container element removed")
            ) {
              return;
            }
            if (propsRef.current.onError) {
              propsRef.current.onError(
                err instanceof Error ? err : new Error(msg),
              );
            }
          },

          onCancel: () => {
            if (propsRef.current.onCancel) {
              propsRef.current.onCancel();
            }
          },
        });

        if (buttonContainerRef.current) {
          buttonsInstance
            .render(buttonContainerRef.current)
            .then(() => {
              if (isMountedRef.current) {
                isRenderedRef.current = true;
                setIsLoading(false);
              }
            })
            .catch(() => {
              if (isMountedRef.current) {
                setIsLoading(false);
              }
            });
        }
      } catch (err) {
        if (isMountedRef.current) {
          setScriptError(t.renderError);
          setIsLoading(false);
        }
      }
    };

    const existingScript = document.getElementById(
      scriptId,
    ) as HTMLScriptElement | null;
    const expectedSrc = `https://www.paypal.com/sdk/js?client-id=${clientId}&currency=${currency}&locale=${paypalLocale}&intent=capture`;

    // Jeśli skrypt istnieje, ale w innej walucie -> usuń stary i pobierz nowy
    if (existingScript) {
      if (
        existingScript.src === expectedSrc &&
        window.paypal &&
        window.paypal.Buttons
      ) {
        renderButtons();
      } else {
        existingScript.remove();
        delete window.paypal;

        const script = document.createElement("script");
        script.id = scriptId;
        script.src = expectedSrc;
        script.async = true;

        script.onload = () => {
          if (isMountedRef.current) renderButtons();
        };

        script.onerror = () => {
          if (isMountedRef.current) {
            setScriptError(t.sdkError);
            setIsLoading(false);
          }
        };

        document.body.appendChild(script);
      }
    } else {
      const script = document.createElement("script");
      script.id = scriptId;
      script.src = expectedSrc;
      script.async = true;

      script.onload = () => {
        if (isMountedRef.current) renderButtons();
      };

      script.onerror = () => {
        if (isMountedRef.current) {
          setScriptError(t.sdkError);
          setIsLoading(false);
        }
      };

      document.body.appendChild(script);
    }

    return () => {
      isMountedRef.current = false;
      console.error = originalConsoleError;
      window.onerror = prevOnError;
      window.removeEventListener(
        "unhandledrejection",
        handleUnhandledRejection,
      );
    };
  }, [clientId, currency, locale]);

  const handleSimulatedSuccess = () => {
    const current = propsRef.current;
    const simulatedDetails = {
      id: `TEST-PAYPAL-${Date.now()}`,
      orderId: `ROSZADA-2026-${Math.floor(100 + Math.random() * 900)}`,
      status: "COMPLETED",
      simulated: true,
      amount: current.amount,
      currency: current.currency,
      goal: current.goal || current.description || t.defaultDescription,
      donorName: current.donorName || current.patronName || t.anonymous,
      donorNote: current.donorNote || current.note || "",
      payer: {
        name: {
          given_name: current.donorName || current.patronName || "Mecenas",
          surname: "Testowy",
        },
        email_address: "test-donor@example.com",
      },
    };
    current.onSuccess(simulatedDetails);
  };

  return (
    <div className="w-full flex flex-col items-center">
      {isLoading && (
        <div className="flex items-center justify-center p-3 text-xs text-muted-foreground animate-pulse">
          <span>{t.loading}</span>
        </div>
      )}

      {scriptError && (
        <div className="w-full p-3 mb-3 bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-400 text-xs rounded-xl">
          {scriptError}
        </div>
      )}

      {/* Kontener przycisków PayPal, BLIK, Przelewy24 i Karty */}
      <div ref={buttonContainerRef} className="w-full min-h-[44px]" />

      {/* Panel trybu testowego */}
      {isTestMode && (
        <div className="w-full mt-3 pt-2 border-t border-border/50 flex flex-col items-center gap-1.5">
          <span className="text-[10px] font-bold text-amber-800 dark:text-amber-300 bg-amber-500/15 border border-amber-500/30 px-2 py-0.5 rounded-full uppercase tracking-wider">
            {t.testModeBadge}
          </span>
          <button
            type="button"
            onClick={handleSimulatedSuccess}
            className="text-xs font-semibold text-muted-foreground hover:text-foreground underline mt-0.5 cursor-pointer transition-colors"
          >
            {t.simulateSuccess}
          </button>
        </div>
      )}
    </div>
  );
}
