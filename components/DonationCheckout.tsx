// components/DonationCheckout.tsx
"use client";

import React, { useState, useEffect } from "react";
import PayPalButton from "./PayPalButton";
import { AmountSelector } from "./checkout/AmountSelector";
import { DonorDetailsForm } from "./checkout/DonorDetailsForm";
import { DonationCertificate } from "./checkout/DonationCertificate";
import type { Currency, DonationCheckoutProps } from "./checkout/types";
import { PRESET_AMOUNTS } from "./checkout/types";
import { getTranslations, type Language } from "@/lib/translations";

export interface ExtendedDonationCheckoutProps extends DonationCheckoutProps {
  initialDonorName?: string;
  donorWebsite?: string;
  isInitialBarter?: boolean;
}

// Słownik tłumaczeń dla mecenatu rzeczowego oraz interfejsu powrotu mobilnego
const barterDictionary = {
  pl: {
    barterPrefix: "Mecenat rzeczowy: ",
    badge: "Mecenat Rzeczowy (Barter / Usługa)",
    valuationNotice:
      "Świadczenie bezgotówkowe: Wsparcie realizowane w postaci usługi lub towaru.",
    cashChargeLabel: "Opłata gotówkowa:",
    marketValueLabel: "Szacowany ekwiwalent rynkowy (AVE):",
    submitButton: "Sfinalizuj mecenat rzeczowy i wygeneruj certyfikat",
    agreementDisclaimer:
      "Finalizacja nie obciąża Twojego konta bankowego. Rejestruje porozumienie barterowe z klubem i generuje certyfikat.",
    switchFinLabel: "Wpłata finansowa (PayPal)",
    switchBarterLabel: "Mecenat rzeczowy (Barter)",
    methodSelectionLabel: "Wybierz model wsparcia:",
    cancelText: "Anuluj i wybierz inną kwotę",
    mobileNoticeText:
      "Otwarto okno płatności. Jeśli rozmyśliłeś się, kliknij poniżej:",
    barterActiveNotice:
      "Wybrano tryb barterowy: Koszt finansowy wynosi 0 PLN. Świadczenie polega na bezpośrednim dostarczeniu produktów lub wykonaniu usługi.",
    zeroCashValue: (cur: string) => `0,00 ${cur}`,
  },
  en: {
    barterPrefix: "In-Kind Patronage: ",
    badge: "In-Kind Patronage (Barter / Service)",
    valuationNotice:
      "Cashless contribution: Support delivered as a commercial service or goods.",
    cashChargeLabel: "Cash charge:",
    marketValueLabel: "Estimated market value (AVE):",
    submitButton: "Finalize in-kind patronage & generate certificate",
    agreementDisclaimer:
      "Finalization does not charge your bank account. It records the barter agreement and generates the certificate.",
    switchFinLabel: "Monetary (PayPal)",
    switchBarterLabel: "In-Kind (Barter)",
    methodSelectionLabel: "Select patronage model:",
    cancelText: "Cancel and choose different amount",
    mobileNoticeText:
      "Payment window opened. If you changed your mind, click below:",
    barterActiveNotice:
      "Barter mode active: Cash cost is 0.00. Support consists of direct provision of goods or professional services.",
    zeroCashValue: (cur: string) => `${cur} 0.00`,
  },
};

const BARTER_KEYWORDS = [
  "rzeczow",
  "barter",
  "in-kind",
  "czyszczenie",
  "usług",
  "catering",
  "transport",
  "słodki stół",
  "sweet table",
  "poczęstunek",
  "treats",
  "remont",
];

// Funkcja pomocnicza czyszcząca i zamieniająca URL na czytelną nazwę firmy/marki (np. https://grama.netlify.app/ -> Grama)
function extractCleanBrandFromUrl(url: string): string {
  try {
    let clean = url
      .trim()
      .toLowerCase()
      .replace(/^https?:\/\//i, "")
      .replace(/^www\./i, "")
      .replace(/\/.*$/, "");

    // Obsługa platform hostingowych (np. grama.netlify.app -> grama)
    const hostingMatch = clean.match(
      /^([a-z0-9-]+)\.(netlify\.app|vercel\.app|github\.io|webflow\.io|pages\.dev|render\.com|herokuapp\.com)$/i,
    );
    if (hostingMatch) {
      clean = hostingMatch[1];
    } else {
      // Obsługa standardowych domen (np. firma-virgo.pl -> firma-virgo)
      clean = clean.replace(
        /\.(com\.pl|net\.pl|org\.pl|edu\.pl|gov\.pl|info\.pl|pl|com|eu|org|net|io|co|de|uk|app)$/i,
        "",
      );
      const parts = clean.split(".");
      clean = parts[parts.length - 1];
    }

    // Zamiana myślników i podkreśleń na spacje oraz formatowanie do Title Case
    const words = clean.split(/[-_]+/).filter(Boolean);
    return words.map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
  } catch {
    return url;
  }
}

// Formatowanie celu z uwzględnieniem trybu barterowego i języka bez powielania przedrostków
function formatGoalWithBarterPrefix(
  rawGoal: string,
  isBarter: boolean,
  lang: Language,
): string {
  const cleanGoal = rawGoal
    .replace(/^(mecenat rzeczowy|in-kind patronage|barter):\s*/i, "")
    .trim();
  if (!isBarter) return cleanGoal;
  const dict = barterDictionary[lang] || barterDictionary.pl;
  return `${dict.barterPrefix}${cleanGoal}`;
}

export default function DonationCheckout({
  initialLocale = "pl",
  initialAmount = 100,
  initialCurrency = "PLN",
  initialGoal,
  allocationDescription,
  clubName = "UKS Roszada Radom",
  messages,
  onSuccessCallback,
  initialDonorName,
  donorWebsite,
  isInitialBarter = false,
}: ExtendedDonationCheckoutProps) {
  const [locale, setLocale] = useState<Language>(initialLocale);
  const [currency, setCurrency] = useState<Currency>(initialCurrency);
  const [amount, setAmount] = useState<number>(initialAmount);
  const [customAmount, setCustomAmount] = useState<string>("");
  const [isCustom, setIsCustom] = useState<boolean>(false);
  const [goal, setGoal] = useState<string>(initialGoal || "");

  // Funkcja sprawdzająca, czy cel lub opis reprezentuje świadczenie rzeczowe/barter
  const detectIsBarter = (textGoal?: string, textDesc?: string): boolean => {
    if (isInitialBarter) return true;
    const combined = `${textGoal || ""} ${textDesc || ""}`.toLowerCase();
    return BARTER_KEYWORDS.some((kw) => combined.includes(kw));
  };

  const [isBarterMode, setIsBarterMode] = useState<boolean>(() =>
    Boolean(
      isInitialBarter || detectIsBarter(initialGoal, allocationDescription),
    ),
  );

  // Funkcja pomocnicza do ekstrakcji i czyszczenia nazwy firmy z propsów lub linku
  const extractFallbackName = (): string => {
    if (initialDonorName && initialDonorName.trim().length > 0) {
      return initialDonorName.trim();
    }
    if (donorWebsite && donorWebsite.trim().length > 0) {
      return extractCleanBrandFromUrl(donorWebsite);
    }
    if (allocationDescription) {
      const urlMatch = allocationDescription.match(
        /(https?:\/\/[^\s)]+|www\.[^\s)]+|[a-zA-Z0-9-]+\.(?:pl|com|eu|org|net|netlify\.app|vercel\.app)[^\s)]*)/i,
      );
      if (urlMatch) {
        return extractCleanBrandFromUrl(urlMatch[0]);
      }
    }
    return "";
  };

  const [donorName, setDonorName] = useState<string>(() =>
    extractFallbackName(),
  );
  const [isAnonymous, setIsAnonymous] = useState<boolean>(false);
  const [message, setMessage] = useState<string>("");
  const [paymentSuccess, setPaymentSuccess] = useState<any | null>(null);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [isAwaitingReturn, setIsAwaitingReturn] = useState<boolean>(false);

  // Synchronizacja po zmianie języka z zewnątrz
  useEffect(() => {
    setLocale(initialLocale);
    if (initialLocale === "en" && currency === "PLN") {
      setCurrency("EUR");
      setIsCustom(false);
      setAmount(PRESET_AMOUNTS["EUR"][1] || 25);
    } else if (
      initialLocale === "pl" &&
      (currency === "EUR" || currency === "USD")
    ) {
      setCurrency("PLN");
      setIsCustom(false);
      setAmount(PRESET_AMOUNTS["PLN"][1] || 100);
    }
  }, [initialLocale]);

  // Synchronizacja przy wyborze nowego celu lub patrona z PatronAgenta
  useEffect(() => {
    if (initialAmount) setAmount(initialAmount);
    if (initialGoal) setGoal(initialGoal);
    if (initialCurrency) setCurrency(initialCurrency);

    if (isInitialBarter || detectIsBarter(initialGoal, allocationDescription)) {
      setIsBarterMode(true);
    }

    if (initialDonorName && initialDonorName.trim().length > 0) {
      setDonorName(initialDonorName.trim());
    } else {
      const resolved = extractFallbackName();
      if (resolved) {
        setDonorName(resolved);
      }
    }
  }, [
    initialAmount,
    initialGoal,
    initialCurrency,
    initialDonorName,
    donorWebsite,
    allocationDescription,
    isInitialBarter,
  ]);

  // Wykrywanie powrotu z zewnętrznej karty PayPala na urządzeniu mobilnym
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible" && isAwaitingReturn) {
        setIsAwaitingReturn(false);
      }
    };

    const handleWindowFocus = () => {
      if (isAwaitingReturn) {
        setIsAwaitingReturn(false);
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("focus", handleWindowFocus);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("focus", handleWindowFocus);
    };
  }, [isAwaitingReturn]);

  const t = (messages || getTranslations(locale)).checkout;
  const localizedBarter = barterDictionary[locale] || barterDictionary.pl;
  const currentGoal = goal || initialGoal || t.defaultGoal;
  const currentEffectiveAmount = isCustom
    ? parseFloat(customAmount) || 0
    : amount;
  const minAmount = 1;

  const handleLocaleChange = (newLocale: Language) => {
    setLocale(newLocale);
    if (newLocale === "en" && currency === "PLN") {
      setCurrency("EUR");
      setIsCustom(false);
      setAmount(PRESET_AMOUNTS["EUR"][1] || 25);
    } else if (
      newLocale === "pl" &&
      (currency === "EUR" || currency === "USD")
    ) {
      setCurrency("PLN");
      setIsCustom(false);
      setAmount(PRESET_AMOUNTS["PLN"][1] || 100);
    }
  };

  const handleCurrencyChange = (cur: Currency) => {
    setCurrency(cur);
    setIsCustom(false);
    setAmount(PRESET_AMOUNTS[cur][1]);
  };

  const handleSelectPreset = (value: number) => {
    setIsCustom(false);
    setAmount(value);
    setPaymentError(null);
  };

  const handleCustomChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setCustomAmount(val);
    const parsed = parseFloat(val);
    if (!isNaN(parsed) && parsed > 0) {
      setAmount(parsed);
      setPaymentError(null);
    }
  };

  const handlePaymentCancel = () => {
    setPaymentError(null);
    setIsAwaitingReturn(false);
  };

  // Obsługa finalizacji (zarówno dla PayPal, jak i bezgotówkowego barteru)
  const processAllocationCommitment = async (
    orderId: string,
    isBarter: boolean,
    detailsPayload?: any,
  ) => {
    const resolvedName =
      (donorName && donorName.trim().length > 0 ? donorName.trim() : "") ||
      (initialDonorName && initialDonorName.trim().length > 0
        ? initialDonorName.trim()
        : "") ||
      extractFallbackName() ||
      "";

    const effectivePatron =
      isAnonymous || !resolvedName ? t.defaultAnonymous : resolvedName;

    const formattedGoal = formatGoalWithBarterPrefix(
      currentGoal,
      isBarter,
      locale,
    );

    const finalCommitmentAmount =
      currentEffectiveAmount > 0
        ? currentEffectiveAmount
        : initialAmount > 0
          ? initialAmount
          : 500;

    const finalCommitmentCurrency = currency || initialCurrency || "PLN";

    const recordPayload = {
      id: orderId,
      orderId,
      status: "COMPLETED",
      paymentMethod: isBarter ? "BARTER" : "PAYPAL",
      isBarter,
      goal: formattedGoal,
      donorName: effectivePatron,
      recordAmount: finalCommitmentAmount,
      recordCurrency: finalCommitmentCurrency,
      payer: {
        name: { given_name: effectivePatron },
      },
      amount: {
        currency_code: finalCommitmentCurrency,
        value: finalCommitmentAmount.toString(),
      },
      ...detailsPayload,
    };

    setPaymentSuccess(recordPayload);
    setPaymentError(null);
    setIsAwaitingReturn(false);

    // 1. Zapis w bazie Neon PostgreSQL
    try {
      await fetch("/api/ledger", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: orderId,
          patronName: effectivePatron,
          goal: formattedGoal,
          amount: finalCommitmentAmount,
          currency: finalCommitmentCurrency,
          isAnonymous,
          donorNote: message || undefined,
          clubName,
          status: "VERIFIED",
          paymentMethod: isBarter ? "BARTER" : "PAYPAL",
        }),
      });
    } catch {}

    // 2. Kopia zapasowa w LocalStorage
    if (typeof window !== "undefined") {
      try {
        const formattedAmount = `${finalCommitmentAmount.toFixed(0)} ${finalCommitmentCurrency}`;
        const newEntry: [string, string, string, string] = [
          effectivePatron,
          formattedGoal,
          formattedAmount,
          orderId,
        ];

        const existingEntries = JSON.parse(
          window.localStorage.getItem("patronai_live_entries") || "[]",
        );

        const updatedEntries = [newEntry, ...existingEntries];
        window.localStorage.setItem(
          "patronai_live_entries",
          JSON.stringify(updatedEntries),
        );
      } catch {}
    }

    if (onSuccessCallback) {
      onSuccessCallback(recordPayload);
    }
  };

  // Płatność gotówkowa PayPal
  const handlePaymentSuccess = async (details: any) => {
    const orderId =
      details?.orderId ||
      details?.id ||
      `ROSZADA-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`;

    await processAllocationCommitment(orderId, false, details);
  };

  // Bezgotówkowe zatwierdzenie umowy barterowej (0 PLN transferu gotówki)
  const handleBarterSuccess = async () => {
    const orderId = `BARTER-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
    await processAllocationCommitment(orderId, true);
  };

  const resetForm = () => {
    setPaymentSuccess(null);
    setPaymentError(null);
    setIsAwaitingReturn(false);
    setCustomAmount("");
    setIsCustom(false);
    setAmount(currency === "PLN" ? 100 : 25);
  };

  // Ekran sukcesu: Oficjalny certyfikat mecenasa
  if (paymentSuccess) {
    const resolvedGoal = formatGoalWithBarterPrefix(
      paymentSuccess.goal || currentGoal,
      paymentSuccess.isBarter,
      locale,
    );

    const resolvedPatron =
      paymentSuccess.donorName ||
      (isAnonymous
        ? t.defaultAnonymous
        : donorName.trim() || t.defaultAnonymous);

    const resolvedAmount =
      paymentSuccess.recordAmount || currentEffectiveAmount || amount;

    const resolvedCurrency = paymentSuccess.recordCurrency || currency;

    return (
      <DonationCertificate
        paymentDetails={paymentSuccess}
        isAnonymous={isAnonymous}
        donorName={resolvedPatron}
        clubName={clubName}
        goal={resolvedGoal}
        amount={resolvedAmount}
        currency={resolvedCurrency}
        locale={locale}
        t={t}
        onReset={resetForm}
      />
    );
  }

  return (
    <div
      id="checkout-section"
      className="max-w-xl mx-auto p-5 sm:p-7 bg-card border border-border rounded-3xl shadow-lg transition-colors"
    >
      {/* Nagłówek i przełącznik języka */}
      <div className="flex justify-between items-start gap-3 mb-6 pb-4 border-b border-border/70">
        <div>
          <h2 className="text-xl sm:text-2xl font-black tracking-tight text-foreground">
            {t.title}
          </h2>
          <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
            {t.subtitle}
          </p>
        </div>

        <div className="flex items-center gap-1 bg-muted p-1 rounded-xl text-xs font-bold shrink-0">
          <button
            type="button"
            onClick={() => handleLocaleChange("pl")}
            className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
              locale === "pl"
                ? "bg-card text-foreground shadow-xs font-black"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            PL
          </button>
          <button
            type="button"
            onClick={() => handleLocaleChange("en")}
            className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
              locale === "en"
                ? "bg-card text-foreground shadow-xs font-black"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            EN
          </button>
        </div>
      </div>

      {/* Przełącznik formy wsparcia: Gotówka (PayPal) vs Mecenat Rzeczowy (Barter) */}
      <div className="mb-6 p-1.5 bg-muted/60 border border-border rounded-2xl flex items-center gap-1">
        <button
          type="button"
          onClick={() => setIsBarterMode(false)}
          className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
            !isBarterMode
              ? "bg-card text-foreground shadow-xs"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <span>💳</span>
          <span>{localizedBarter.switchFinLabel}</span>
        </button>

        <button
          type="button"
          onClick={() => setIsBarterMode(true)}
          className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
            isBarterMode
              ? "bg-card text-foreground shadow-xs font-black"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <span>🎁</span>
          <span>{localizedBarter.switchBarterLabel}</span>
        </button>
      </div>

      {/* Box alokacji intencji (zainicjowany z PatronAgenta) */}
      {(initialGoal || allocationDescription || goal) && (
        <div
          className={`mb-6 p-4 rounded-2xl border text-xs space-y-1.5 transition-colors ${
            isBarterMode
              ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-950 dark:text-emerald-100"
              : "bg-amber-500/10 border-amber-500/30 text-amber-950 dark:text-amber-100"
          }`}
        >
          <div
            className={`flex items-center gap-1.5 font-bold uppercase tracking-wider text-[11px] ${
              isBarterMode
                ? "text-emerald-700 dark:text-emerald-300"
                : "text-amber-700 dark:text-amber-300"
            }`}
          >
            <span>{isBarterMode ? "🎁" : "⚡"}</span>
            <span>
              {isBarterMode ? localizedBarter.badge : t.agentAllocationBadge}
            </span>
          </div>
          <div className="font-semibold text-foreground text-sm">
            {formatGoalWithBarterPrefix(currentGoal, isBarterMode, locale)}
          </div>
          {allocationDescription && (
            <p className="text-muted-foreground leading-relaxed">
              {allocationDescription}
            </p>
          )}
          {isBarterMode && (
            <p className="text-[11px] text-emerald-700 dark:text-emerald-300 font-medium pt-1 border-t border-emerald-500/20">
              💡 {localizedBarter.barterActiveNotice}
            </p>
          )}
        </div>
      )}

      {/* Wybór waluty i kwoty wsparcia */}
      <AmountSelector
        currency={currency}
        amount={amount}
        isCustom={isCustom}
        customAmount={customAmount}
        minAmount={minAmount}
        t={t}
        onCurrencyChange={handleCurrencyChange}
        onSelectPreset={handleSelectPreset}
        onCustomToggle={() => setIsCustom(true)}
        onCustomChange={handleCustomChange}
      />

      {/* Formularz danych darczyńcy */}
      <DonorDetailsForm
        goal={goal}
        initialGoal={initialGoal}
        donorName={donorName}
        isAnonymous={isAnonymous}
        message={message}
        t={t}
        onGoalChange={setGoal}
        onDonorNameChange={setDonorName}
        onAnonymousChange={setIsAnonymous}
        onMessageChange={setMessage}
      />

      {/* Komunikat o błędzie */}
      {paymentError && (
        <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-400 text-xs rounded-xl font-medium">
          <strong>{t.errorTitle}:</strong> {paymentError}
        </div>
      )}

      {/* Baner pomocniczy po otwarciu okna na urządzeniu mobilnym */}
      {isAwaitingReturn && (
        <div className="mb-4 p-3 bg-muted/60 border border-border rounded-xl text-center space-y-2">
          <p className="text-xs text-muted-foreground">
            {localizedBarter.mobileNoticeText}
          </p>
          <button
            type="button"
            onClick={handlePaymentCancel}
            className="text-xs font-semibold text-foreground underline cursor-pointer"
          >
            {localizedBarter.cancelText}
          </button>
        </div>
      )}

      {/* Strefa zatwierdzenia: Barter (bezgotówkowy) vs PayPal (płatność) */}
      <div className="pt-4 border-t border-border">
        {isBarterMode ? (
          /* Ścieżka barterowa */
          <div className="space-y-3.5">
            <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-xs space-y-2">
              <div className="flex justify-between items-center text-emerald-900 dark:text-emerald-200 font-bold">
                <span>{localizedBarter.cashChargeLabel}</span>
                <span className="text-sm font-black text-emerald-600 dark:text-emerald-400">
                  {localizedBarter.zeroCashValue(currency)}
                </span>
              </div>
              <div className="flex justify-between items-center text-muted-foreground">
                <span>{localizedBarter.marketValueLabel}</span>
                <span className="font-semibold text-foreground">
                  {currentEffectiveAmount.toFixed(0)} {currency}
                </span>
              </div>
              <p className="text-[11px] text-muted-foreground pt-1 border-t border-emerald-500/20 leading-relaxed">
                {localizedBarter.agreementDisclaimer}
              </p>
            </div>

            <button
              type="button"
              onClick={handleBarterSuccess}
              className="w-full py-3.5 px-4 bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99] text-white font-black rounded-xl shadow-md hover:shadow-lg transition-all cursor-pointer flex items-center justify-center gap-2 text-xs sm:text-sm"
            >
              <span>✍️</span>
              <span>{localizedBarter.submitButton}</span>
            </button>
          </div>
        ) : (
          /* Ścieżka finansowa PayPal */
          <div>
            <label className="block text-[11px] font-bold text-muted-foreground text-center mb-3">
              {t.paymentMethod}
            </label>

            {currentEffectiveAmount >= minAmount ? (
              <PayPalButton
                amount={currentEffectiveAmount}
                currency={currency}
                locale={locale}
                goal={currentGoal}
                patronName={
                  isAnonymous
                    ? t.defaultAnonymous
                    : donorName.trim() || t.defaultAnonymous
                }
                donorName={
                  isAnonymous
                    ? t.defaultAnonymous
                    : donorName.trim() || t.defaultAnonymous
                }
                clubName={clubName}
                donorNote={message || undefined}
                note={message || undefined}
                description={`${currentGoal} - ${clubName}`}
                onSuccess={handlePaymentSuccess}
                onError={(err: Error) => {
                  setPaymentError(err.message);
                  setIsAwaitingReturn(false);
                }}
                onCancel={handlePaymentCancel}
              />
            ) : (
              <button
                disabled
                className="w-full py-3 bg-muted text-muted-foreground font-semibold rounded-xl cursor-not-allowed text-xs"
              >
                {t.minAmountWarning} {minAmount} {currency}
              </button>
            )}
          </div>
        )}

        <div className="mt-3.5 text-center">
          <span className="text-[11px] text-muted-foreground">
            🔒 {t.secureBadge}
          </span>
        </div>
      </div>
    </div>
  );
}
