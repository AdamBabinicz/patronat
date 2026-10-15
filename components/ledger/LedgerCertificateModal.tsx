// components/ledger/LedgerCertificateModal.tsx
"use client";

import React from "react";
import Link from "next/link";
import { FileCheck2, CheckCircle2 } from "lucide-react";
import type { Language } from "@/lib/translations";
import { getLocalizedPurpose } from "@/lib/translations/purposeMap";
import type { LedgerEntry } from "./LedgerAuditModal";

interface LedgerCertificateModalProps {
  entry: LedgerEntry;
  language: Language;
  tLedger: Record<string, any>;
  tCheckout: Record<string, any>;
  tAgent: Record<string, any>;
  onAuditClick: () => void;
  onClose: () => void;
}

export default function LedgerCertificateModal({
  entry,
  language,
  tLedger,
  tCheckout,
  tAgent,
  onAuditClick,
  onClose,
}: LedgerCertificateModalProps) {
  const [patron, rawPurpose, amount, certId] = entry;
  const {
    text: localizedPurpose,
    originalPl,
    wasTranslated,
  } = getLocalizedPurpose(rawPurpose, language);

  const handlePrint = () => {
    if (typeof window !== "undefined") {
      window.print();
    }
  };

  const qrTargetUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/certyfikat/${encodeURIComponent(certId)}`
      : `https://patronat.vercel.app/certyfikat/${encodeURIComponent(certId)}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/65 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg max-h-[90vh] flex flex-col rounded-3xl border-2 border-amber-500/40 bg-card shadow-2xl overflow-hidden">
        {/* Przycisk zamknięcia */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 z-20 size-8 rounded-full border border-border bg-background/90 hover:bg-muted flex items-center justify-center text-xs font-bold text-muted-foreground hover:text-foreground cursor-pointer shadow-xs"
          aria-label={tAgent.close}
        >
          ✕
        </button>

        <div className="flex-1 overflow-y-auto p-5 sm:p-8 space-y-4 [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-muted-foreground/25 [&::-webkit-scrollbar-track]:bg-transparent">
          {/* Nagłówek certyfikatu */}
          <div className="text-center pb-4 border-b border-border/70 pr-8 sm:pr-0">
            <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest bg-amber-500/15 text-amber-800 dark:text-amber-300 border border-amber-500/30 mb-2">
              <span>★</span>
              <span>{tCheckout.certificateBadge}</span>
              <span>★</span>
            </div>
            <h3 className="text-xl sm:text-2xl font-black text-foreground">
              {tAgent.certificate}
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              {tAgent.clubName} • {certId}
            </p>
          </div>

          {/* Szczegóły alokacji */}
          <div className="space-y-3 text-xs sm:text-sm">
            <div className="flex justify-between py-1.5 border-b border-border/50">
              <span className="text-muted-foreground">{tLedger.patron}:</span>
              <span className="font-bold text-foreground">{patron}</span>
            </div>

            <div className="flex justify-between items-start py-1.5 border-b border-border/50 gap-4">
              <span className="text-muted-foreground shrink-0">
                {tLedger.purpose}:
              </span>
              <div className="text-right max-w-xs space-y-0.5">
                <span className="font-semibold text-foreground block">
                  {localizedPurpose}
                </span>
                {language === "en" && wasTranslated && originalPl && (
                  <span className="text-[10px] text-muted-foreground italic block">
                    (PL: {originalPl})
                  </span>
                )}
              </div>
            </div>

            <div className="flex justify-between py-1.5 border-b border-border/50">
              <span className="text-muted-foreground">{tLedger.amount}:</span>
              <span className="font-black text-emerald-800 dark:text-emerald-300 text-base whitespace-nowrap">
                {amount}
              </span>
            </div>

            <div className="flex justify-between py-1.5 border-b border-border/50">
              <span className="text-muted-foreground">{tLedger.status}:</span>
              <span className="font-bold text-emerald-800 dark:text-emerald-400 whitespace-nowrap">
                {tLedger.verified}
              </span>
            </div>
          </div>

          {/* Podpisy oficjalne oraz kod QR weryfikacji */}
          <div className="pt-3 border-t border-border/60 flex items-center justify-between gap-4">
            <div className="space-y-1 text-left">
              <div className="h-0.5 w-20 bg-border mb-1" />
              <span className="text-[10px] font-bold text-foreground block">
                {tCheckout.signatureClub}
              </span>
              <span className="text-[10px] font-bold text-primary block">
                {tCheckout.signatureAgent}
              </span>
            </div>

            {/* Kafelek z kodem QR */}
            <div className="flex items-center gap-2.5 p-2 rounded-2xl bg-white text-stone-950 border border-border shadow-xs shrink-0">
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=${encodeURIComponent(
                  qrTargetUrl,
                )}&format=svg`}
                alt="Certyfikat QR Code"
                className="size-14 rounded-md"
                loading="lazy"
              />
              <div className="text-left text-[9px] leading-tight space-y-0.5">
                <div className="font-black uppercase tracking-wider flex items-center gap-0.5 text-emerald-700">
                  <CheckCircle2 className="size-2.5" />
                  <span>{language === "pl" ? "Weryfikacja" : "Verify"}</span>
                </div>
                <p className="text-stone-600 font-mono">
                  {language === "pl" ? "Skanuj aparatem" : "Scan with phone"}
                </p>
                <span className="font-bold text-[8.5px] text-stone-500 block truncate max-w-[80px]">
                  {certId}
                </span>
              </div>
            </div>
          </div>

          {/* Dolne przyciski akcji */}
          <div className="pt-4 border-t border-border/60 flex flex-wrap justify-between gap-2">
            <button
              type="button"
              onClick={onAuditClick}
              className="px-3.5 py-2 rounded-xl border border-lime-500/40 bg-lime-400/10 hover:bg-lime-400/20 text-xs font-bold text-lime-800 dark:text-lime-300 transition-colors flex items-center gap-1.5 cursor-pointer shrink-0 whitespace-nowrap"
            >
              <FileCheck2 className="size-3.5" />
              <span>
                {language === "pl" ? "Audyt faktury AI" : "AI Invoice Audit"}
              </span>
            </button>

            <button
              type="button"
              onClick={handlePrint}
              className="px-3.5 py-2 rounded-xl bg-primary text-primary-foreground font-semibold text-xs hover:opacity-90 transition-all flex items-center gap-1.5 cursor-pointer shrink-0 whitespace-nowrap"
            >
              <span>🖨️</span>
              <span>{tCheckout.printBtn}</span>
            </button>

            <Link
              href={`/certyfikat/${encodeURIComponent(certId)}`}
              className="px-3.5 py-2 rounded-xl border border-border bg-background text-foreground font-semibold text-xs hover:bg-muted transition-colors flex items-center gap-1 shrink-0 whitespace-nowrap"
            >
              <span>↗</span>
              <span>{language === "pl" ? "Strona" : "Page"}</span>
            </Link>

            <button
              type="button"
              onClick={onClose}
              className="px-3 py-2 rounded-xl border border-border/80 bg-background text-muted-foreground hover:text-foreground font-medium text-xs transition-colors cursor-pointer shrink-0 whitespace-nowrap"
            >
              {tAgent.close}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
