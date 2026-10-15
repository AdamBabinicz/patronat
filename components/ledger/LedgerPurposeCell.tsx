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
  const { text, originalPl, wasTranslated } = getLocalizedPurpose(
    purpose,
    language,
  );

  if (compact) {
    return (
      <div className="space-y-0.5 min-w-0">
        <p
          className="text-xs text-foreground font-medium break-words leading-snug line-clamp-2"
          title={text}
        >
          {text}
        </p>

        {language === "en" && wasTranslated && originalPl && (
          <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
            <span className="shrink-0 px-1 py-0.2 rounded font-mono font-bold uppercase tracking-wider bg-muted text-muted-foreground border border-border/70 text-[9px]">
              PL
            </span>
            <span
              className="truncate max-w-[190px] text-muted-foreground/80 italic"
              title={`Oryginalny zapis: ${originalPl}`}
            >
              {originalPl}
            </span>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-1 min-w-0 pr-2">
      <div
        className="text-foreground font-semibold text-xs sm:text-sm leading-snug line-clamp-2"
        title={text}
      >
        {text}
      </div>

      {language === "en" && wasTranslated && originalPl && (
        <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground/90">
          <span className="shrink-0 px-1.5 py-0.5 rounded-md font-mono font-bold uppercase tracking-wider bg-muted text-muted-foreground border border-border/70 text-[9px]">
            PL Original
          </span>
          <span
            className="truncate max-w-[220px] lg:max-w-[280px] text-muted-foreground/80 italic"
            title={`Oryginalny zapis w rejestrze: ${originalPl}`}
          >
            {originalPl}
          </span>
        </div>
      )}
    </div>
  );
}
