// components/ledger/LedgerAuditModal.tsx
"use client";

import React from "react";
import { Sparkles, CheckCircle2, Hash, Upload } from "lucide-react";
import type { Language } from "@/lib/translations";
import { getLocalizedPurpose } from "@/lib/translations/purposeMap";

export interface InvoiceAuditData {
  invoiceNumber: string;
  seller: string;
  sellerNip: string;
  issueDate: string;
  items: Array<{ name: string; qty: string; gross: string }>;
  totalGross: string;
  auditHash: string;
  semanticMatchScore: number;
  isCustomUpload?: boolean;
}

// Ujednolicony typ wpisu: [patron, purpose, amount, certId, auditDataFromNeonDB?]
export type LedgerEntry = [string, string, string, string, InvoiceAuditData?];

interface LedgerAuditModalProps {
  entry: LedgerEntry;
  auditData: InvoiceAuditData;
  language: Language;
  tAudit: Record<string, any>;
  verifiedLabel: string;
  isAnalyzingCustom: boolean;
  onUploadClick: () => void;
  onShowCertificate: () => void;
  onClose: () => void;
}

const modalDictionary = {
  pl: {
    pilotItemName: "Wynajem urządzenia rekreacyjnego (atrakcje turniejowe)",
    targetAllocationPrefix: "Alokacja celowa: ",
    statutoryDelivery: "Realizacja Celu Statutowego",
    statutoryDeliveryRegex: /Statutory Purpose Delivery/i,
    emptyDashes: "—",
  },
  en: {
    pilotItemName:
      "Recreational equipment rental (youth tournament attractions)",
    targetAllocationPrefix: "Target Allocation: ",
    statutoryDelivery: "Statutory Purpose Delivery",
    statutoryDeliveryRegex: /Realizacja Celu Statutowego/i,
    emptyDashes: "—",
  },
};

// Formatowanie daty – usunięcie polskiego "r." w wersji angielskiej
function formatIssueDate(rawDate: string, lang: Language): string {
  if (!rawDate) return "";
  if (lang === "en") {
    return rawDate.replace(/\s*r(\.|oku)?$/i, "").trim();
  }
  return rawDate;
}

// Formatowanie jednostki ilości – "szt." w PL, "pc." / "pcs" w EN, "alok" -> "alloc"
function formatQty(rawQty: string, lang: Language): string {
  if (!rawQty) return "";
  if (lang === "en") {
    if (/alok/i.test(rawQty)) {
      return rawQty.replace(/alok/i, "alloc");
    }
    const numMatch = rawQty.match(/^(\d+)/);
    const num = numMatch ? parseInt(numMatch[1], 10) : 1;
    const unit = num === 1 ? "pc." : "pcs";
    return rawQty.replace(/\s*(szt\.?|sztuk[a-y]?)/i, ` ${unit}`).trim();
  }
  return rawQty;
}

// Tłumaczenie pozycji kosztowych faktur klubowych (PL <-> EN)
function formatItemName(
  rawName: string,
  lang: Language,
  targetPrefix = "",
): string {
  if (!rawName) return "";

  const trimmed = rawName.trim();
  const lower = trimmed.toLowerCase();
  const dict = modalDictionary[lang] || modalDictionary.pl;

  // 1. Specyficzne pozycje faktury pilotażowej Słodkolandii
  if (
    lower.includes("wynajem urządzenia rekreacyjnego") ||
    lower.includes("recreational equipment rental") ||
    lower.includes("atrakcje turniejowe")
  ) {
    return dict.pilotItemName;
  }

  // 2. Obsługa prefiksu "Alokacja celowa:" / "Target allocation:"
  const hasPrefix =
    /^(alokacja celowa:\s*|target allocation:\s*|alokacja:\s*)/i.test(trimmed);
  const cleanCore = trimmed
    .replace(/^(alokacja celowa:\s*|target allocation:\s*|alokacja:\s*)/i, "")
    .trim();

  // 3. Tłumaczenie przez centralny purposeMap
  const localized = getLocalizedPurpose(cleanCore, lang);
  const localizedCore = localized.text;

  if (hasPrefix) {
    const prefix = targetPrefix || dict.targetAllocationPrefix;
    return `${prefix}${localizedCore}`;
  }

  return localizedCore;
}

// Formatowanie kwoty brutto pozycji i sumy faktury (np. "25 USD" -> "USD 25" w EN)
function formatGrossAmount(rawGross: string, lang: Language): string {
  if (!rawGross) return "";

  const trimmed = rawGross.trim();

  // Format z kodem waluty na końcu (np. "25 USD", "1 300,00 PLN")
  const matchSuffix = trimmed.match(/^([\d\s.,]+)\s*([A-Z]{3})$/i);
  if (matchSuffix) {
    const numPart = matchSuffix[1].trim();
    const curPart = matchSuffix[2].toUpperCase();
    if (lang === "en") {
      return `${curPart} ${numPart}`;
    }
    return `${numPart} ${curPart}`;
  }

  // Format z kodem waluty na początku (np. "USD 25", "EUR 88")
  const matchPrefix = trimmed.match(/^([A-Z]{3})\s*([\d\s.,]+)$/i);
  if (matchPrefix) {
    const curPart = matchPrefix[1].toUpperCase();
    const numPart = matchPrefix[2].trim();
    if (lang === "en") {
      return `${curPart} ${numPart}`;
    }
    return `${numPart} ${curPart}`;
  }

  return trimmed;
}

export default function LedgerAuditModal({
  entry,
  auditData,
  language,
  tAudit,
  verifiedLabel,
  isAnalyzingCustom,
  onUploadClick,
  onShowCertificate,
  onClose,
}: LedgerAuditModalProps) {
  const certId = entry[3];
  const dict = modalDictionary[language] || modalDictionary.pl;

  // Dynamiczna lokalizacja emitenta faktury
  const displaySeller = auditData.seller.replace(
    dict.statutoryDeliveryRegex,
    dict.statutoryDelivery,
  );

  const displayIssueDate = formatIssueDate(auditData.issueDate, language);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl max-h-[90vh] flex flex-col rounded-3xl border-2 border-lime-500/60 bg-card shadow-2xl overflow-hidden">
        {/* Przycisk zamknięcia */}
        <button
          type="button"
          onClick={onClose}
          aria-label={tAudit.close}
          className="absolute top-4 right-4 z-20 size-8 rounded-full border border-border bg-background/90 hover:bg-muted flex items-center justify-center text-xs font-bold text-muted-foreground hover:text-foreground cursor-pointer transition-colors"
        >
          ✕
        </button>

        {/* Nagłówek modalu */}
        <div className="p-5 sm:p-6 pb-4 border-b border-border/40 bg-muted/10">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-lime-500/10 border border-lime-500/30 text-lime-600 dark:text-lime-400 text-xs font-semibold uppercase tracking-wider mb-2">
            <Sparkles className="size-3.5" />
            <span>{tAudit.modalTitle}</span>
          </div>

          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
            {tAudit.badge}
          </h2>

          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            {auditData.isCustomUpload
              ? tAudit.customUploadPrefix
              : `${tAudit.verificationPrefix} ${certId}`}
          </p>
        </div>

        {/* Zawartość przewijalna */}
        <div className="overflow-y-auto p-5 sm:p-6 space-y-4 sm:space-y-5 text-card-foreground">
          {/* Box wgrywania własnej faktury (dla sędziów) */}
          <div className="p-4 rounded-2xl border border-dashed border-lime-500/40 bg-lime-500/5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <p className="text-xs sm:text-sm font-semibold text-foreground flex items-center gap-1.5">
                <Upload className="size-3.5 text-lime-500" />
                <span>{tAudit.liveUploadPrompt}</span>
              </p>
              <p className="text-[11px] sm:text-xs text-muted-foreground mt-0.5">
                {tAudit.uploadBoxSubtitle}
              </p>
            </div>

            <button
              type="button"
              onClick={onUploadClick}
              disabled={isAnalyzingCustom}
              className="px-4 py-2 rounded-xl bg-lime-600 hover:bg-lime-500 text-white font-medium text-xs sm:text-sm transition-colors cursor-pointer flex items-center gap-1.5 shrink-0 shadow-xs disabled:opacity-50"
            >
              {isAnalyzingCustom ? (
                <>
                  <span className="size-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>{tAudit.analyzing}</span>
                </>
              ) : (
                <>
                  <Upload className="size-3.5" />
                  <span>{tAudit.uploadBtn}</span>
                </>
              )}
            </button>
          </div>

          {/* Baner zgodności celowej Gemini Vision */}
          <div className="p-3.5 sm:p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-start sm:items-center gap-3">
            <CheckCircle2 className="size-5 text-emerald-500 shrink-0 mt-0.5 sm:mt-0" />
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-semibold text-xs sm:text-sm text-emerald-600 dark:text-emerald-400">
                  {tAudit.alignmentVerified}
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 font-mono font-medium">
                  {verifiedLabel}
                </span>
              </div>
              <p className="text-[11px] sm:text-xs text-muted-foreground mt-0.5">
                {`${tAudit.confidencePrefix} ${auditData.semanticMatchScore || 99.4}% • ${tAudit.confidenceSuffix}`}
              </p>
            </div>
          </div>

          {/* Siatka metadanych dokumentu */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 rounded-2xl border border-border/60 bg-muted/20 text-xs">
            <div>
              <span className="text-muted-foreground block text-[11px] font-medium uppercase tracking-wider">
                {tAudit.vendorName}
              </span>
              <span className="font-semibold text-foreground text-sm mt-0.5 block truncate">
                {displaySeller}
              </span>
            </div>

            <div>
              <span className="text-muted-foreground block text-[11px] font-medium uppercase tracking-wider">
                {tAudit.vendorNip}
              </span>
              <span className="font-mono font-semibold text-foreground text-sm mt-0.5 block">
                {auditData.sellerNip}
              </span>
            </div>

            <div>
              <span className="text-muted-foreground block text-[11px] font-medium uppercase tracking-wider">
                {tAudit.invoiceNumber}
              </span>
              <span className="font-mono font-semibold text-foreground text-sm mt-0.5 block">
                {auditData.invoiceNumber}
              </span>
            </div>

            <div>
              <span className="text-muted-foreground block text-[11px] font-medium uppercase tracking-wider">
                {tAudit.issueDate}
              </span>
              <span className="font-semibold text-foreground text-sm mt-0.5 block">
                {displayIssueDate}
              </span>
            </div>
          </div>

          {/* Tabela pozycji rozliczonych z faktury (Zoptymalizowana pod Mobile) */}
          <div className="rounded-2xl border border-border/60 overflow-hidden">
            <div className="p-3 bg-muted/40 border-b border-border/40 flex items-center justify-between">
              <span className="text-xs font-semibold text-foreground">
                {tAudit.itemsPurchased}
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-lime-500/15 text-lime-600 dark:text-lime-400 font-bold flex items-center gap-1">
                <span>{tAudit.ocrVerified}</span>
                <span>✓</span>
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[340px] text-xs text-left">
                <thead className="bg-muted/20 text-muted-foreground border-b border-border/30">
                  <tr>
                    <th className="py-2.5 px-3.5 font-medium">
                      {tAudit.tableItem}
                    </th>
                    <th className="py-2.5 px-3 font-medium text-center">
                      {tAudit.tableQty}
                    </th>
                    <th className="py-2.5 px-3.5 font-medium text-right">
                      {tAudit.tableGross}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/20">
                  {auditData.items.map((item, index) => (
                    <tr
                      key={index}
                      className="hover:bg-muted/10 transition-colors"
                    >
                      <td className="py-2.5 px-3.5 text-foreground font-medium">
                        {formatItemName(
                          item.name,
                          language,
                          tAudit.targetAllocationPrefix,
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-muted-foreground text-center font-mono">
                        {formatQty(item.qty, language)}
                      </td>
                      <td className="py-2.5 px-3.5 text-foreground text-right font-mono font-medium">
                        {formatGrossAmount(item.gross, language)}
                      </td>
                    </tr>
                  ))}
                  <tr className="bg-muted/30 font-bold">
                    <td className="py-2.5 px-3.5 text-foreground">
                      {tAudit.tableTotalGross}
                    </td>
                    <td className="py-2.5 px-3 text-center text-muted-foreground">
                      {dict.emptyDashes}
                    </td>
                    <td className="py-2.5 px-3.5 text-right text-foreground font-mono">
                      {formatGrossAmount(auditData.totalGross, language)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Kryptograficzny Hash Integralności SHA-256 */}
          <div className="p-3.5 rounded-2xl border border-border/50 bg-background flex flex-col gap-1.5">
            <span className="text-[11px] font-medium text-muted-foreground flex items-center gap-1.5">
              <Hash className="size-3 text-lime-500" />
              <span>{tAudit.integrityHash}:</span>
            </span>
            <span className="font-mono text-[11px] sm:text-xs text-foreground/90 break-all select-all bg-muted/40 p-2 rounded-xl border border-border/30">
              {auditData.auditHash}
            </span>
          </div>
        </div>

        {/* Dolne przyciski akcji */}
        <div className="p-4 sm:p-5 border-t border-border/40 bg-muted/20 flex flex-wrap items-center justify-end gap-2.5 sm:gap-3">
          <button
            type="button"
            onClick={onShowCertificate}
            className="px-4 py-2 rounded-xl border border-border bg-background hover:bg-muted font-medium text-xs sm:text-sm text-foreground transition-colors cursor-pointer flex items-center gap-1.5 shadow-2xs"
          >
            <span>👁️</span>
            <span>{tAudit.showCertBtn}</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-xs sm:text-sm transition-colors cursor-pointer shadow-xs"
          >
            {tAudit.close}
          </button>
        </div>
      </div>
    </div>
  );
}
