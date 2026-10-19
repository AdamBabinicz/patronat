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
    testPayerGivenName: "Testowy",
    testPayerFamilyName: "Darczyńca",
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
    testPayerGivenName: "Test",
    testPayerFamilyName: "Donor",
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
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [scriptError, setScriptError] = useState<string | null>(null);

  const buttonContainerRef = useRef<HTMLDivElement>(null);
  const isMountedRef = useRef<boolean>(true);
  const isRenderingRef = useRef<boolean>(false);
  const buttonsInstanceRef = useRef<any>(null);
  const loadedCurrencyRef = useRef<string | null>(null);
  const currentRenderSessionIdRef = useRef<number>(0);

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

  // Obsługa powrotu z PayPala na urządzeniach mobilnych (?canceled=true)
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
    const sessionId = ++currentRenderSessionIdRef.current;

    // Tłumienie znanych komunikatów zoid przy zamykaniu okna popup przez użytkownika
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

    const cleanupActiveButtons = () => {
      if (buttonsInstanceRef.current) {
        try {
          if (typeof buttonsInstanceRef.current.close === "function") {
            buttonsInstanceRef.current.close();
          }
        } catch {}
        buttonsInstanceRef.current = null;
      }
      if (buttonContainerRef.current) {
        buttonContainerRef.current.innerHTML = "";
      }
      isRenderingRef.current = false;
    };

    const renderButtons = () => {
      if (
        !isMountedRef.current ||
        sessionId !== currentRenderSessionIdRef.current
      ) {
        return;
      }
      if (!buttonContainerRef.current) {
        return;
      }
      if (isRenderingRef.current) {
        return;
      }
      if (!window.paypal || !window.paypal.Buttons) {
        return;
      }

      try {
        isRenderingRef.current = true;
        cleanupActiveButtons();

        const buttonsInstance = window.paypal.Buttons({
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
            const activeCurrency = current.currency || "PLN";
            const currentGoal =
              current.goal || current.description || t.defaultDescription;
            const currentDonor =
              current.donorName || current.patronName || t.anonymous;
            const currentNote = current.donorNote || current.note || "";

            // 1. Utworzenie zlecenia przez backend REST API
            if (!isTestMode) {
              try {
                const response = await fetch("/api/paypal/create-order", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    amount: currentAmount,
                    currency: activeCurrency,
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
                // Bezpieczny fallback do klienta SDK
              }
            }

            // 2. Bezpieczny fallback przez PayPal Client SDK
            if (actions && actions.order) {
              return actions.order.create({
                purchase_units: [
                  {
                    description: currentGoal.substring(0, 127),
                    amount: {
                      currency_code: activeCurrency,
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

              // 1. Zapis autoryzacji do bazy danych przez backend
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
                  // Fallback na bezpośrednie wykonanie capture przez klienta
                }
              }

              // 2. Fallback capture przez klienta SDK
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

        buttonsInstanceRef.current = buttonsInstance;

        if (buttonContainerRef.current && isMountedRef.current) {
          buttonsInstance
            .render(buttonContainerRef.current)
            .then(() => {
              if (
                isMountedRef.current &&
                sessionId === currentRenderSessionIdRef.current
              ) {
                setIsLoading(false);
                setScriptError(null);
                isRenderingRef.current = false;
              }
            })
            .catch((err: any) => {
              const errMsg = String(err?.message || err);
              if (
                !errMsg.includes("container element removed") &&
                !errMsg.includes("zoid")
              ) {
                if (isMountedRef.current) {
                  setScriptError(t.renderError);
                }
              }
              if (isMountedRef.current) {
                setIsLoading(false);
                isRenderingRef.current = false;
              }
            });
        }
      } catch (err) {
        if (isMountedRef.current) {
          setScriptError(t.renderError);
          setIsLoading(false);
          isRenderingRef.current = false;
        }
      }
    };

    const expectedSrc = `https://www.paypal.com/sdk/js?client-id=${clientId}&currency=${currency}&intent=capture`;

    // Czyszczenie niepasujących skryptów
    const existingScripts = Array.from(
      document.querySelectorAll<HTMLScriptElement>(
        "script[src*='paypal.com/sdk/js']",
      ),
    );

    let matchingScript: HTMLScriptElement | null = null;

    for (const s of existingScripts) {
      if (
        s.src.includes(`currency=${currency}`) &&
        s.src.includes(`client-id=${clientId}`)
      ) {
        matchingScript = s;
      } else {
        s.remove();
      }
    }

    // Resetowanie rejestru Zoid w oknie przed dołączeniem nowego skryptu
    const resetZoidRegistry = () => {
      try {
        if (
          typeof window !== "undefined" &&
          window.__zoid__ &&
          window.__zoid__.__components__
        ) {
          delete window.__zoid__.__components__["paypal-buttons"];
          delete window.__zoid__.__components__["paypal-marks"];
          delete window.__zoid__.__components__["paypal-messages"];
        }
      } catch {}
    };

    if (!matchingScript || loadedCurrencyRef.current !== currency) {
      cleanupActiveButtons();
      resetZoidRegistry();
      setIsLoading(true);

      const script = document.createElement("script");
      script.id = `paypal-sdk-${currency}`;
      script.src = expectedSrc;
      script.async = true;

      script.onload = () => {
        if (
          isMountedRef.current &&
          sessionId === currentRenderSessionIdRef.current
        ) {
          loadedCurrencyRef.current = currency;
          renderButtons();
        }
      };

      script.onerror = () => {
        if (
          isMountedRef.current &&
          sessionId === currentRenderSessionIdRef.current
        ) {
          setScriptError(t.sdkError);
          setIsLoading(false);
        }
      };

      document.head.appendChild(script);
    } else if (window.paypal && window.paypal.Buttons) {
      renderButtons();
    } else {
      const activeScript = matchingScript;
      if (activeScript) {
        activeScript.addEventListener("load", () => {
          if (
            isMountedRef.current &&
            sessionId === currentRenderSessionIdRef.current
          ) {
            loadedCurrencyRef.current = currency;
            renderButtons();
          }
        });
      }
    }

    return () => {
      isMountedRef.current = false;
      cleanupActiveButtons();
      console.error = originalConsoleError;
      window.removeEventListener(
        "unhandledrejection",
        handleUnhandledRejection,
      );
    };
  }, [
    clientId,
    currency,
    t.defaultDescription,
    t.anonymous,
    t.renderError,
    t.sdkError,
  ]);

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
          given_name:
            current.donorName || current.patronName || t.testPayerGivenName,
          surname: t.testPayerFamilyName,
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
