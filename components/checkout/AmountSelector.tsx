"use client";

import React from "react";
import type { Currency } from "./types";
import { PRESET_AMOUNTS } from "./types";
import type { Messages } from "@/lib/translations";

interface AmountSelectorProps {
  currency: Currency;
  amount: number;
  isCustom: boolean;
  customAmount: string;
  minAmount: number;
  t: Messages["checkout"];
  onCurrencyChange: (cur: Currency) => void;
  onSelectPreset: (value: number) => void;
  onCustomToggle: () => void;
  onCustomChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export function AmountSelector({
  currency,
  amount,
  isCustom,
  customAmount,
  minAmount,
  t,
  onCurrencyChange,
  onSelectPreset,
  onCustomToggle,
  onCustomChange,
}: AmountSelectorProps) {
  const currentEffectiveAmount = isCustom
    ? parseFloat(customAmount) || 0
    : amount;

  return (
    <>
      {/* Wybór waluty */}
      <div className="mb-5">
        <label className="block text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-2">
          {t.currencyLabel}
        </label>
        <div className="grid grid-cols-3 gap-2">
          {(["PLN", "EUR", "USD"] as Currency[]).map((cur) => (
            <button
              key={cur}
              type="button"
              onClick={() => onCurrencyChange(cur)}
              className={`py-2 px-3 text-xs sm:text-sm font-bold rounded-xl border transition-all ${
                currency === cur
                  ? "border-amber-500 bg-amber-500/15 text-amber-800 dark:text-amber-300 ring-1 ring-amber-500 shadow-xs"
                  : "border-border bg-card text-foreground hover:bg-muted"
              }`}
            >
              {cur}
            </button>
          ))}
        </div>
      </div>

      {/* Wybór kwoty */}
      <div className="mb-5">
        <label className="block text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-2">
          {t.amountLabel}
        </label>
        <div className="grid grid-cols-3 gap-2 mb-2.5">
          {PRESET_AMOUNTS[currency].map((preset) => (
            <button
              key={preset}
              type="button"
              onClick={() => onSelectPreset(preset)}
              className={`py-2 px-2 text-xs sm:text-sm font-bold rounded-xl border transition-all ${
                !isCustom && amount === preset
                  ? "border-emerald-700 bg-emerald-700 text-white shadow-xs dark:bg-emerald-600 dark:border-emerald-600"
                  : "border-border bg-card text-foreground hover:bg-muted"
              }`}
            >
              {preset} {currency}
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={onCustomToggle}
          className={`w-full py-2 px-3 text-xs font-semibold rounded-xl border transition-all ${
            isCustom
              ? "border-emerald-700 bg-emerald-700/15 text-emerald-800 dark:text-emerald-300 ring-1 ring-emerald-700"
              : "border-border bg-card text-muted-foreground hover:text-foreground hover:bg-muted"
          }`}
        >
          {t.customAmount}
        </button>

        {isCustom && (
          <div className="relative mt-2">
            <input
              type="number"
              min="1"
              step="1"
              value={customAmount}
              onChange={onCustomChange}
              placeholder="0.00"
              className="w-full pl-4 pr-16 py-2.5 border border-border bg-background rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-600 text-lg font-bold text-foreground"
              autoFocus
            />
            <span className="absolute right-4 top-2.5 text-xs font-bold text-muted-foreground">
              {currency}
            </span>
          </div>
        )}

        {currentEffectiveAmount < minAmount && (
          <p className="text-xs text-red-500 mt-1.5 font-medium">
            {t.minAmountWarning} {minAmount} {currency}.
          </p>
        )}
      </div>
    </>
  );
}
