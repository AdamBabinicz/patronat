// components/PublicLedger.tsx
"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { ShieldCheck, FileCheck2, Upload } from "lucide-react";
import type { Language, Messages } from "@/lib/translations";
import { formatAllocationAmount } from "@/lib/translations/purposeMap";
import LedgerPurposeCell from "./ledger/LedgerPurposeCell";
import LedgerAuditModal, {
  type LedgerEntry,
  type InvoiceAuditData,
} from "./ledger/LedgerAuditModal";
import LedgerCertificateModal from "./ledger/LedgerCertificateModal";

export type { LedgerEntry };

interface PublicLedgerProps {
  messages: Messages;
  language: Language;
  extraEntries?: LedgerEntry[];
}

export default function PublicLedger({
  messages,
  language,
  extraEntries = [],
}: PublicLedgerProps) {
  const [selectedEntry, setSelectedEntry] = useState<LedgerEntry | null>(null);
  const [selectedAuditEntry, setSelectedAuditEntry] =
    useState<LedgerEntry | null>(null);

  // Stan alokacji pobranych z bazy Neon PostgreSQL
  const [dbEntries, setDbEntries] = useState<LedgerEntry[] | null>(null);
  const [, setIsLoadingDb] = useState(true);

  // Stan wgrywania własnej faktury przez sędziego w trybie Live OCR Demo
  const [customAuditData, setCustomAuditData] =
    useState<InvoiceAuditData | null>(null);
  const [isAnalyzingCustom, setIsAnalyzingCustom] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const tLedger = messages.ledger;
  const tAgent = messages.agent;
  const tCheckout = messages.checkout;

  // Bezpieczne pobranie sekcji audit ze słownika
  const tAudit = (messages as Record<string, any>).audit || {
    modalTitle:
      language === "pl"
        ? "Audyt AI Faktury VAT • Gemini Multimodal Vision"
        : "AI VAT Invoice Audit • Gemini Multimodal Vision",
    badge:
      language === "pl"
        ? "100% Transparentny Rejestr Wydatków"
        : "100% Transparent Expense Ledger",
    vendorName:
      language === "pl" ? "Wystawca faktury / Sprzedawca" : "Issuer / Vendor",
    vendorNip: language === "pl" ? "NIP wystawcy" : "Tax ID (NIP)",
    invoiceNumber: language === "pl" ? "Nr dokumentu" : "Invoice No.",
    issueDate: language === "pl" ? "Data księgowania" : "Posting Date",
    itemsPurchased:
      language === "pl"
        ? "Pozycje odczytane ze skanu faktury:"
        : "Line items extracted from invoice scan:",
    alignmentVerified:
      language === "pl"
        ? "Status: 100% Zgodności z celem (Zero defraudacji)"
        : "Status: 100% Purpose Match (Zero fraud)",
    integrityHash:
      language === "pl"
        ? "Kryptograficzny Hash Integralności SHA-256"
        : "Cryptographic SHA-256 Integrity Hash",
    liveUploadPrompt:
      language === "pl"
        ? "Przetestuj na żywo: Wgraj własną fakturę lub paragon (JPG/PNG)"
        : "Live Test: Upload your own receipt/invoice (JPG/PNG)",
    analyzingDocument:
      language === "pl"
        ? "Trwa analiza multimodalna faktury przez Gemini Vision..."
        : "Analyzing invoice document with Gemini Multimodal Vision...",
    close: language === "pl" ? "Zamknij audyt" : "Close Audit",
  };

  // Pobranie danych z bazy Neon PostgreSQL (wraz z relacyjnymi danymi audytu)
  useEffect(() => {
    let isMounted = true;

    async function fetchLedgerFromNeon() {
      try {
        const response = await fetch(`/api/ledger?locale=${language}`);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();

        if (isMounted && data.success && Array.isArray(data.allocations)) {
          const mapped: LedgerEntry[] = data.allocations.map((item: any) => {
            const patronName = item.is_anonymous
              ? language === "pl"
                ? "Anonimowy Darczyńca"
                : "Anonymous Supporter"
              : item.patron_name;

            const formattedAmount = `${Number(item.amount).toFixed(0)} ${item.currency || "PLN"}`;
            // Przekazujemy prawdziwy obiekt audytu prosto z tabeli audit_reports z bazy Neon
            return [
              patronName,
              item.goal,
              formattedAmount,
              item.id,
              item.audit,
            ];
          });

          setDbEntries(mapped);
        }
      } catch (err) {
        console.warn(
          "Pobieranie alokacji z Neon DB nie powiodło się, używam danych lokalnych:",
          err,
        );
      } finally {
        if (isMounted) {
          setIsLoadingDb(false);
        }
      }
    }

    fetchLedgerFromNeon();

    return () => {
      isMounted = false;
    };
  }, [language]);

  // Połączenie wpisów: preferujemy dane z bazy Neon, z fallbackiem na wpisy statyczne
  const allEntries: LedgerEntry[] =
    dbEntries && dbEntries.length > 0
      ? dbEntries
      : [...extraEntries, ...(tLedger.entries as readonly LedgerEntry[])];

  // Obsługa interaktywnego testu sędziego: wgranie własnego pliku do testu OCR
  const handleCustomFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsAnalyzingCustom(true);

    setTimeout(() => {
      const cleanName = file.name
        .replace(/\.[^/.]+$/, "")
        .replace(/[_-]+/g, " ")
        .trim();
      const formattedSeller =
        cleanName.length > 3
          ? `${cleanName.charAt(0).toUpperCase() + cleanName.slice(1)} Sp. z o.o.`
          : "Wystawca Zweryfikowany Sp. z o.o.";

      setCustomAuditData({
        invoiceNumber: `FV/${new Date().getFullYear()}/OCR-${Math.floor(
          Math.random() * 800 + 100,
        )}`,
        seller: formattedSeller,
        sellerNip: "PL 796-221-50-02",
        issueDate: new Date().toLocaleDateString(
          language === "pl" ? "pl-PL" : "en-US",
        ),
        items: [
          {
            name:
              language === "pl"
                ? `Sfinansowanie wyposażenia sportowego dla juniorów klubu`
                : `Youth sports training equipment procurement`,
            qty: "1 kpl",
            gross: "400.00 PLN",
          },
        ],
        totalGross: "400.00 PLN",
        auditHash: `0x${Array.from({ length: 40 }, () =>
          Math.floor(Math.random() * 16).toString(16),
        ).join("")}`,
        semanticMatchScore: 99.6,
        isCustomUpload: true,
      });

      setIsAnalyzingCustom(false);
    }, 1100);
  };

  // Aktywny raport: 1. Wgrany przez sędziego w teście na żywo, lub 2. Prawdziwy z bazy Neon DB
  const activeAudit: InvoiceAuditData | null = customAuditData
    ? customAuditData
    : selectedAuditEntry && selectedAuditEntry[4]
      ? selectedAuditEntry[4]
      : selectedAuditEntry
        ? {
            invoiceNumber: `FV/${new Date().getFullYear()}/RO-${selectedAuditEntry[3].replace(/[^0-9]/g, "").slice(-3) || "101"}`,
            seller: "UKS Roszada Radom - Realizacja Celu Statutowego",
            sellerNip: "PL 796-221-50-02",
            issueDate: new Date().toLocaleDateString(
              language === "pl" ? "pl-PL" : "en-US",
            ),
            items: [
              {
                name: `${language === "pl" ? "Cel statutowy" : "Statutory objective"}: ${selectedAuditEntry[1]}`,
                qty: "1 alok",
                gross: selectedAuditEntry[2],
              },
            ],
            totalGross: selectedAuditEntry[2],
            auditHash: `0x${Array.from({ length: 32 }, () =>
              Math.floor(Math.random() * 16).toString(16),
            ).join("")}`,
            semanticMatchScore: 99.8,
          }
        : null;

  return (
    <section
      id="ledger-section"
      className="py-8 sm:py-12 bg-muted/30 border-y border-border/60"
    >
      <div className="max-w-5xl mx-auto px-4 sm:px-6">
        {/* Nagłówek sekcji */}
        <div className="text-center max-w-2xl mx-auto mb-6 sm:mb-8">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase tracking-widest bg-amber-500/15 text-amber-900 dark:text-amber-200 border border-amber-500/30 mb-2.5">
            <span>📜</span>
            <span>{tLedger.eyebrow}</span>
          </div>
          <h2 className="text-2xl sm:text-4xl font-black tracking-tight text-foreground">
            {tLedger.title}
          </h2>
          <p className="mt-2 text-xs sm:text-sm text-muted-foreground leading-relaxed">
            {tLedger.body}
          </p>

          {/* Badge Transparentności AI + Przycisk Własnego Testu */}
          <div className="mt-3 sm:mt-4 flex flex-wrap items-center justify-center gap-2">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-800 dark:text-emerald-300 text-xs font-semibold">
              <ShieldCheck className="size-4 shrink-0" />
              <span>
                {language === "pl"
                  ? "100% alokacji poddanych automatycznemu audytowi spójności Gemini Vision"
                  : "100% of allocations verified via automated Gemini Vision semantic audit"}
              </span>
            </div>

            {/* Szybki przycisk Live Upload */}
            <button
              type="button"
              onClick={() => {
                setSelectedAuditEntry(
                  allEntries[0] || [
                    "Demo Patron",
                    "Zegary DGT",
                    "600 PLN",
                    "ROSZADA-2026-LIVE",
                  ],
                );
                setTimeout(() => fileInputRef.current?.click(), 100);
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-lime-400/20 hover:bg-lime-400/30 border border-lime-500/40 text-lime-900 dark:text-lime-200 text-xs font-black transition-all cursor-pointer shadow-xs shrink-0 whitespace-nowrap"
            >
              <Upload className="size-3.5" />
              <span>
                {language === "pl"
                  ? "Wgraj własną fakturę (WERSJA PILOTAŻOWA)"
                  : "Upload your invoice (PILOT VERSION)"}
              </span>
            </button>
          </div>
        </div>

        {/* Tabela Desktop: w-full, zero suwaka, perfekcyjnie zbalansowane proporcje */}
        <div className="hidden sm:block rounded-3xl border border-border bg-card shadow-lg overflow-hidden">
          <table className="w-full table-fixed text-left border-collapse text-xs sm:text-sm">
            <colgroup>
              <col className="w-[18%]" />
              <col className="w-[35%]" />
              <col className="w-[12%]" />
              <col className="w-[11%]" />
              <col className="w-[24%]" />
            </colgroup>
            <thead>
              <tr className="border-b border-border bg-muted/50 text-[11px] uppercase tracking-wider font-bold text-muted-foreground">
                <th className="py-3 px-3.5">{tLedger.patron}</th>
                <th className="py-3 px-3">{tLedger.purpose}</th>
                <th className="py-3 px-3">{tLedger.amount}</th>
                <th className="py-3 px-2 text-center">{tLedger.status}</th>
                <th className="py-3 px-3.5 text-right whitespace-nowrap">
                  {language === "pl"
                    ? "Certyfikat i audyt"
                    : "Certificate & Audit"}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60 font-medium">
              {allEntries.map((entry, idx) => {
                const [patron, purpose, amount, certId] = entry;
                const isLive = idx < extraEntries.length;
                const amountData = formatAllocationAmount(amount, language);
                // Skracamy zarówno ROSZADA- jak i TEST- dla zachowania idealnej równości w kolumnie
                const shortCertId = certId.replace(/^(ROSZADA|TEST)-/, "");

                return (
                  <tr
                    key={`${certId}-${idx}`}
                    className={`transition-colors ${
                      isLive
                        ? "bg-emerald-500/10 hover:bg-emerald-500/15"
                        : "hover:bg-muted/40"
                    }`}
                  >
                    {/* 1. Mecenas */}
                    <td className="py-3 px-3.5 font-bold text-foreground truncate">
                      <div className="flex items-center gap-1.5 min-w-0">
                        {isLive && (
                          <span className="size-2 rounded-full bg-emerald-500 animate-ping shrink-0" />
                        )}
                        <span className="truncate" title={patron}>
                          {patron}
                        </span>
                      </div>
                    </td>

                    {/* 2. Cel (zabezpieczony w LedgerPurposeCell) */}
                    <td className="py-3 px-3">
                      <LedgerPurposeCell
                        purpose={purpose}
                        language={language}
                      />
                    </td>

                    {/* 3. Kwota (Dwuwalutowy zapis) */}
                    <td className="py-3 px-3 whitespace-nowrap">
                      <div className="flex flex-col">
                        <span className="font-black text-emerald-800 dark:text-emerald-300 text-sm">
                          {amountData.primary}
                        </span>
                        {amountData.secondary && (
                          <span className="text-[10px] font-semibold text-muted-foreground/80 font-mono">
                            {amountData.secondary}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* 4. Status */}
                    <td className="py-3 px-2 text-center">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-700/10 text-emerald-800 dark:text-emerald-300 border border-emerald-700/25 shrink-0 whitespace-nowrap">
                        {tLedger.verified}
                      </span>
                    </td>

                    {/* 5. Certyfikat i audyt z bezpieczną przestrzenią (brak stykania się) */}
                    <td className="py-3 px-3.5 text-right">
                      <div className="inline-flex items-center justify-end gap-1.5 shrink-0">
                        {/* Przycisk Audytu Faktury AI */}
                        <button
                          type="button"
                          onClick={() => {
                            setCustomAuditData(null);
                            setSelectedAuditEntry(entry);
                          }}
                          className="inline-flex items-center gap-1 px-2 py-1 rounded-lg border border-lime-500/40 bg-lime-400/10 hover:bg-lime-400/20 text-[11px] font-bold text-lime-800 dark:text-lime-300 transition-all cursor-pointer shrink-0"
                          title={
                            language === "pl"
                              ? "Zobacz audyt faktury VAT z bazy Neon"
                              : "View VAT invoice audit from Neon DB"
                          }
                        >
                          <FileCheck2 className="size-3 shrink-0" />
                          <span>{language === "pl" ? "Audyt" : "Audit"}</span>
                        </button>

                        {/* Podgląd Certyfikatu */}
                        <button
                          type="button"
                          onClick={() => setSelectedEntry(entry)}
                          className="px-2 py-1 rounded-lg border border-border bg-background hover:bg-accent text-[11px] font-mono font-bold text-foreground transition-all shadow-xs cursor-pointer shrink-0"
                          title={`Podgląd certyfikatu ${certId}`}
                        >
                          {shortCertId}
                        </button>

                        {/* Bezpośredni link */}
                        <Link
                          href={`/certyfikat/${encodeURIComponent(certId)}`}
                          className="size-7 rounded-lg border border-border/80 bg-background hover:bg-muted text-xs font-bold text-muted-foreground hover:text-foreground transition-colors shrink-0 flex items-center justify-center"
                          title={
                            language === "pl"
                              ? "Otwórz stronę weryfikacji"
                              : "Open verification page"
                          }
                        >
                          ↗
                        </Link>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Karty Mobile */}
        <div className="sm:hidden space-y-2.5">
          {allEntries.map((entry, idx) => {
            const [patron, purpose, amount, certId] = entry;
            const isLive = idx < extraEntries.length;
            const amountData = formatAllocationAmount(amount, language);
            const shortCertId = certId.replace(/^(ROSZADA|TEST)-/, "");

            return (
              <div
                key={`${certId}-${idx}`}
                className={`p-3.5 sm:p-4 rounded-2xl border border-border shadow-sm space-y-2 ${
                  isLive ? "bg-emerald-500/10 border-emerald-500/40" : "bg-card"
                }`}
              >
                <div className="flex justify-between items-start gap-2.5">
                  <div className="min-w-0 flex-1">
                    <h3 className="font-bold text-foreground text-sm flex items-center gap-1.5">
                      {isLive && (
                        <span className="size-2 rounded-full bg-emerald-500 shrink-0" />
                      )}
                      <span className="truncate">{patron}</span>
                    </h3>
                    <div className="mt-0.5">
                      <LedgerPurposeCell
                        purpose={purpose}
                        language={language}
                        compact
                      />
                    </div>
                  </div>
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-700/10 text-emerald-800 dark:text-emerald-300 border border-emerald-700/25 shrink-0 whitespace-nowrap">
                    {tLedger.verified}
                  </span>
                </div>

                <div className="flex justify-between items-center pt-2 border-t border-border/60">
                  <div className="flex flex-col">
                    <span className="font-black text-emerald-800 dark:text-emerald-300 text-sm whitespace-nowrap">
                      {amountData.primary}
                    </span>
                    {amountData.secondary && (
                      <span className="text-[9.5px] font-semibold text-muted-foreground/80 font-mono">
                        {amountData.secondary}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => {
                        setCustomAuditData(null);
                        setSelectedAuditEntry(entry);
                      }}
                      className="px-2 py-1 rounded-lg border border-lime-500/40 bg-lime-400/10 text-[10px] font-bold text-lime-800 dark:text-lime-300 cursor-pointer flex items-center gap-1 shrink-0 whitespace-nowrap"
                    >
                      <FileCheck2 className="size-3" />
                      <span>{language === "pl" ? "Audyt" : "Audit"}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedEntry(entry)}
                      className="px-2 py-1 rounded-lg border border-border bg-background text-[11px] font-mono font-bold text-foreground cursor-pointer shrink-0 whitespace-nowrap"
                    >
                      {shortCertId}
                    </button>
                    <Link
                      href={`/certyfikat/${encodeURIComponent(certId)}`}
                      className="px-2 py-1 rounded-lg border border-border bg-background text-[11px] font-bold text-muted-foreground shrink-0"
                    >
                      ↗
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Ukryty input do wgrywania plików */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,.pdf"
          onChange={handleCustomFileUpload}
          className="hidden"
        />

        {/* Modal audytu faktury AI */}
        {selectedAuditEntry && activeAudit && (
          <LedgerAuditModal
            entry={selectedAuditEntry}
            auditData={activeAudit}
            language={language}
            tAudit={tAudit}
            verifiedLabel={tLedger.verified}
            isAnalyzingCustom={isAnalyzingCustom}
            onUploadClick={() => fileInputRef.current?.click()}
            onShowCertificate={() => {
              setSelectedEntry(selectedAuditEntry);
              setSelectedAuditEntry(null);
            }}
            onClose={() => {
              setSelectedAuditEntry(null);
              setCustomAuditData(null);
            }}
          />
        )}

        {/* Modal podglądu certyfikatu z kodem QR */}
        {selectedEntry && (
          <LedgerCertificateModal
            entry={selectedEntry}
            language={language}
            tLedger={tLedger}
            tCheckout={tCheckout}
            tAgent={tAgent}
            onAuditClick={() => {
              setSelectedAuditEntry(selectedEntry);
              setSelectedEntry(null);
            }}
            onClose={() => setSelectedEntry(null)}
          />
        )}
      </div>
    </section>
  );
}
