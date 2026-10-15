// components/agent/BarterAgreementModal.tsx
"use client";

import React, { useState } from "react";
import { Sparkles, Copy, Check, Download } from "lucide-react";
import type { Language } from "@/lib/translations";
import type { Currency } from "../checkout/types";

interface BarterAgreementModalProps {
  isOpen: boolean;
  onClose: () => void;
  language: Language;
  clubName: string;
  goal: string;
  inKindDetails?: string;
  detectedDomain?: string;
  amount: number;
  currency: Currency;
  barterTierName: string;
}

export default function BarterAgreementModal({
  isOpen,
  onClose,
  language,
  clubName,
  goal,
  inKindDetails,
  detectedDomain,
  amount,
  currency,
  barterTierName,
}: BarterAgreementModalProps) {
  const [copiedBarter, setCopiedBarter] = useState(false);

  if (!isOpen) return null;

  const partnerName =
    detectedDomain ||
    (language === "pl"
      ? "Partner Wspierający / Darczyńca Rzeczowy"
      : "In-Kind Corporate Partner");

  const barterAgreementText =
    language === "pl"
      ? `POROZUMIENIE O WSPÓŁPRACY BARTEROWEJ (MECENAT RZECZOWY)\n` +
        `Data: ${new Date().toLocaleDateString("pl-PL")}\n` +
        `------------------------------------------------------------------\n` +
        `Zawarte pomiędzy:\n` +
        `1. Uczniowskim Klubem Sportowym "${clubName}", reprezentowanym przez Zarząd Klubu,\n` +
        `a\n` +
        `2. Partnerem: ${partnerName}\n\n` +
        `§ 1. PRZEDMIOT ŚWIADCZENIA RZECZOWEGO\n` +
        `1. Partner zobowiązuje się do nieodpłatnego przekazania świadczenia na rzecz Klubu:\n` +
        `   "${inKindDetails || goal}".\n` +
        `2. Szacunkowy rynkowy ekwiwalent reklamowy (AVE) ustalony przez AI Barter Valuator:\n` +
        `   ${amount} ${currency}.\n\n` +
        `§ 2. ŚWIADCZENIA WZAJEMNE KLUBU (${barterTierName.toUpperCase()})\n` +
        `W zamian za wsparcie rzeczowe, Klub zapewnia:\n` +
        `• Umieszczenie logotypu i podziękowania na oficjalnej stronie oraz podczas zawodów,\n` +
        `• Dedykowany post sponsorski w mediach społecznościowych z oznaczeniem Partnera,\n` +
        `• Rejestrację w Publicznym Rejestrze Mecenasów PatronAI z certyfikatem weryfikacji.\n\n` +
        `§ 3. POSTANOWIENIA KOŃCOWE\n` +
        `Świadczenie służy bezpośredniemu wsparciu rozwoju sportowego dzieci i młodzieży.\n` +
        `Zatwierdzono cyfrowo w protokole PatronAI.`
      : `IN-KIND & BARTER SPONSORSHIP AGREEMENT\n` +
        `Date: ${new Date().toLocaleDateString("en-US")}\n` +
        `------------------------------------------------------------------\n` +
        `Concluded between:\n` +
        `1. ${clubName} Youth Sports Club, represented by the Board,\n` +
        `and\n` +
        `2. Corporate Partner: ${partnerName}\n\n` +
        `§ 1. SUBJECT OF IN-KIND PLEDGE\n` +
        `1. The Partner agrees to provide non-cash deliverables for the Club:\n` +
        `   "${inKindDetails || goal}".\n` +
        `2. Market value equivalence (AVE) assessed by AI Barter Valuator:\n` +
        `   ${amount} ${currency}.\n\n` +
        `§ 2. CLUB RECIPROCAL DELIVERABLES (${barterTierName.toUpperCase()})\n` +
        `In recognition of the in-kind support, the Club delivers:\n` +
        `• Logo placement across digital channels and tournament materials,\n` +
        `• Dedicated acknowledgment feature on social media,\n` +
        `• Permanent registration in the PatronAI Public Ledger with verified certificate.\n\n` +
        `§ 3. CLOSING TERMS\n` +
        `Contribution directly advances youth athletic development.\n` +
        `Authenticated electronically via PatronAI protocol.`;

  const handleCopyBarter = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(barterAgreementText).then(() => {
        setCopiedBarter(true);
        setTimeout(() => setCopiedBarter(false), 3000);
      });
    }
  };

  const handleDownloadBarter = () => {
    if (typeof window === "undefined") return;
    const blob = new Blob([barterAgreementText], {
      type: "text/plain;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download =
      language === "pl"
        ? `porozumienie-barterowe-${new Date().getFullYear()}.txt`
        : `barter-agreement-${new Date().getFullYear()}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl rounded-3xl border-2 border-purple-500/50 bg-card p-5 sm:p-7 shadow-2xl overflow-y-auto max-h-[90vh]">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 size-8 rounded-full border border-border bg-background hover:bg-muted flex items-center justify-center text-xs font-bold text-muted-foreground hover:text-foreground cursor-pointer transition-colors shadow-xs"
        >
          ✕
        </button>

        <div className="text-center pb-4 border-b border-border/70">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-purple-500/20 text-purple-900 dark:text-purple-200 border border-purple-500/40 mb-2">
            <Sparkles className="size-3" />
            <span>
              {language === "pl"
                ? "Porozumienie AI Barter Valuator"
                : "AI Barter Valuator Agreement"}
            </span>
          </div>
          <h3 className="text-xl sm:text-2xl font-black text-foreground">
            {language === "pl"
              ? "Szkic Porozumienia Barterowego"
              : "Barter Partnership Agreement"}
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            {clubName} • {barterTierName}
          </p>
        </div>

        <div className="mt-4">
          <div className="relative rounded-2xl border border-border/80 bg-background/80 p-4 text-[11px] sm:text-xs font-mono text-foreground leading-relaxed whitespace-pre-wrap max-h-72 overflow-y-auto [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-muted-foreground/25 [&::-webkit-scrollbar-track]:bg-transparent">
            {barterAgreementText}
          </div>
        </div>

        <div className="mt-5 pt-3 border-t border-border/70 flex flex-wrap justify-between gap-2">
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleCopyBarter}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-border bg-background hover:bg-accent text-xs font-semibold text-foreground transition-colors cursor-pointer"
            >
              {copiedBarter ? (
                <>
                  <Check className="size-3.5 text-emerald-500" />
                  <span className="text-emerald-700 dark:text-emerald-300">
                    {language === "pl" ? "Skopiowano!" : "Copied!"}
                  </span>
                </>
              ) : (
                <>
                  <Copy className="size-3.5" />
                  <span>
                    {language === "pl" ? "Kopiuj szkic" : "Copy Draft"}
                  </span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handleDownloadBarter}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-border bg-background hover:bg-accent text-xs font-semibold text-foreground transition-colors cursor-pointer"
            >
              <Download className="size-3.5" />
              <span>
                {language === "pl" ? "Pobierz .txt" : "Download .txt"}
              </span>
            </button>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs transition-colors cursor-pointer"
          >
            {language === "pl" ? "Zamknij" : "Close"}
          </button>
        </div>
      </div>
    </div>
  );
}
