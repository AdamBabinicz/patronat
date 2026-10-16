"use client";

import { useState, useEffect } from "react";
import { Cookie, X } from "lucide-react";
import type { Messages } from "@/lib/translations";

declare global {
  interface Window {
    dataLayer?: any[];
  }
}

interface CookieBannerProps {
  messages: Messages;
}

export default function CookieBanner({ messages }: CookieBannerProps) {
  const [showCookies, setShowCookies] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [analytics, setAnalytics] = useState(false);
  const [marketing, setMarketing] = useState(false);

  const t = messages.cookie;

  // Pomocnicza funkcja wysyłająca zgody do Google Tag Managera (Google Consent Mode v2)
  const pushConsentToGtm = (
    analyticsGranted: boolean,
    marketingGranted: boolean,
  ) => {
    if (typeof window !== "undefined") {
      window.dataLayer = window.dataLayer || [];
      window.dataLayer.push({
        event: "consent_update",
        consent: {
          analytics_storage: analyticsGranted ? "granted" : "denied",
          ad_storage: marketingGranted ? "granted" : "denied",
          ad_user_data: marketingGranted ? "granted" : "denied",
          ad_personalization: marketingGranted ? "granted" : "denied",
        },
      });
    }
  };

  useEffect(() => {
    try {
      const consentRaw = window.localStorage.getItem("patronai_cookie_consent");
      if (consentRaw) {
        const consent = JSON.parse(consentRaw);
        setAnalytics(Boolean(consent.analytics));
        setMarketing(Boolean(consent.marketing));
        // Przekaż zapamiętaną wcześniej zgodę do GTM przy wejściu na stronę
        pushConsentToGtm(
          Boolean(consent.analytics),
          Boolean(consent.marketing),
        );
      } else {
        setShowCookies(true);
      }
    } catch {
      setShowCookies(true);
    }

    // Nasłuchuj zdarzenia wywołanego z przycisku w stopce
    const handleOpenSettings = () => {
      setShowSettings(true);
    };

    window.addEventListener("openCookieSettings", handleOpenSettings);
    return () => {
      window.removeEventListener("openCookieSettings", handleOpenSettings);
    };
  }, []);

  const saveConsent = (a: boolean, m: boolean) => {
    try {
      window.localStorage.setItem(
        "patronai_cookie_consent",
        JSON.stringify({
          essential: true,
          analytics: a,
          marketing: m,
          timestamp: new Date().toISOString(),
        }),
      );
    } catch {}

    setAnalytics(a);
    setMarketing(m);
    setShowCookies(false);
    setShowSettings(false);

    // Zdarzenie do GTM po wyborze użytkownika
    pushConsentToGtm(a, m);
  };

  return (
    <>
      {/* Pływający baner zgody */}
      {showCookies && (
        <div className="fixed inset-x-4 bottom-4 z-40 mx-auto max-w-3xl rounded-3xl border border-neutral-300 bg-white p-5 shadow-2xl dark:border-neutral-800 dark:bg-neutral-900 animate-in fade-in slide-in-from-bottom-4 duration-300">
          <div className="flex gap-3">
            <Cookie className="mt-1 size-5 shrink-0 text-lime-600 dark:text-lime-400" />
            <div className="flex-1">
              <h2 className="font-bold text-sm text-neutral-900 dark:text-white">
                {t.title}
              </h2>
              <p className="mt-1 text-xs text-neutral-700 dark:text-neutral-300 leading-relaxed">
                {t.body}
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => saveConsent(true, true)}
                  className="rounded-full bg-neutral-900 px-4 py-2 text-xs font-bold text-white hover:bg-neutral-800 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-100 transition-colors cursor-pointer"
                >
                  {t.accept}
                </button>
                <button
                  type="button"
                  onClick={() => saveConsent(false, false)}
                  className="rounded-full border border-neutral-400 px-4 py-2 text-xs font-semibold text-neutral-800 hover:bg-neutral-100 dark:border-neutral-600 dark:text-neutral-200 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
                >
                  {t.reject}
                </button>
                <button
                  type="button"
                  onClick={() => setShowSettings(true)}
                  className="rounded-full border border-neutral-400 px-4 py-2 text-xs font-semibold text-neutral-800 hover:bg-neutral-100 dark:border-neutral-600 dark:text-neutral-200 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
                >
                  {t.settings}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal szczegółowych ustawień zgody */}
      {showSettings && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4 backdrop-blur-xs animate-in fade-in duration-200">
          <div
            role="dialog"
            aria-modal="true"
            className="w-full max-w-md rounded-3xl border border-neutral-300 bg-white p-6 text-neutral-900 shadow-2xl dark:border-neutral-800 dark:bg-neutral-900 dark:text-white"
          >
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold">{t.settings}</h2>
              <button
                type="button"
                onClick={() => setShowSettings(false)}
                aria-label={t.close}
                className="text-neutral-700 hover:text-neutral-950 dark:text-neutral-300 dark:hover:text-white cursor-pointer"
              >
                <X className="size-5" />
              </button>
            </div>
            <p className="mt-2 text-xs text-neutral-700 dark:text-neutral-300">
              {t.preferences}
            </p>
            <div className="mt-5 flex flex-col gap-2.5">
              <div className="rounded-2xl border border-neutral-300 bg-neutral-100 p-3.5 text-xs font-medium dark:border-neutral-800 dark:bg-neutral-950 flex justify-between items-center">
                <span className="text-neutral-800 dark:text-neutral-200">
                  {t.essential}
                </span>
                <span className="text-emerald-700 dark:text-emerald-400 font-bold">
                  {t.alwaysActive}
                </span>
              </div>
              {(
                [
                  [t.analytics, analytics, setAnalytics],
                  [t.marketing, marketing, setMarketing],
                ] as const
              ).map(([label, value, setter]) => (
                <button
                  key={label}
                  type="button"
                  onClick={() => setter(!value)}
                  className="flex items-center justify-between rounded-2xl border border-neutral-300 p-3.5 text-left text-xs hover:bg-neutral-50 dark:border-neutral-800 dark:hover:bg-neutral-800/50 transition-colors cursor-pointer"
                >
                  <span className="font-semibold text-neutral-800 dark:text-neutral-200">
                    {label}
                  </span>
                  <span
                    className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${
                      value
                        ? "bg-lime-400 text-neutral-950"
                        : "bg-neutral-200 text-neutral-800 dark:bg-neutral-800 dark:text-neutral-300"
                    }`}
                  >
                    {value ? t.activeState : t.inactiveState}
                  </span>
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={() => saveConsent(analytics, marketing)}
              className="mt-6 w-full rounded-full bg-neutral-900 px-4 py-3 text-xs font-bold text-white shadow-sm hover:bg-neutral-800 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-100 transition-all cursor-pointer"
            >
              {t.save}
            </button>
          </div>
        </div>
      )}
    </>
  );
}
