"use client";

import React from "react";
import type { Messages } from "@/lib/translations";

interface DonorDetailsFormProps {
  goal: string;
  initialGoal?: string;
  donorName: string;
  isAnonymous: boolean;
  message: string;
  t: Messages["checkout"];
  onGoalChange: (value: string) => void;
  onDonorNameChange: (value: string) => void;
  onAnonymousChange: (checked: boolean) => void;
  onMessageChange: (value: string) => void;
}

export function DonorDetailsForm({
  goal,
  initialGoal,
  donorName,
  isAnonymous,
  message,
  t,
  onGoalChange,
  onDonorNameChange,
  onAnonymousChange,
  onMessageChange,
}: DonorDetailsFormProps) {
  return (
    <>
      {/* Cel alokacji (jeśli nie został z góry narzucony przez agenta) */}
      {!initialGoal && (
        <div className="mb-5">
          <label className="block text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-1.5">
            {t.targetGoalLabel}
          </label>
          <input
            type="text"
            value={goal}
            onChange={(e) => onGoalChange(e.target.value)}
            placeholder={t.defaultGoal}
            className="w-full px-3.5 py-2 text-xs sm:text-sm border border-border bg-background rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-600 text-foreground"
          />
        </div>
      )}

      {/* Dane darczyńcy / firmy */}
      <div className="space-y-4 mb-6">
        <div>
          <label className="block text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-1.5">
            {t.donorNameLabel}
          </label>
          <input
            type="text"
            disabled={isAnonymous}
            value={donorName}
            onChange={(e) => onDonorNameChange(e.target.value)}
            placeholder={t.donorNamePlaceholder}
            className="w-full px-3.5 py-2 text-xs sm:text-sm border border-border bg-background rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-600 disabled:opacity-50 text-foreground"
          />
        </div>

        <div className="flex items-center gap-2">
          <input
            id="anonymous"
            type="checkbox"
            checked={isAnonymous}
            onChange={(e) => onAnonymousChange(e.target.checked)}
            className="w-4 h-4 text-emerald-700 border-border rounded focus:ring-emerald-600 cursor-pointer"
          />
          <label
            htmlFor="anonymous"
            className="text-xs text-muted-foreground cursor-pointer select-none"
          >
            {t.anonymousCheckbox}
          </label>
        </div>

        <div>
          <label className="block text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-1.5">
            {t.messageLabel}
          </label>
          <textarea
            rows={2}
            value={message}
            onChange={(e) => onMessageChange(e.target.value)}
            placeholder={t.messagePlaceholder}
            className="w-full px-3.5 py-2 text-xs sm:text-sm border border-border bg-background rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-600 resize-none text-foreground"
          />
        </div>
      </div>
    </>
  );
}
