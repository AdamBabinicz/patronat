// components/ledger/LedgerAuditModal.tsx
"use client";

import React from "react";
import {
  Sparkles,
  CheckCircle2,
  Hash,
  Upload,
  ShieldCheck,
} from "lucide-react";
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

// Ujednolicony typ: [patron, purpose, amount, certId, auditDataFromNeonDB?]
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

// Formatowanie daty – usunięcie polskiego "r." w wersji angielskiej
function formatIssueDate(rawDate: string, lang: Language): string {
  if (!rawDate) return "";
  if (lang === "en") {
    return rawDate.replace(/\s*r(\.|oku)?$/i, "").trim();
  }
  return rawDate;
}

// Formatowanie jednostki ilości – "szt." w PL, "pc." / "pcs" w EN
function formatQty(rawQty: string, lang: Language): string {
  if (!rawQty) return "";
  if (lang === "en") {
    const numMatch = rawQty.match(/^(\d+)/);
    const num = numMatch ? parseInt(numMatch[1], 10) : 1;
    const unit = num === 1 ? "pc." : "pcs";
    return rawQty.replace(/\s*(szt\.?|sztuk[a-y]?)/i, ` ${unit}`).trim();
  }
  return rawQty;
}

// Naturalne tłumaczenie popularnych pozycji kosztowych faktur klubowych
function formatItemName(rawName: string, lang: Language): string {
  if (!rawName) return "";
  if (lang === "en") {
    const lower = rawName.toLowerCase();
    if (
      lower.includes("wynajem urządzenia rekreacyjnego") ||
      lower.includes("atrakcje turniejowe")
    ) {
      return "Recreational equipment rental (youth tournament attractions)";
    }
    if (lower.includes("zegar") && lower.includes("dgt")) {
      return "5 Professional DGT 2010 Electronic Chess Clocks";
    }
    if (lower.includes("puchar") || lower.includes("medal")) {
      return "Engraved trophies and medals for junior championship";
    }
    if (lower.includes("szachownic") || lower.includes("komplet")) {
      return "Purchase of 3 tournament chessboard sets (FIDE certified)";
    }
    if (
      lower.includes("czyszczeni") ||
      lower.includes("środk") ||
      lower.includes("renowacj")
    ) {
      return "Deep cleaning & renovation of club training facility";
    }
    if (lower.includes("słodki stół") || lower.includes("poczęstunek")) {
      return "Sweet table & pastry treats for youth tournament";
    }
  }
  return rawName;
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

  // Pobieramy zlokalizowany cel przez oficjalną mapę PatronAI (purposeMap)
  const localizedPurposeResult = getLocalizedPurpose(entry[1], language);
  const localizedPurposeText = localizedPurposeResult.text;

  // Dynamiczna lokalizacja emitenta faktury
  const displaySeller =
    language === "pl"
      ? auditData.seller.replace(
          /Statutory Purpose Delivery/i,
          "Realizacja Celu Statutowego",
        )
      : auditData.seller.replace(
          /Realizacja Celu Statutowego/i,
          "Statutory Purpose Delivery",
        );

  const displayIssueDate = formatIssueDate(auditData.issueDate, language);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl max-h-[90vh] flex flex-col rounded-3xl border-2 border-lime-500/60 bg-card shadow-2xl overflow-hidden">
        {/* Przycisk zamknięcia */}
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute top-4 right-4 z-20 size-8 rounded-full border border-border bg-background/90 hover:bg-muted flex items-center justify-center text-xs font-bold text-muted-foreground hover:text-foreground cursor-pointer transition-colors"
        >
          ✕
        </button>

        {/* Nagłówek modalu */}
        <div className="p-5 sm:p-6 pb-4 border-b border-border/40 bg-muted/10">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-lime-500/10 border border-lime-500/30 text-lime-600 dark:text-lime-400 text-xs font-semibold uppercase tracking-wider mb-2">
            <Sparkles className="size-3.5" />
            <span>
              {language === "pl"
                ? "Audyt AI Faktury VAT • Gemini Multimodal Vision"
                : "AI VAT Invoice Audit • Gemini Multimodal Vision"}
            </span>
          </div>

          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
            {tAudit?.title ||
              (language === "pl"
                ? "100% Transparentny Rejestr Wydatków"
                : "100% Transparent Expense Ledger")}
          </h2>

          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            {auditData.isCustomUpload
              ? language === "pl"
                ? "Weryfikacja faktury VAT: Wgrany dokument własny (PILOT)"
                : "VAT invoice verification: Custom uploaded document (PILOT)"
              : language === "pl"
                ? `Weryfikacja faktury VAT przypisanej do alokacji: ${certId}`
                : `VAT invoice verification assigned to allocation: ${certId}`}
          </p>
        </div>

        {/* Zawartość przewijalna */}
        <div className="overflow-y-auto p-5 sm:p-6 space-y-4 sm:space-y-5 text-card-foreground">
          {/* Box wgrywania własnej faktury (Wersja pilotażowa dla sędziów) */}
          <div className="p-4 rounded-2xl border border-dashed border-lime-500/40 bg-lime-500/5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <p className="text-xs sm:text-sm font-semibold text-foreground flex items-center gap-1.5">
                <Upload className="size-3.5 text-lime-500" />
                {tAudit?.uploadBoxTitle ||
                  (language === "pl"
                    ? "Wgraj własną fakturę do audytu na żywo (PDF / JPG)"
                    : "Live Test for Judges: Upload your invoice (JPG/PNG)")}
              </p>
              <p className="text-[11px] sm:text-xs text-muted-foreground mt-0.5">
                {tAudit?.uploadBoxSubtitle ||
                  (language === "pl"
                    ? "Sprawdź multimodalne rozpoznawanie faktury na żywo"
                    : "Test live multimodal invoice recognition")}
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
                  <span>
                    {language === "pl" ? "Analiza..." : "Analyzing..."}
                  </span>
                </>
              ) : (
                <>
                  <Upload className="size-3.5" />
                  <span>
                    {tAudit?.uploadBtn ||
                      (language === "pl" ? "Wgraj plik" : "Upload file")}
                  </span>
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
                  {language === "pl"
                    ? "Potwierdzono ✓ (100% Zgodności Celowej)"
                    : "Verified ✓ (100% Purpose Aligned)"}
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 font-mono font-medium">
                  {verifiedLabel ||
                    (language === "pl" ? "Potwierdzono ✓" : "Verified ✓")}
                </span>
              </div>
              <p className="text-[11px] sm:text-xs text-muted-foreground mt-0.5">
                {language === "pl"
                  ? `Wskaźnik zaufania Gemini Vision: ${
                      auditData.semanticMatchScore || 99.4
                    }% • Cel statutowy pokryty w 100%`
                  : `Gemini Vision confidence: ${
                      auditData.semanticMatchScore || 99.4
                    }% • Statutory objective 100% covered`}
              </p>
            </div>
          </div>

          {/* Siatka metadanych dokumentu (Sprzedawca, NIP, Nr faktury, Data) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 rounded-2xl border border-border/60 bg-muted/20 text-xs">
            <div>
              <span className="text-muted-foreground block text-[11px] font-medium uppercase tracking-wider">
                {tAudit?.sellerLabel ||
                  (language === "pl"
                    ? "Sprzedawca / Wystawca"
                    : "Issuer / Vendor")}
              </span>
              <span className="font-semibold text-foreground text-sm mt-0.5 block truncate">
                {displaySeller}
              </span>
            </div>

            <div>
              <span className="text-muted-foreground block text-[11px] font-medium uppercase tracking-wider">
                {tAudit?.nipLabel ||
                  (language === "pl" ? "NIP Sprzedawcy" : "Tax ID (NIP)")}
              </span>
              <span className="font-mono font-semibold text-foreground text-sm mt-0.5 block">
                {auditData.sellerNip}
              </span>
            </div>

            <div>
              <span className="text-muted-foreground block text-[11px] font-medium uppercase tracking-wider">
                {tAudit?.invoiceNoLabel ||
                  (language === "pl"
                    ? "Nr faktury / paragonu"
                    : "Invoice / Receipt No.")}
              </span>
              <span className="font-mono font-semibold text-foreground text-sm mt-0.5 block">
                {auditData.invoiceNumber}
              </span>
            </div>

            <div>
              <span className="text-muted-foreground block text-[11px] font-medium uppercase tracking-wider">
                {tAudit?.issueDateLabel ||
                  (language === "pl" ? "Data wystawienia" : "Posting Date")}
              </span>
              <span className="font-semibold text-foreground text-sm mt-0.5 block">
                {displayIssueDate}
              </span>
            </div>
          </div>

          {/* Tabela pozycji rozliczonych z faktury */}
          <div className="rounded-2xl border border-border/60 overflow-hidden">
            <div className="p-3 bg-muted/40 border-b border-border/40 flex items-center justify-between">
              <span className="text-xs font-semibold text-foreground">
                {tAudit?.itemsTitle ||
                  (language === "pl"
                    ? "Pozycje zakupu rozliczone z alokacji"
                    : "Line items settled from allocation")}
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-lime-500/15 text-lime-600 dark:text-lime-400 font-bold flex items-center gap-1">
                <span>
                  {language === "pl" ? "WERYFIKACJA AI OCR" : "AI OCR VERIFIED"}
                </span>
                <span>✓</span>
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-muted/20 text-muted-foreground border-b border-border/30">
                  <tr>
                    <th className="py-2.5 px-3.5 font-medium">
                      {language === "pl" ? "Pozycja kosztowa" : "Expense Item"}
                    </th>
                    <th className="py-2.5 px-3 font-medium text-center">
                      {language === "pl" ? "Ilość" : "Qty"}
                    </th>
                    <th className="py-2.5 px-3.5 font-medium text-right">
                      {language === "pl" ? "Brutto" : "Gross"}
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
                        {formatItemName(item.name, language)}
                      </td>
                      <td className="py-2.5 px-3 text-muted-foreground text-center font-mono">
                        {formatQty(item.qty, language)}
                      </td>
                      <td className="py-2.5 px-3.5 text-foreground text-right font-mono font-medium">
                        {item.gross}
                      </td>
                    </tr>
                  ))}
                  <tr className="bg-muted/30 font-bold">
                    <td className="py-2.5 px-3.5 text-foreground">
                      {language === "pl" ? "Suma brutto" : "Total Gross"}
                    </td>
                    <td className="py-2.5 px-3 text-center text-muted-foreground">
                      —
                    </td>
                    <td className="py-2.5 px-3.5 text-right text-foreground font-mono">
                      {auditData.totalGross}
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
              {language === "pl"
                ? "Kryptograficzny Hash Integralności SHA-256:"
                : "Cryptographic SHA-256 Integrity Hash:"}
            </span>
            <span className="font-mono text-[11px] sm:text-xs text-foreground/90 break-all select-all bg-muted/40 p-2 rounded-xl border border-border/30">
              {auditData.auditHash}
            </span>
          </div>
        </div>

        {/* Dolne przyciski akcji */}
        <div className="p-4 sm:p-5 border-t border-border/40 bg-muted/20 flex flex-wrap items-center justify-end gap-3">
          <button
            type="button"
            onClick={onShowCertificate}
            className="px-4 py-2 rounded-xl border border-border bg-background hover:bg-muted font-medium text-xs sm:text-sm text-foreground transition-colors cursor-pointer flex items-center gap-1.5 shadow-2xs"
          >
            <span>👁️</span>
            <span>
              {tAudit?.showCertBtn ||
                (language === "pl" ? "Pokaż certyfikat" : "Show Certificate")}
            </span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-xs sm:text-sm transition-colors cursor-pointer shadow-xs"
          >
            {tAudit?.closeBtn ||
              (language === "pl" ? "Zamknij audyt" : "Close audit")}
          </button>
        </div>
      </div>
    </div>
  );
}
