// components/ledger/LedgerAuditModal.tsx
"use client";

import React from "react";
import { Sparkles, CheckCircle2, Hash, Upload } from "lucide-react";
import type { Language } from "@/lib/translations";

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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl max-h-[90vh] flex flex-col rounded-3xl border-2 border-lime-500/60 bg-card shadow-2xl overflow-hidden">
        {/* Przycisk zamknięcia */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 z-20 size-8 rounded-full border border-border bg-background/90 hover:bg-muted flex items-center justify-center text-xs font-bold text-muted-foreground hover:text-foreground cursor-pointer transition-colors shadow-xs"
          aria-label={tAudit.close}
        >
          ✕
        </button>

        <div className="flex-1 overflow-y-auto p-4 sm:p-7 space-y-3.5 [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-muted-foreground/25 [&::-webkit-scrollbar-track]:bg-transparent">
          {/* Nagłówek modala */}
          <div className="text-center pb-3.5 border-b border-border/70 pr-9 sm:pr-0 pl-1">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-lime-400/20 text-lime-800 dark:text-lime-300 border border-lime-400/40 mb-2">
              <Sparkles className="size-3 shrink-0" />
              <span>{tAudit.modalTitle}</span>
            </div>
            <h3 className="text-lg sm:text-2xl font-black text-foreground leading-tight">
              {tAudit.badge}
            </h3>
            <p className="text-xs text-muted-foreground mt-1 break-words">
              {language === "pl"
                ? "Weryfikacja faktury VAT przypisanej do alokacji: "
                : "VAT invoice verification linked to allocation: "}
              <span className="font-mono font-bold text-foreground whitespace-nowrap">
                {certId}
              </span>
            </p>
          </div>

          {/* Boks wgrywania własnej faktury na żywo */}
          <div className="p-3 rounded-2xl bg-lime-500/10 border border-lime-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
            <div className="text-xs">
              <span className="font-bold text-foreground block">
                {tAudit.liveUploadPrompt}
              </span>
              <span className="text-[11px] text-muted-foreground block">
                {language === "pl"
                  ? "Sprawdź multimodalne rozpoznawanie faktury na żywo"
                  : "Test live multimodal invoice recognition"}
              </span>
            </div>
            <button
              type="button"
              onClick={onUploadClick}
              disabled={isAnalyzingCustom}
              className="self-start sm:self-auto px-3.5 py-1.5 rounded-xl bg-lime-400 hover:bg-lime-500 text-stone-950 font-black text-xs transition-all shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50 shrink-0 whitespace-nowrap"
            >
              {isAnalyzingCustom ? (
                <>
                  <span className="size-3 border-2 border-stone-950 border-t-transparent rounded-full animate-spin" />
                  <span>{tAudit.analyzingDocument}</span>
                </>
              ) : (
                <>
                  <Upload className="size-3.5" />
                  <span>
                    {language === "pl" ? "Wgraj plik" : "Upload file"}
                  </span>
                </>
              )}
            </button>
          </div>

          {/* Status audytu Gemini Vision */}
          <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <CheckCircle2 className="size-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <div className="min-w-0">
                <div className="text-xs font-black uppercase tracking-wider text-emerald-800 dark:text-emerald-300">
                  {tAudit.alignmentVerified}
                </div>
                <div className="text-[11px] text-muted-foreground leading-snug">
                  {language === "pl"
                    ? `Wskaźnik zaufania Gemini Vision: ${auditData.semanticMatchScore}% • Cel pokryty w 100%`
                    : `Gemini Vision confidence: ${auditData.semanticMatchScore}% • Goal fully covered`}
                </div>
              </div>
            </div>
            <span className="hidden sm:inline-flex px-2.5 py-1 rounded-md bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 text-[11px] font-bold shrink-0 whitespace-nowrap">
              {verifiedLabel}
            </span>
          </div>

          {/* Dane sprzedawcy i dokumentu */}
          <div className="space-y-2 text-xs">
            <div className="grid grid-cols-2 gap-2 p-3 rounded-xl bg-muted/40 border border-border/60">
              <div>
                <span className="text-[10px] uppercase font-bold text-muted-foreground block">
                  {tAudit.vendorName}
                </span>
                <span className="font-bold text-foreground break-words">
                  {auditData.seller}
                </span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-muted-foreground block">
                  {tAudit.vendorNip}
                </span>
                <span className="font-mono text-foreground">
                  {auditData.sellerNip}
                </span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-muted-foreground block">
                  {tAudit.invoiceNumber}
                </span>
                <span className="font-mono font-bold text-foreground">
                  {auditData.invoiceNumber}
                </span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-muted-foreground block">
                  {tAudit.issueDate}
                </span>
                <span className="text-foreground">{auditData.issueDate}</span>
              </div>
            </div>

            {/* Tabela pozycji */}
            <div className="mt-3">
              <div className="text-[11px] uppercase font-bold text-muted-foreground mb-1.5 flex items-center justify-between gap-2">
                <span className="truncate">{tAudit.itemsPurchased}</span>
                <span className="shrink-0 whitespace-nowrap inline-flex items-center gap-1 text-[10px] font-mono font-bold text-lime-700 dark:text-lime-400">
                  <span>
                    {language === "pl"
                      ? "WERYFIKACJA AI OCR"
                      : "AI OCR VERIFIED"}
                  </span>
                  <span className="text-emerald-500 dark:text-emerald-400 font-black">
                    ✓
                  </span>
                </span>
              </div>
              <div className="rounded-xl border border-border overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-muted/60 text-[10px] uppercase text-muted-foreground">
                    <tr>
                      <th className="p-2 font-bold">
                        {language === "pl"
                          ? "Pozycja kosztowa"
                          : "Expense Item"}
                      </th>
                      <th className="p-2 font-bold text-center">
                        {language === "pl" ? "Ilość" : "Qty"}
                      </th>
                      <th className="p-2 font-bold text-right">
                        {language === "pl" ? "Brutto" : "Gross"}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60">
                    {auditData.items.map((item, i) => (
                      <tr key={i} className="hover:bg-muted/20">
                        <td className="p-2 text-foreground font-medium break-words">
                          {item.name}
                        </td>
                        <td className="p-2 text-muted-foreground text-center font-mono whitespace-nowrap">
                          {item.qty}
                        </td>
                        <td className="p-2 text-right font-black text-emerald-800 dark:text-emerald-300 font-mono whitespace-nowrap">
                          {item.gross}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Hash Integralności SHA-256 */}
            <div className="mt-3 p-2.5 rounded-xl bg-background border border-border/80 flex items-center justify-between gap-2 text-[10px]">
              <div className="flex items-center gap-1.5 text-muted-foreground shrink-0">
                <Hash className="size-3.5 text-primary shrink-0" />
                <span className="truncate max-w-[130px] sm:max-w-none">
                  {tAudit.integrityHash}:
                </span>
              </div>
              <span className="font-mono text-foreground font-semibold truncate max-w-[140px] sm:max-w-xs text-right">
                {auditData.auditHash}
              </span>
            </div>
          </div>

          {/* Dolne przyciski akcji */}
          <div className="pt-3 border-t border-border/70 flex justify-between gap-2">
            <button
              type="button"
              onClick={onShowCertificate}
              className="px-3.5 py-2 rounded-xl border border-border bg-background hover:bg-muted text-xs font-semibold text-foreground transition-colors cursor-pointer flex items-center gap-1.5 shrink-0 whitespace-nowrap"
            >
              <span>👁️</span>
              <span>
                {language === "pl" ? "Pokaż certyfikat" : "Show Certificate"}
              </span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-lime-400 text-stone-950 font-bold text-xs hover:bg-lime-500 transition-colors cursor-pointer shrink-0 whitespace-nowrap"
            >
              {tAudit.close}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
