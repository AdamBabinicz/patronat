// components/checkout/DonationCertificate.tsx
"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Sparkles,
  Share2,
  Copy,
  Check,
  ExternalLink,
  FileText,
  Award,
  ChevronDown,
  ChevronUp,
  Play,
  Pause,
  RotateCcw,
  QrCode,
  Download,
} from "lucide-react";
import type { Language, Messages } from "@/lib/translations";
import type { Currency } from "./types";

interface DonationCertificateProps {
  paymentDetails: any;
  isAnonymous: boolean;
  donorName: string;
  clubName: string;
  goal: string;
  amount: number;
  currency: Currency;
  locale: Language;
  t: Messages["checkout"];
  onReset: () => void;
}

// Bezpieczny dostęp do Web Speech API bez błędów ts(2339) (zawężania window do 'never')
function getSpeechSynthesis(): SpeechSynthesis | null {
  if (typeof window === "undefined") return null;
  const win = window as unknown as { speechSynthesis?: SpeechSynthesis };
  return win.speechSynthesis || null;
}

export function DonationCertificate({
  paymentDetails,
  isAnonymous,
  donorName,
  clubName,
  goal,
  amount,
  currency,
  locale,
  t,
  onReset,
}: DonationCertificateProps) {
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedPost, setCopiedPost] = useState(false);
  const [copiedEsg, setCopiedEsg] = useState(false);
  const [activeTab, setActiveTab] = useState<"linkedin" | "esg">("linkedin");
  const [showCsrPack, setShowCsrPack] = useState(true);

  // Stan modułu AI Voice
  const [isPlayingVoice, setIsPlayingVoice] = useState(false);
  const [showTranscript, setShowTranscript] = useState(false);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const certRef = useRef<HTMLDivElement>(null);

  const orderId =
    paymentDetails?.orderId ||
    paymentDetails?.id ||
    `ROSZADA-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`;

  // Gwarantowane pobranie właściwej kwoty i waluty z obiektu transakcji (zapobiega niespodziewanemu 15 USD)
  const displayAmount = Number(
    paymentDetails?.recordAmount ??
      (paymentDetails?.amount?.value
        ? parseFloat(paymentDetails.amount.value)
        : null) ??
      amount,
  );

  const displayCurrency: Currency =
    paymentDetails?.recordCurrency ||
    paymentDetails?.amount?.currency_code ||
    currency ||
    "PLN";

  // Gwarantowane pobranie właściwej nazwy mecenasa (np. Grama)
  const effectivePatron = isAnonymous
    ? t.defaultAnonymous
    : paymentDetails?.donorName || donorName || t.defaultAnonymous;

  const isBarterTransaction = Boolean(
    paymentDetails?.isBarter ||
    paymentDetails?.paymentMethod === "BARTER" ||
    orderId.startsWith("BARTER-"),
  );

  const certUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/certyfikat/${orderId}`
      : `https://patronai.app/certyfikat/${orderId}`;

  const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${encodeURIComponent(
    certUrl,
  )}&format=svg`;

  const clubHashtag = clubName.replace(/\s+/g, "");

  // Treść podziękowania czytanego głosem przez juniorów klubu
  const voiceMessageText =
    locale === "pl"
      ? `Cześć! W imieniu wszystkich juniorów oraz zarządu klubu ${clubName}, z całego serca dziękujemy mecenasowi: ${effectivePatron}! Dzięki Twojemu wsparciu w kwocie ${displayAmount.toFixed(0)} ${displayCurrency} na cel: "${goal}", możemy trenować, rozwijać nasze pasje i walczyć o mistrzostwo. Dziękujemy, że grasz razem z nami!`
      : `Hello! On behalf of all youth athletes and the board of ${clubName}, we sincerely thank: ${effectivePatron}! With your generous support of ${displayAmount.toFixed(0)} ${displayCurrency} for: "${goal}", we can train, develop our skills, and compete for trophies. Thank you for standing with us!`;

  // Bezpieczne zatrzymanie dźwięku przy odmontowaniu
  useEffect(() => {
    return () => {
      const synth = getSpeechSynthesis();
      if (synth) {
        synth.cancel();
      }
    };
  }, []);

  // Obsługa odtwarzania syntezy mowy
  const togglePlayVoice = () => {
    const synth = getSpeechSynthesis();
    if (!synth) {
      alert(
        locale === "pl"
          ? "Twoja przeglądarka nie obsługuje syntezy mowy."
          : "Your browser does not support speech synthesis.",
      );
      return;
    }

    if (isPlayingVoice) {
      synth.cancel();
      setIsPlayingVoice(false);
      return;
    }

    synth.cancel();

    if (typeof window !== "undefined" && "SpeechSynthesisUtterance" in window) {
      const utterance = new SpeechSynthesisUtterance(voiceMessageText);
      utterance.lang = locale === "pl" ? "pl-PL" : "en-US";
      utterance.rate = 1.02;
      utterance.pitch = 1.1; // Młodzieńczy, przyjazny ton

      utterance.onstart = () => {
        setIsPlayingVoice(true);
      };

      utterance.onend = () => {
        setIsPlayingVoice(false);
      };

      utterance.onerror = () => {
        setIsPlayingVoice(false);
      };

      utteranceRef.current = utterance;
      synth.speak(utterance);
    }
  };

  const handleReplayVoice = () => {
    const synth = getSpeechSynthesis();
    if (synth) {
      synth.cancel();
      setIsPlayingVoice(false);
      setTimeout(() => {
        togglePlayVoice();
      }, 100);
    }
  };

  // Generowanie dynamicznej treści posta LinkedIn
  const linkedInPostText =
    locale === "pl"
      ? `🎯 Z dumą ogłaszamy, że jako mecenas wsparliśmy młode talenty z klubu ${clubName}!\n\nW ramach transparentnej alokacji PatronAI przekazaliśmy ${displayAmount.toFixed(2)} ${displayCurrency} na cel: "${goal}".\n\nSport młodzieżowy to nie tylko rywalizacja, ale przede wszystkim strategiczne myślenie, dyscyplina i równe szanse dla każdego juniora. Cieszymy się, że możemy być częścią tej misji! ♟️🏆\n\nSprawdź nasz oficjalny certyfikat mecenatu w publicznym rejestrze:\n${certUrl}\n\n#CSR #BiznesDlaSportu #PatronAI #${clubHashtag} #ESG #OdpowiedzialnyBiznes #SportMłodzieżowy`
      : `🎯 Proud to announce our corporate patronage for the young athletes at ${clubName}!\n\nThrough transparent PatronAI impact allocation, we contributed ${displayAmount.toFixed(2)} ${displayCurrency} to: "${goal}".\n\nYouth sports build resilience, strategic foresight, and character. We are proud to invest in the next generation of champions! ♟️🏆\n\nVerify our official patronage certificate in the public registry:\n${certUrl}\n\n#CSR #SportsSponsorship #PatronAI #${clubHashtag} #ESG #YouthDevelopment #CorporateCitizenship`;

  // Generowanie formalnego oświadczenia do raportu ESG / CSR
  const esgStatementText =
    locale === "pl"
      ? `OŚWIADCZENIE WPŁYWU SPOŁECZNEGO (CSR / ESG COMPLIANCE)\n--------------------------------------------------\nPodmiot finansujący: ${effectivePatron}\nBeneficjent: ${clubName}\nCel mecenatu: ${goal}\nWartość alokacji: ${displayAmount.toFixed(2)} ${displayCurrency}\nUnikalny identyfikator certyfikatu: ${orderId}\nData rejestracji: ${new Date().toLocaleDateString("pl-PL")}\n\nZgodność z Celami Zrównoważonego Rozwoju ONZ (UN SDGs):\n• SDG 3 (Dobre zdrowie i jakość życia): Promowanie aktywności fizycznej i rozwoju psychofizycznego młodzieży.\n• SDG 4 (Dobra jakość edukacji): Wspieranie strategicznego myślenia, równego dostępu do szkoleń i integracji społecznej.\n\nStatus audytu: Wpis potwierdzony w publicznym, transparentnym rejestrze mecenasów PatronAI.`
      : `SOCIAL IMPACT & ESG COMPLIANCE STATEMENT\n----------------------------------------\nFunding Entity: ${effectivePatron}\nBeneficiary: ${clubName}\nSupported Goal: ${goal}\nAllocated Amount: ${displayAmount.toFixed(2)} ${displayCurrency}\nRegistry Certificate ID: ${orderId}\nRegistration Date: ${new Date().toLocaleDateString("en-US")}\n\nUN Sustainable Development Goals (SDGs) Alignment:\n• SDG 3 (Good Health and Well-being): Promoting youth physical and psychological wellness.\n• SDG 4 (Quality Education): Developing strategic thinking, sports excellence, and equal youth access.\n\nAudit Status: Authenticated on the transparent PatronAI Public Ledger.`;

  const handleCopyLink = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(certUrl).then(() => {
        setCopiedLink(true);
        setTimeout(() => setCopiedLink(false), 3000);
      });
    }
  };

  const handleCopyPost = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(linkedInPostText).then(() => {
        setCopiedPost(true);
        setTimeout(() => setCopiedPost(false), 3000);
      });
    }
  };

  const handleCopyEsg = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(esgStatementText).then(() => {
        setCopiedEsg(true);
        setTimeout(() => setCopiedEsg(false), 3000);
      });
    }
  };

  const handleOpenLinkedIn = () => {
    if (typeof window !== "undefined") {
      const url = `https://www.linkedin.com/feed/?shareActive=true&text=${encodeURIComponent(
        linkedInPostText,
      )}`;
      window.open(url, "_blank", "noopener,noreferrer");
    }
  };

  // Wizualizator fali dźwiękowej (16 słupków)
  const waveHeights = [
    35, 65, 45, 90, 60, 85, 40, 100, 75, 50, 95, 60, 80, 50, 70, 40,
  ];

  // Podtytuł certyfikatu dopasowany do trybu gotówkowego lub bezgotówkowego barteru
  const resolvedSubtitle = isBarterTransaction
    ? locale === "pl"
      ? "Porozumienie barterowe zostało pomyślnie zarejestrowane, a świadczenie rzeczowe przypisane do klubu."
      : "Barter agreement successfully recorded, and in-kind contribution allocated."
    : t.successSubtitle;

  return (
    <div className="max-w-2xl mx-auto p-4 sm:p-6 lg:p-8">
      {/* Kontener certyfikatu (przygotowany do druku PDF i zapisu grafiki) */}
      <div
        ref={certRef}
        className="relative overflow-hidden rounded-3xl border-2 border-amber-500/40 bg-gradient-to-b from-card via-card to-amber-500/5 p-6 sm:p-8 shadow-2xl backdrop-blur-sm print:border-black print:shadow-none print:m-0"
      >
        <div className="flex flex-col items-center text-center pb-6 border-b border-border/80">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-widest bg-amber-500/15 text-amber-800 dark:text-amber-300 border border-amber-500/30 mb-3">
            <span>★</span>
            <span>{t.certificateBadge}</span>
            <span>★</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-foreground">
            {t.successTitle}
          </h2>
          <p className="mt-1 text-xs sm:text-sm text-muted-foreground max-w-md">
            {resolvedSubtitle}
          </p>
        </div>

        {/* Szczegóły wpisu w rejestrze */}
        <div className="mt-6 space-y-3.5 text-sm">
          <div className="flex justify-between items-center py-2 border-b border-border/50">
            <span className="text-muted-foreground">
              {t.certificateIdLabel}:
            </span>
            <span className="font-mono font-bold text-primary tracking-wider">
              {orderId}
            </span>
          </div>

          <div className="flex justify-between items-center py-2 border-b border-border/50">
            <span className="text-muted-foreground">{t.donorLabel}:</span>
            <span className="font-bold text-foreground text-base">
              {effectivePatron}
            </span>
          </div>

          <div className="flex justify-between items-center py-2 border-b border-border/50">
            <span className="text-muted-foreground">{t.clubLabel}:</span>
            <span className="font-semibold text-foreground">{clubName}</span>
          </div>

          <div className="flex justify-between items-center py-2 border-b border-border/50">
            <span className="text-muted-foreground">{t.goalLabel}:</span>
            <span className="font-semibold text-foreground text-right max-w-xs">
              {goal}
            </span>
          </div>

          <div className="flex justify-between items-center py-2 border-b border-border/50">
            <span className="text-muted-foreground">
              {isBarterTransaction
                ? locale === "pl"
                  ? "Wartość świadczenia (AVE):"
                  : "In-Kind Value (AVE):"
                : t.amountPaidLabel}
              :
            </span>
            <span className="font-black text-emerald-800 dark:text-emerald-300 text-lg sm:text-xl">
              {displayAmount.toFixed(2)} {displayCurrency}
            </span>
          </div>

          <div className="flex justify-between items-center py-2 border-b border-border/50 text-xs">
            <span className="text-muted-foreground">{t.dateLabel}:</span>
            <span className="font-medium text-foreground">
              {new Date().toLocaleDateString(
                locale === "pl" ? "pl-PL" : "en-US",
                {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                },
              )}
            </span>
          </div>
        </div>

        {/* Podpisy oficjalne + KOD QR WERYFIKACJI */}
        <div className="mt-8 pt-6 border-t border-border/60 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="grid grid-cols-2 gap-6 w-full sm:w-auto text-center">
            <div className="flex flex-col items-center">
              <div className="h-0.5 w-24 bg-border mb-2" />
              <span className="text-[11px] font-bold text-foreground">
                {t.signatureClub}
              </span>
            </div>
            <div className="flex flex-col items-center">
              <div className="h-0.5 w-24 bg-border mb-2" />
              <span className="text-[11px] font-bold text-primary">
                {t.signatureAgent}
              </span>
            </div>
          </div>

          {/* DYNAMICZNY KOD QR PROWADZĄCY DO /certyfikat/[id] */}
          <div className="flex items-center gap-3 p-2.5 rounded-2xl bg-white text-stone-950 border border-border shadow-xs shrink-0">
            <img
              src={qrImageUrl}
              alt="Certyfikat QR Code"
              className="size-16 rounded-lg"
              loading="lazy"
            />
            <div className="text-left text-[10px] leading-tight space-y-0.5">
              <div className="font-black uppercase tracking-wider flex items-center gap-1 text-emerald-700">
                <Check className="size-3" />
                <span>{locale === "pl" ? "Weryfikacja" : "Verify"}</span>
              </div>
              <p className="text-stone-600 font-mono">
                {locale === "pl" ? "Skanuj aparatem" : "Scan with phone"}
              </p>
              <span className="font-bold text-[9px] text-stone-500 block truncate max-w-[90px]">
                {orderId}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* MODUŁ AI DYNAMIC IMPACT VOICE (ODSŁUCHAJ PODZIĘKOWANIE OD JUNIORÓW) */}
      <div className="mt-6 rounded-2xl border border-emerald-500/30 bg-gradient-to-r from-emerald-500/10 via-card to-card p-4 sm:p-5 shadow-lg print:hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={togglePlayVoice}
              className={`size-12 rounded-2xl grid place-items-center transition-all shadow-md cursor-pointer ${
                isPlayingVoice
                  ? "bg-emerald-600 text-white animate-pulse"
                  : "bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 hover:bg-emerald-500/30"
              }`}
              title={
                isPlayingVoice
                  ? locale === "pl"
                    ? "Zatrzymaj nagranie"
                    : "Pause voice note"
                  : locale === "pl"
                    ? "Odsłuchaj podziękowanie"
                    : "Play voice note"
              }
            >
              {isPlayingVoice ? (
                <Pause className="size-5 fill-current" />
              ) : (
                <Play className="size-5 fill-current translate-x-0.5" />
              )}
            </button>

            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm sm:text-base font-bold text-foreground">
                  {locale === "pl"
                    ? "Podziękowanie audio od juniorów"
                    : "Audio Note from Youth Athletes"}
                </h3>
                <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] font-black uppercase text-emerald-800 dark:text-emerald-300">
                  {locale === "pl" ? "Synteza AI" : "AI Voice"}
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                {locale === "pl"
                  ? "Odsłuchaj osobistą wiadomość nagraną cyfrowo dla mecenasa."
                  : "Listen to the personalized voice message synthesized for you."}
              </p>
            </div>
          </div>

          {/* Wizualizator fali dźwiękowej (pełny zestaw 16 animowanych słupków) */}
          <div className="flex items-center gap-2 self-end sm:self-center">
            <div className="flex items-center gap-0.5 h-7 px-2 py-1 rounded-xl bg-muted/50 border border-border/60">
              {waveHeights.map((h, i) => (
                <div
                  key={i}
                  className={`w-1 rounded-full transition-all duration-300 ${
                    isPlayingVoice
                      ? "bg-emerald-500 animate-pulse"
                      : "bg-muted-foreground/40"
                  }`}
                  style={{
                    height: isPlayingVoice ? `${h}%` : "30%",
                    animationDelay: `${i * 60}ms`,
                  }}
                />
              ))}
            </div>

            {isPlayingVoice && (
              <button
                type="button"
                onClick={handleReplayVoice}
                className="p-1.5 rounded-lg border border-border hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                title={locale === "pl" ? "Od nowa" : "Replay"}
              >
                <RotateCcw className="size-4" />
              </button>
            )}
          </div>
        </div>

        {/* Przycisk podglądu transkrypcji */}
        <div className="mt-3 pt-3 border-t border-border/60 flex items-center justify-between text-xs">
          <button
            type="button"
            onClick={() => setShowTranscript(!showTranscript)}
            className="text-[11px] font-semibold text-emerald-800 dark:text-emerald-300 hover:underline cursor-pointer flex items-center gap-1"
          >
            <span>
              {showTranscript
                ? locale === "pl"
                  ? "Ukryj transkrypcję"
                  : "Hide transcript"
                : locale === "pl"
                  ? "Pokaż transkrypcję podziękowania"
                  : "Show voice transcript"}
            </span>
            {showTranscript ? (
              <ChevronUp className="size-3.5" />
            ) : (
              <ChevronDown className="size-3.5" />
            )}
          </button>

          <span className="text-[10px] text-muted-foreground font-mono">
            {locale === "pl"
              ? "Głos: Juniorzy UKS Roszada"
              : "Voice: UKS Roszada Youth"}
          </span>
        </div>

        {showTranscript && (
          <div className="mt-2.5 p-3 rounded-xl bg-background/80 border border-border/80 text-xs italic text-foreground leading-relaxed">
            "{voiceMessageText}"
          </div>
        )}
      </div>

      {/* PAKIET WIZERUNKOWY CSR & LINKEDIN DLA MECENASA (ukryty przy druku PDF) */}
      <div className="mt-6 rounded-2xl border border-lime-500/30 bg-gradient-to-b from-card via-card to-lime-500/5 p-4 sm:p-5 shadow-lg print:hidden">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="grid size-8 place-items-center rounded-xl bg-lime-400 text-stone-950 font-black shadow-sm">
              <Sparkles className="size-4" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-foreground flex items-center gap-2">
                {locale === "pl"
                  ? "Pakiet Wizerunkowy CSR & LinkedIn"
                  : "B2B CSR & LinkedIn Impact Pack"}
                <span className="rounded-full bg-lime-400/20 px-2 py-0.5 text-[10px] font-black uppercase text-lime-800 dark:text-lime-300">
                  AI PR Kit
                </span>
              </h3>
              <p className="text-xs text-muted-foreground">
                {locale === "pl"
                  ? "Gotowe materiały do publikacji w mediach społecznościowych i raporcie ESG."
                  : "Ready-to-publish social media copy and ESG report documentation."}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setShowCsrPack(!showCsrPack)}
            className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors cursor-pointer"
            aria-label="Toggle CSR pack"
          >
            {showCsrPack ? (
              <ChevronUp className="size-5" />
            ) : (
              <ChevronDown className="size-5" />
            )}
          </button>
        </div>

        {showCsrPack && (
          <div className="mt-4 pt-4 border-t border-border/70 space-y-4">
            {/* Przełącznik zakładek */}
            <div className="flex rounded-xl bg-muted/60 p-1 text-xs font-semibold">
              <button
                type="button"
                onClick={() => setActiveTab("linkedin")}
                className={`flex-1 py-1.5 rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  activeTab === "linkedin"
                    ? "bg-card text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Share2 className="size-3.5 text-blue-500" />
                <span>
                  {locale === "pl" ? "Post na LinkedIn" : "LinkedIn Post"}
                </span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("esg")}
                className={`flex-1 py-1.5 rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  activeTab === "esg"
                    ? "bg-card text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <FileText className="size-3.5 text-emerald-500" />
                <span>
                  {locale === "pl" ? "Raport ESG (SDG 3 & 4)" : "ESG Statement"}
                </span>
              </button>
            </div>

            {/* Treść zakładki LinkedIn */}
            {activeTab === "linkedin" && (
              <div className="space-y-3">
                <div className="relative rounded-xl border border-border/80 bg-background/80 p-3 sm:p-4 text-xs font-sans text-foreground leading-relaxed whitespace-pre-wrap max-h-56 overflow-y-auto">
                  {linkedInPostText}
                </div>

                <div className="flex flex-wrap items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={handleCopyPost}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border bg-card text-xs font-semibold text-foreground hover:bg-accent transition-colors cursor-pointer"
                  >
                    {copiedPost ? (
                      <>
                        <Check className="size-3.5 text-emerald-500" />
                        <span className="text-emerald-700 dark:text-emerald-300">
                          {locale === "pl" ? "Skopiowano!" : "Copied!"}
                        </span>
                      </>
                    ) : (
                      <>
                        <Copy className="size-3.5" />
                        <span>
                          {locale === "pl"
                            ? "Kopiuj treść posta"
                            : "Copy Post Text"}
                        </span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={handleOpenLinkedIn}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 transition-colors cursor-pointer shadow-sm"
                  >
                    <ExternalLink className="size-3.5" />
                    <span>
                      {locale === "pl"
                        ? "Opublikuj na LinkedIn"
                        : "Publish on LinkedIn"}
                    </span>
                  </button>
                </div>
              </div>
            )}

            {/* Treść zakładki ESG */}
            {activeTab === "esg" && (
              <div className="space-y-3">
                <div className="relative rounded-xl border border-border/80 bg-background/80 p-3 sm:p-4 text-[11px] sm:text-xs font-mono text-foreground leading-relaxed whitespace-pre-wrap max-h-56 overflow-y-auto">
                  {esgStatementText}
                </div>

                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={handleCopyEsg}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg border border-border bg-card text-xs font-semibold text-foreground hover:bg-accent transition-colors cursor-pointer"
                  >
                    {copiedEsg ? (
                      <>
                        <Check className="size-3.5 text-emerald-500" />
                        <span className="text-emerald-700 dark:text-emerald-300">
                          {locale === "pl"
                            ? "Skopiowano oświadczenie!"
                            : "Statement Copied!"}
                        </span>
                      </>
                    ) : (
                      <>
                        <Award className="size-3.5 text-amber-500" />
                        <span>
                          {locale === "pl"
                            ? "Kopiuj do raportu ESG / CSR"
                            : "Copy ESG Compliance Statement"}
                        </span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Akcje pod certyfikatem */}
      <div className="mt-6 flex flex-wrap justify-center gap-3 print:hidden">
        <button
          type="button"
          onClick={() => window.print()}
          className="px-5 py-2.5 rounded-xl bg-primary text-primary-foreground font-semibold text-xs sm:text-sm hover:opacity-90 transition-all shadow-md flex items-center gap-2 cursor-pointer"
        >
          <span>🖨️</span>
          <span>{t.printBtn}</span>
        </button>

        <button
          type="button"
          onClick={handleCopyLink}
          className="px-5 py-2.5 rounded-xl border border-border bg-card text-foreground font-semibold text-xs sm:text-sm hover:bg-accent transition-colors flex items-center gap-2 cursor-pointer"
        >
          <span>🔗</span>
          <span>{copiedLink ? t.copiedToast : t.copyLinkBtn}</span>
        </button>

        <button
          type="button"
          onClick={onReset}
          className="px-5 py-2.5 rounded-xl border border-border/80 bg-background text-muted-foreground hover:text-foreground font-medium text-xs sm:text-sm transition-colors cursor-pointer"
        >
          {t.newDonationBtn}
        </button>
      </div>
    </div>
  );
}
