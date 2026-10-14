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

export default function DonationCheckout({
  initialLocale = "pl",
  initialAmount = 100,
  initialCurrency = "PLN",
  initialGoal,
  allocationDescription,
  clubName = "UKS Roszada Radom",
  messages,
  onSuccessCallback,
}: DonationCheckoutProps) {
  const [locale, setLocale] = useState<Language>(initialLocale);
  const [currency, setCurrency] = useState<Currency>(initialCurrency);
  const [amount, setAmount] = useState<number>(initialAmount);
  const [customAmount, setCustomAmount] = useState<string>("");
  const [isCustom, setIsCustom] = useState<boolean>(false);
  const [goal, setGoal] = useState<string>(initialGoal || "");
  const [donorName, setDonorName] = useState<string>("");
  const [isAnonymous, setIsAnonymous] = useState<boolean>(false);
  const [message, setMessage] = useState<string>("");
  const [paymentSuccess, setPaymentSuccess] = useState<any | null>(null);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [isAwaitingReturn, setIsAwaitingReturn] = useState<boolean>(false);

  // Synchronizacja po zmianie języka (np. z navbaru strony)
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

  // Synchronizacja przy wyborze nowego celu z PatronAgenta
  useEffect(() => {
    if (initialAmount) setAmount(initialAmount);
    if (initialGoal) setGoal(initialGoal);
    if (initialCurrency) setCurrency(initialCurrency);
  }, [initialAmount, initialGoal, initialCurrency]);

  // Wykrywanie powrotu z zewnętrznej karty PayPala na telefonie
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
  const currentGoal = goal || initialGoal || t.defaultGoal;
  const currentEffectiveAmount = isCustom
    ? parseFloat(customAmount) || 0
    : amount;
  const minAmount = 1;

  // Tłumaczenia pomocnicze dla powrotu i anulowania
  const cancelText =
    locale === "pl"
      ? "Anuluj i wybierz inną kwotę"
      : "Cancel and choose different amount";
  const mobileNoticeText =
    locale === "pl"
      ? "Otwarto okno płatności. Jeśli rozmyśliłeś się, kliknij poniżej:"
      : "Payment window opened. If you changed your mind, click below:";

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

  const handlePaymentSuccess = (details: any) => {
    setPaymentSuccess(details);
    setPaymentError(null);
    setIsAwaitingReturn(false);

    // Dynamiczny zapis do publicznego rejestru (localStorage)
    if (typeof window !== "undefined") {
      try {
        const orderId =
          details?.orderId ||
          details?.id ||
          `ROSZADA-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`;

        const effectivePatron = isAnonymous
          ? t.defaultAnonymous
          : donorName.trim() || t.defaultAnonymous;

        const newEntry: [string, string, string, string] = [
          effectivePatron,
          currentGoal,
          `${currentEffectiveAmount.toFixed(0)} ${currency}`,
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
      } catch (err) {
        console.warn(
          "Nie udało się zapisać alokacji do pamięci lokalnej:",
          err,
        );
      }
    }

    if (onSuccessCallback) {
      onSuccessCallback(details);
    }
  };

  const resetForm = () => {
    setPaymentSuccess(null);
    setPaymentError(null);
    setIsAwaitingReturn(false);
    setCustomAmount("");
    setIsCustom(false);
    setAmount(currency === "PLN" ? 100 : 25);
  };

  // EKRAN SUKCESU: OFICJALNY CERTYFIKAT MECENASA
  if (paymentSuccess) {
    return (
      <DonationCertificate
        paymentDetails={paymentSuccess}
        isAnonymous={isAnonymous}
        donorName={donorName}
        clubName={clubName}
        goal={currentGoal}
        amount={currentEffectiveAmount}
        currency={currency}
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

      {/* Box alokacji intencji (zainicjowany z PatronAgenta) */}
      {(initialGoal || allocationDescription) && (
        <div className="mb-6 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-xs space-y-1.5">
          <div className="flex items-center gap-1.5 font-bold uppercase tracking-wider text-amber-800 dark:text-amber-300">
            <span>⚡</span>
            <span>{t.agentAllocationBadge}</span>
          </div>
          <div className="font-semibold text-foreground text-sm">
            {currentGoal}
          </div>
          {allocationDescription && (
            <p className="text-muted-foreground leading-relaxed">
              {allocationDescription}
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

      {/* Baner pomocniczy po kliknięciu PayPala na urządzeniu mobilnym */}
      {isAwaitingReturn && (
        <div className="mb-4 p-3 bg-muted/60 border border-border rounded-xl text-center space-y-2">
          <p className="text-xs text-muted-foreground">{mobileNoticeText}</p>
          <button
            type="button"
            onClick={handlePaymentCancel}
            className="text-xs font-semibold text-foreground underline cursor-pointer"
          >
            {cancelText}
          </button>
        </div>
      )}

      {/* Autoryzacja i Przycisk PayPal */}
      <div className="pt-3 border-t border-border">
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
              isAnonymous ? t.defaultAnonymous : donorName || t.defaultAnonymous
            }
            donorName={
              isAnonymous ? t.defaultAnonymous : donorName || t.defaultAnonymous
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

        <div className="mt-3.5 text-center">
          <span className="text-[11px] text-muted-foreground">
            🔒 {t.secureBadge}
          </span>
        </div>
      </div>
    </div>
  );
}
