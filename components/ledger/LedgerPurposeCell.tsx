// components/ledger/LedgerPurposeCell.tsx
"use client";

import React from "react";
import { type Language, getTranslations } from "@/lib/translations";
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
  const { text, originalPl } = getLocalizedPurpose(purpose, language);
  const t = getTranslations(language);

  // Dyskretna informacja o kanonicznym zapisie źródłowym w bazie (dla audytorów i sędziów)
  const tooltipText =
    language === "en" && originalPl && originalPl !== text
      ? `${text} • ${t.ledger.registryTooltip}: "${originalPl}"`
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
