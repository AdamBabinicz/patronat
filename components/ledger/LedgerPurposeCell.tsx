// components/ledger/LedgerPurposeCell.tsx
"use client";

import React from "react";
import type { Language } from "@/lib/translations";
import { getLocalizedPurpose } from "@/lib/translations/purposeMap";

interface LedgerPurposeCellProps {
  purpose: string;
  language: Language;
  /** Wariant dla widoku mobilnego */
  compact?: boolean;
}

export default function LedgerPurposeCell({
  purpose,
  language,
  compact = false,
}: LedgerPurposeCellProps) {
  let localized = getLocalizedPurpose(purpose, language);

  // Bezpośrednie zabezpieczenie semantyczne dla archiwalnych celów szachowych
  if (language === "en" && !localized.wasTranslated && purpose) {
    const pLower = purpose.toLowerCase();
    if (
      pLower.includes("zestaw") ||
      pLower.includes("szkółk") ||
      pLower.includes("szkolk") ||
      pLower.includes("początkując") ||
      pLower.includes("poczatkujac")
    ) {
      localized = {
        text: "Chess Sets & Equipment for Junior Academy",
        originalPl: purpose,
        wasTranslated: true,
      };
    }
  }

  const { text, originalPl } = localized;

  // Dyskretna informacja o oryginalnym zapisie dostępna po najechaniu kursorem (dla audytorów)
  const tooltipText =
    language === "en" && originalPl && originalPl !== text
      ? `${text} • Registry record: "${originalPl}"`
      : text;

  if (compact) {
    return (
      <div className="min-w-0">
        <p
          className="text-xs text-foreground font-medium break-words leading-snug line-clamp-2"
          title={tooltipText}
        >
          {text}
        </p>
      </div>
    );
  }

  return (
    <div className="min-w-0 pr-2">
      <div
        className="text-foreground font-semibold text-xs sm:text-sm leading-snug line-clamp-2"
        title={tooltipText}
      >
        {text}
      </div>
    </div>
  );
}
