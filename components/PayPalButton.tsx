// components/PayPalButton.tsx
"use client";

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
    __zoid__?: any;
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
    cancelPayment: "Anuluj i wróć",
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
    cancelPayment: "Cancel and return",
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
  const isRenderingRef = useRef<boolean>(false);

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

  // Obsługa powrotu z PayPala na telefonie (?canceled=true)
  useEffect(() => {
    if (typeof window !== "undefined") {
      const urlParams = new URLSearchParams(window.location.search);
      if (urlParams.get("canceled") === "true") {
        urlParams.delete("canceled");
        const newUrl =
          window.location.pathname +
          (urlParams.toString() ? `?${urlParams.toString()}` : "");
        window.history.replaceState({}, "", newUrl);

        if (propsRef.current.onCancel) {
          propsRef.current.onCancel();
        }
      }
    }
  }, []);

  useEffect(() => {
    isMountedRef.current = true;
    let buttonsInstance: any = null;

    // Tłumienie nieistotnych ostrzeżeń zoid podczas zamykania okna popup
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
        errorString.includes("window closed") ||
        errorString.includes("paypal-buttons")
      ) {
        return;
      }
      originalConsoleError.apply(console, args);
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

    const scriptId = "paypal-js-sdk";
    const expectedSrc = `https://www.paypal.com/sdk/js?client-id=${clientId}&currency=${currency}&intent=capture`;

    const renderButtons = () => {
      if (!isMountedRef.current || !buttonContainerRef.current) return;
      if (isRenderingRef.current) return;

      if (!window.paypal || !window.paypal.Buttons) {
        return;
      }

      try {
        isRenderingRef.current = true;
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

            // 1. Próba utworzenia przez backend REST API
            if (!isTestMode) {
              try {
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
                    clubName: current.clubName,
                    locale: current.locale || "pl",
                  }),
                });

                if (response.ok) {
                  const resData = await response.json();
                  if (resData.id) return resData.id;
                }
              } catch (e) {
                console.warn(
                  "create-order endpoint fallback to client SDK:",
                  e,
                );
              }
            }

            // 2. Niezawodny fallback przez PayPal Client SDK
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
          },

          onApprove: async (data: any, actions: any) => {
            try {
              let details: any = null;

              // Próba zapisu capture przez backend do bazy Neon
              if (!isTestMode) {
                try {
                  const current = propsRef.current;
                  const response = await fetch("/api/paypal/capture-order", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      orderId: data.orderID,
                      amount: current.amount,
                      currency: current.currency,
                      goal: current.goal || current.description,
                      patronName: current.patronName || current.donorName,
                      donorName: current.donorName || current.patronName,
                      donorNote: current.donorNote || current.note,
                      clubName: current.clubName,
                      locale: current.locale || "pl",
                    }),
                  });

                  if (response.ok) {
                    details = await response.json();
                  }
                } catch (e) {
                  console.warn(
                    "capture-order API failed, falling back to client capture:",
                    e,
                  );
                }
              }

              // Fallback capture przez klienta SDK, jeśli backend nie zwrócił danych
              if (!details && actions && actions.order) {
                details = await actions.order.capture();
              }

              const enrichedDetails = {
                ...details,
                orderID: data?.orderID || details?.id || `ORD-${Date.now()}`,
                orderId:
                  data?.orderID ||
                  details?.id ||
                  `ORD-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`,
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
                setIsLoading(false);
                setScriptError(null);
                isRenderingRef.current = false;
              }
            })
            .catch((err: any) => {
              const errMsg = String(err?.message || err);
              if (!errMsg.includes("container element removed")) {
                console.error("PayPal render error:", err);
              }
              if (isMountedRef.current) {
                setIsLoading(false);
                isRenderingRef.current = false;
              }
            });
        }
      } catch (err) {
        console.error("PayPal Buttons initialization error:", err);
        if (isMountedRef.current) {
          setScriptError(t.renderError);
          setIsLoading(false);
          isRenderingRef.current = false;
        }
      }
    };

    // Sprawdzenie wszystkich skryptów PayPala w dokumencie
    const allScripts = document.querySelectorAll<HTMLScriptElement>(
      "script[src*='paypal.com/sdk/js']",
    );
    let matchingScriptExists = false;

    allScripts.forEach((s) => {
      // Jeśli skrypt ma dokładnie tę samą walutę i clientId, zachowaj go
      if (
        s.src.includes(`currency=${currency}`) &&
        s.src.includes(`client-id=${clientId}`)
      ) {
        matchingScriptExists = true;
      } else {
        // Jeśli skrypt ma inną walutę (np. stary EUR, a teraz USD), usuń go natychmiast
        s.remove();
      }
    });

    if (!matchingScriptExists) {
      try {
        delete (window as any).paypal;
        delete (window as any).__zoid__;
      } catch {}

      setIsLoading(true);
      const newScript = document.createElement("script");
      newScript.id = scriptId;
      newScript.src = expectedSrc;
      newScript.async = true;

      newScript.onload = () => {
        if (isMountedRef.current) {
          renderButtons();
        }
      };

      newScript.onerror = () => {
        if (isMountedRef.current) {
          setScriptError(t.sdkError);
          setIsLoading(false);
        }
      };

      document.head.appendChild(newScript);
    } else if (window.paypal && window.paypal.Buttons) {
      renderButtons();
    } else {
      const currentScript = document.getElementById(scriptId);
      currentScript?.addEventListener("load", () => {
        if (isMountedRef.current) renderButtons();
      });
    }

    return () => {
      isMountedRef.current = false;
      isRenderingRef.current = false;
      console.error = originalConsoleError;
      window.removeEventListener(
        "unhandledrejection",
        handleUnhandledRejection,
      );
    };
  }, [clientId, currency]);

  const handleSimulatedSuccess = () => {
    const current = propsRef.current;
    const simulatedDetails = {
      id: `TEST-PAYPAL-${Date.now()}`,
      orderId: `TEST-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`,
      status: "COMPLETED",
      simulated: true,
      amount: current.amount,
      currency: current.currency,
      goal: current.goal || current.description || t.defaultDescription,
      donorName: current.donorName || current.patronName || t.anonymous,
      donorNote: current.donorNote || current.note || "",
      payer: {
        name: {
          given_name: current.donorName || current.patronName || "Test",
          surname: "Donor",
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

      {/* Kontener przycisków PayPal */}
      <div ref={buttonContainerRef} className="w-full min-h-[44px]" />

      {/* Przycisk rezygnacji */}
      {onCancel && (
        <button
          type="button"
          onClick={onCancel}
          className="mt-3 text-xs text-muted-foreground hover:text-foreground transition-colors cursor-pointer py-1 px-3 rounded-lg hover:bg-muted/50"
        >
          {t.cancelPayment}
        </button>
      )}

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
