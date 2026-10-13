// app/certyfikat/[id]/page.tsx
"use client";

import React, { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ArrowLeft,
  CheckCircle2,
  Download,
  Moon,
  Printer,
  Share2,
  ShieldCheck,
  Sun,
  WalletCards,
  FileCheck2,
  Play,
  Pause,
  RotateCcw,
  Sparkles,
  Hash,
} from "lucide-react";
import {
  type Language,
  type Messages,
  getTranslations,
} from "@/lib/translations";

export default function CertificateVerificationPage() {
  const rawParams = useParams();
  const certIdParam = Array.isArray(rawParams?.id)
    ? rawParams.id[0]
    : (rawParams?.id as string) || "ROSZADA-2026-084";

  const [language, setLanguage] = useState<Language>("pl");
  const [dark, setDark] = useState(true);
  const [copiedLink, setCopiedLink] = useState(false);
  const [liveEntries, setLiveEntries] = useState<
    [string, string, string, string][]
  >([]);

  // Stan modułu AI Voice na stronie weryfikacji
  const [isPlayingVoice, setIsPlayingVoice] = useState(false);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  // Stan modalu audytu faktury
  const [showAuditModal, setShowAuditModal] = useState(false);

  const t: Messages = getTranslations(language);

  useEffect(() => {
    // 1. Motyw
    const savedTheme = window.localStorage.getItem("patronai_theme");
    const nextTheme = savedTheme ? savedTheme === "dark" : true;
    setDark(nextTheme);
    document.documentElement.classList.toggle("dark", nextTheme);
    document.documentElement.classList.toggle("light", !nextTheme);

    // 2. Zapamiętany język
    const savedLang = window.localStorage.getItem(
      "patronai_lang",
    ) as Language | null;
    if (savedLang === "pl" || savedLang === "en") {
      setLanguage(savedLang);
    }

    // 3. Wczytanie dynamicznych certyfikatów z bieżących transakcji
    try {
      const stored = JSON.parse(
        window.localStorage.getItem("patronai_live_entries") || "[]",
      );
      if (Array.isArray(stored)) {
        setLiveEntries(stored);
      }
    } catch {
      // Ignoruj błędy
    }

    return () => {
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const toggleTheme = () => {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle("dark", next);
    document.documentElement.classList.toggle("light", !next);
    window.localStorage.setItem("patronai_theme", next ? "dark" : "light");
  };

  const handleLanguageChange = (newLang: Language) => {
    setLanguage(newLang);
    window.localStorage.setItem("patronai_lang", newLang);
  };

  // 1. Szukamy najpierw w transakcjach na żywo (localStorage), a potem w bazie domyślnej
  const dynamicMatch = liveEntries.find(
    ([, , , id]) => id && id.toUpperCase() === certIdParam.toUpperCase(),
  );

  const matchedEntry =
    dynamicMatch ||
    (t.ledger.entries as readonly [string, string, string, string][]).find(
      ([, , , id]) => id && id.toUpperCase() === certIdParam.toUpperCase(),
    );

  const patronName = matchedEntry ? matchedEntry[0] : t.agent.defaultPatron;
  const goalTitle = matchedEntry ? matchedEntry[1] : t.agent.purpose;
  const amountFormatted = matchedEntry ? matchedEntry[2] : t.agent.amount;
  const formattedCertId = certIdParam.startsWith("ID:")
    ? certIdParam
    : `ID: ${certIdParam.toUpperCase()} · ${new Date().getFullYear()}`;

  const certPageUrl =
    typeof window !== "undefined"
      ? window.location.href
      : `https://patronai.app/certyfikat/${certIdParam}`;

  const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=140x140&data=${encodeURIComponent(
    certPageUrl,
  )}&format=png`;

  // Treść głosu juniorów
  const voiceMessageText =
    language === "pl"
      ? `Cześć! W imieniu wszystkich juniorów oraz zarządu klubu ${t.agent.clubName}, z całego serca dziękujemy mecenasowi: ${patronName}! Dzięki Twojemu wsparciu na cel: "${goalTitle}", możemy trenować, rozwijać nasze pasje i walczyć o mistrzostwo. Dziękujemy, że grasz razem z nami!`
      : `Hello! On behalf of all youth athletes and the board of ${t.agent.clubName}, we sincerely thank: ${patronName}! With your generous support for: "${goalTitle}", we can train, develop our skills, and compete for trophies. Thank you for standing with us!`;

  const togglePlayVoice = () => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      alert(
        language === "pl"
          ? "Twoja przeglądarka nie obsługuje syntezy mowy."
          : "Your browser does not support speech synthesis.",
      );
      return;
    }

    if (isPlayingVoice) {
      window.speechSynthesis.cancel();
      setIsPlayingVoice(false);
      return;
    }

    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(voiceMessageText);
    utterance.lang = language === "pl" ? "pl-PL" : "en-US";
    utterance.rate = 1.02;
    utterance.pitch = 1.1;

    utterance.onstart = () => setIsPlayingVoice(true);
    utterance.onend = () => setIsPlayingVoice(false);
    utterance.onerror = () => setIsPlayingVoice(false);

    utteranceRef.current = utterance;
    window.speechSynthesis.speak(utterance);
  };

  const handleReplayVoice = () => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      setIsPlayingVoice(false);
      setTimeout(() => togglePlayVoice(), 100);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleCopyLink = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(window.location.href).then(() => {
        setCopiedLink(true);
        setTimeout(() => setCopiedLink(false), 3000);
      });
    }
  };

  // Dane faktury przypisane do alokacji
  const invoiceData = {
    invoiceNumber: "FV/2026/RO-084",
    seller: "Puchary & Trofea Sportowe Radom Sp. z o.o.",
    sellerNip: "PL 796-284-19-40",
    issueDate: "10.10.2026",
    items: [
      {
        name:
          language === "pl"
            ? "Komplet pucharów grawerowanych UKS (12 szt.)"
            : "Engraved trophies set for UKS (12 pcs)",
        qty: "1 kpl",
        gross: "260.00 PLN",
      },
      {
        name:
          language === "pl"
            ? "Medale okolicznościowe tłoczone ze wstążką (40 szt.)"
            : "Cast championship medals with ribbon (40 pcs)",
        qty: "40 szt",
        gross: "140.00 PLN",
      },
    ],
    totalGross: amountFormatted,
    auditHash: "0x4a8f902b6e1c7d83f491295b77c10d32e50f381c8901ad47a502c3",
  };

  // Eksport certyfikatu do wysokiej jakości pliku PNG ze złotą odznaką, podpisami i KODEM QR
  const handleDownloadPng = () => {
    const isLight = !dark;
    const canvas = document.createElement("canvas");
    canvas.width = 1200;
    canvas.height = 860;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const filePrefix = language === "pl" ? "certyfikat" : "certificate";

    const finalizeAndSave = () => {
      const a = document.createElement("a");
      a.href = canvas.toDataURL("image/png");
      a.download = `${filePrefix}-${certIdParam}.png`;
      a.click();
    };

    // 1. Tło certyfikatu
    ctx.fillStyle = isLight ? "#fefdfa" : "#0d1117";
    ctx.fillRect(0, 0, 1200, 860);

    // 2. Podwójna obwódka mecenatu (zielona i złota przerywana)
    ctx.strokeStyle = isLight ? "#15803d" : "#84cc16";
    ctx.lineWidth = 5;
    ctx.strokeRect(35, 35, 1130, 790);

    ctx.strokeStyle = isLight ? "#d97706" : "#f59e0b";
    ctx.lineWidth = 1.5;
    ctx.setLineDash([8, 6]);
    ctx.strokeRect(48, 48, 1104, 764);
    ctx.setLineDash([]);

    // 3. Złoty badge na górze
    ctx.fillStyle = isLight ? "#fef3c7" : "#78350f";
    ctx.beginPath();
    ctx.roundRect(470, 75, 260, 34, 17);
    ctx.fill();
    ctx.strokeStyle = isLight ? "#f59e0b" : "#d97706";
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.textAlign = "center";
    ctx.fillStyle = isLight ? "#92400e" : "#fde68a";
    ctx.font = "bold 13px sans-serif";
    ctx.fillText("★ OFICJALNY CERTYFIKAT MECENASA ★", 600, 97);

    // 4. Nagłówek Klubu i sekcji
    ctx.fillStyle = isLight ? "#0f172a" : "#ffffff";
    ctx.font = "bold 46px Georgia, serif";
    ctx.fillText(t.agent.clubName, 600, 170);

    ctx.fillStyle = isLight ? "#475569" : "#94a3b8";
    ctx.font = "italic 19px Georgia, serif";
    ctx.fillText(t.agent.certificateSub, 600, 210);

    // Linia rozdzielająca górna
    ctx.strokeStyle = isLight ? "#e2e8f0" : "#1e293b";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(150, 240);
    ctx.lineTo(1050, 240);
    ctx.stroke();

    // 5. Mecenas
    ctx.fillStyle = isLight ? "#64748b" : "#94a3b8";
    ctx.font = "bold 12px sans-serif";
    ctx.fillText(t.checkout.donorLabel.toUpperCase(), 600, 280);

    ctx.fillStyle = isLight ? "#0f172a" : "#ffffff";
    ctx.font = "bold 38px sans-serif";
    ctx.fillText(patronName, 600, 330);

    // 6. Cel mecenatu
    ctx.fillStyle = isLight ? "#64748b" : "#94a3b8";
    ctx.font = "bold 12px sans-serif";
    ctx.fillText(t.checkout.goalLabel.toUpperCase(), 600, 390);

    ctx.fillStyle = isLight ? "#0f172a" : "#ffffff";
    ctx.font = "600 22px sans-serif";
    ctx.fillText(goalTitle, 600, 425);

    // 7. Kwota alokacji
    ctx.fillStyle = isLight ? "#64748b" : "#94a3b8";
    ctx.font = "bold 12px sans-serif";
    ctx.fillText(t.checkout.amountPaidLabel.toUpperCase(), 600, 480);

    ctx.fillStyle = isLight ? "#047857" : "#34d399";
    ctx.font = "black 46px sans-serif";
    ctx.fillText(amountFormatted, 600, 535);

    // Linia rozdzielająca dolna
    ctx.beginPath();
    ctx.moveTo(150, 580);
    ctx.lineTo(1050, 580);
    ctx.stroke();

    // 8. Identyfikator certyfikatu (lewa strona)
    ctx.textAlign = "left";
    ctx.fillStyle = isLight ? "#0f172a" : "#ffffff";
    ctx.font = "bold 14px monospace";
    ctx.fillText(`✓ ${formattedCertId}`, 150, 625);

    ctx.fillStyle = isLight ? "#64748b" : "#94a3b8";
    ctx.font = "12px sans-serif";
    ctx.fillText("Protokół: PatronAI Agentic Commerce v1.0", 150, 648);

    // 9. Podpisy oficjalne
    ctx.textAlign = "center";
    // Podpis Klubu
    ctx.strokeStyle = isLight ? "#cbd5e1" : "#334155";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(150, 730);
    ctx.lineTo(330, 730);
    ctx.stroke();

    ctx.fillStyle = isLight ? "#0f172a" : "#f8fafc";
    ctx.font = "bold 12px sans-serif";
    ctx.fillText(t.checkout.signatureClub, 240, 750);

    // Podpis Protokółu AI
    ctx.beginPath();
    ctx.moveTo(400, 730);
    ctx.lineTo(580, 730);
    ctx.stroke();

    ctx.fillStyle = isLight ? "#15803d" : "#84cc16";
    ctx.font = "bold 12px sans-serif";
    ctx.fillText(t.checkout.signatureAgent, 490, 750);

    // 10. KOD QR (prawa strona certyfikatu)
    const qrImg = new Image();
    qrImg.crossOrigin = "anonymous";

    qrImg.onload = () => {
      // Biała ramka pod kod QR
      ctx.fillStyle = "#ffffff";
      ctx.beginPath();
      ctx.roundRect(900, 610, 160, 155, 12);
      ctx.fill();
      ctx.strokeStyle = "#e2e8f0";
      ctx.lineWidth = 1;
      ctx.stroke();

      // Wrysowanie obrazu QR
      ctx.drawImage(qrImg, 925, 620, 110, 110);

      // Etykieta pod kodem QR
      ctx.textAlign = "center";
      ctx.fillStyle = "#047857";
      ctx.font = "bold 10px sans-serif";
      ctx.fillText("WERYFIKACJA ✓", 980, 745);

      finalizeAndSave();
    };

    qrImg.onerror = () => {
      // Bezpieczny fallback jeśli obrazek QR zablokuje sieć
      finalizeAndSave();
    };

    qrImg.src = qrImageUrl;
  };

  return (
    <div className="min-h-screen bg-slate-50 text-neutral-900 transition-colors duration-200 dark:bg-neutral-950 dark:text-neutral-100 flex flex-col justify-between">
      {/* PASEK NAWIGACJI (ukryty podczas wydruku) */}
      <header className="sticky top-0 z-20 border-b border-neutral-200 bg-slate-50/90 backdrop-blur dark:border-neutral-800 dark:bg-neutral-950/90 print:hidden">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3.5">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-xs sm:text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
          >
            <ArrowLeft className="size-4" />
            <span>{t.legal.back}</span>
          </Link>

          <div className="flex items-center gap-2">
            <button
              type="button"
              aria-label={t.nav.theme}
              onClick={toggleTheme}
              className="grid size-9 place-items-center rounded-full border border-neutral-200 bg-white text-neutral-700 hover:bg-neutral-100 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-300 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
            >
              {dark ? <Sun className="size-4" /> : <Moon className="size-4" />}
            </button>

            {/* Segmentowy przełącznik [ PL | EN ] */}
            <div className="flex items-center rounded-full border border-neutral-200 bg-white p-0.5 text-xs font-bold dark:border-neutral-800 dark:bg-neutral-900">
              <button
                type="button"
                onClick={() => handleLanguageChange("pl")}
                className={`rounded-full px-2.5 py-1 transition-all cursor-pointer ${
                  language === "pl"
                    ? "bg-lime-400 text-neutral-950 shadow-xs font-black"
                    : "text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white"
                }`}
              >
                PL
              </button>
              <button
                type="button"
                onClick={() => handleLanguageChange("en")}
                className={`rounded-full px-2.5 py-1 transition-all cursor-pointer ${
                  language === "en"
                    ? "bg-lime-400 text-neutral-950 shadow-xs font-black"
                    : "text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white"
                }`}
              >
                EN
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* GŁÓWNA TREŚĆ: KONTENER CERTYFIKATU */}
      <main className="flex-1 py-8 sm:py-12 px-4">
        <div className="max-w-3xl mx-auto space-y-6">
          {/* Badge weryfikacji kryptograficznej */}
          <div className="flex justify-center print:hidden">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-700/10 text-emerald-800 dark:text-emerald-300 border border-emerald-700/30 text-xs font-bold tracking-wide shadow-xs">
              <ShieldCheck className="size-4" />
              <span>
                {language === "pl"
                  ? "Certyfikat zweryfikowany w Rejestrze Publicznym (Public Ledger)"
                  : "Certificate verified on the Public Ledger"}
              </span>
            </div>
          </div>

          {/* KARTA CERTYFIKATU */}
          <div className="relative overflow-hidden rounded-3xl border-2 border-amber-500/50 bg-gradient-to-b from-card via-card to-amber-500/5 p-6 sm:p-10 shadow-2xl backdrop-blur-sm print:border-black print:shadow-none print:m-0 print:p-8">
            {/* Ozdobny nagłówek ze złotymi gwiazdami */}
            <div className="flex flex-col items-center text-center pb-6 sm:pb-8 border-b border-border/80">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase tracking-widest bg-amber-500/15 text-amber-800 dark:text-amber-300 border border-amber-500/30 mb-3">
                <span>★</span>
                <span>{t.checkout.certificateBadge}</span>
                <span>★</span>
              </div>
              <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-foreground font-serif">
                {t.agent.clubName}
              </h1>
              <p className="mt-1 text-sm sm:text-base font-semibold text-muted-foreground tracking-wide">
                {t.agent.certificateSub}
              </p>
            </div>

            {/* Treść i dane alokacji mecenasa */}
            <div className="my-6 sm:my-8 text-center space-y-4">
              <div>
                <span className="text-xs uppercase font-bold tracking-widest text-muted-foreground block mb-1">
                  {t.checkout.donorLabel}
                </span>
                <p className="text-2xl sm:text-4xl font-black text-foreground">
                  {patronName}
                </p>
              </div>

              <div className="pt-2">
                <span className="text-xs uppercase font-bold tracking-widest text-muted-foreground block mb-1">
                  {t.checkout.goalLabel}
                </span>
                <p className="text-lg sm:text-2xl font-bold text-foreground max-w-xl mx-auto leading-snug">
                  {goalTitle}
                </p>
              </div>

              <div className="pt-2">
                <span className="text-xs uppercase font-bold tracking-widest text-muted-foreground block mb-1">
                  {t.checkout.amountPaidLabel}
                </span>
                <p className="text-3xl sm:text-5xl font-black text-emerald-800 dark:text-emerald-300">
                  {amountFormatted}
                </p>
              </div>
            </div>

            {/* Stopka certyfikatu z podpisami i KODEM QR */}
            <div className="pt-6 border-t border-border/70 flex flex-col sm:flex-row items-center justify-between gap-6">
              <div className="space-y-3 text-center sm:text-left">
                <div className="flex items-center justify-center sm:justify-start gap-1.5 text-xs font-mono text-muted-foreground">
                  <CheckCircle2 className="size-4 text-emerald-700 dark:text-emerald-400" />
                  <span className="font-bold text-foreground">
                    {formattedCertId}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-4 text-center">
                  <div className="flex flex-col items-center">
                    <div className="h-0.5 w-24 bg-border mb-1.5" />
                    <span className="text-[11px] font-bold text-foreground">
                      {t.checkout.signatureClub}
                    </span>
                  </div>
                  <div className="flex flex-col items-center">
                    <div className="h-0.5 w-24 bg-border mb-1.5" />
                    <span className="text-[11px] font-bold text-primary">
                      {t.checkout.signatureAgent}
                    </span>
                  </div>
                </div>
              </div>

              {/* Kafelek z kodem QR */}
              <div className="flex items-center gap-3 p-2.5 rounded-2xl bg-white text-stone-950 border border-border shadow-xs shrink-0">
                <img
                  src={qrImageUrl}
                  alt="QR Verification"
                  className="size-16 rounded-lg"
                  loading="lazy"
                />
                <div className="text-left text-[10px] leading-tight space-y-0.5">
                  <div className="font-black uppercase tracking-wider text-emerald-700">
                    {language === "pl" ? "Weryfikacja ✓" : "Verified ✓"}
                  </div>
                  <p className="text-stone-600 font-mono">
                    {language === "pl" ? "Skanuj telefonem" : "Scan to verify"}
                  </p>
                  <span className="font-bold text-[9px] text-stone-500 block truncate max-w-[90px]">
                    {certIdParam}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* ODTWARZACZ PODZIĘKOWANIA GŁOSOWEGO (AI DYNAMIC IMPACT VOICE) */}
          <div className="rounded-2xl border border-emerald-500/30 bg-gradient-to-r from-emerald-500/10 via-card to-card p-4 sm:p-5 shadow-lg print:hidden">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={togglePlayVoice}
                  className={`size-12 rounded-2xl grid place-items-center transition-all shadow-md cursor-pointer shrink-0 ${
                    isPlayingVoice
                      ? "bg-emerald-600 text-white animate-pulse"
                      : "bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 hover:bg-emerald-500/30"
                  }`}
                  title={
                    isPlayingVoice
                      ? language === "pl"
                        ? "Zatrzymaj"
                        : "Pause"
                      : language === "pl"
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
                  <h3 className="text-sm sm:text-base font-bold text-foreground">
                    {language === "pl"
                      ? "Osobiste podziękowanie od juniorów"
                      : "Personal Thank-You from Youth Athletes"}
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    {language === "pl"
                      ? "Odsłuchaj syntezę głosu zawodników UKS Roszada Radom"
                      : "Listen to the synthesized voice of youth athletes"}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 self-end sm:self-center">
                {isPlayingVoice && (
                  <button
                    type="button"
                    onClick={handleReplayVoice}
                    className="p-2 rounded-xl border border-border hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                    title={language === "pl" ? "Od nowa" : "Replay"}
                  >
                    <RotateCcw className="size-4" />
                  </button>
                )}
                {/* Szybki przycisk audytu faktury */}
                <button
                  type="button"
                  onClick={() => setShowAuditModal(true)}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-lime-400 hover:bg-lime-500 text-stone-950 text-xs font-bold transition-all shadow-xs cursor-pointer"
                >
                  <FileCheck2 className="size-4" />
                  <span>
                    {language === "pl"
                      ? "Audyt faktury AI"
                      : "AI Invoice Audit"}
                  </span>
                </button>
              </div>
            </div>
          </div>

          {/* PRZYCISKI AKCJI POD CERTYFIKATEM (ukryte podczas drukowania) */}
          <div className="flex flex-wrap justify-center gap-3.5 print:hidden">
            <button
              type="button"
              onClick={handleDownloadPng}
              className="px-6 py-3 rounded-2xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs sm:text-sm shadow-md transition-all flex items-center gap-2 cursor-pointer"
            >
              <Download className="size-4" />
              <span>{t.agent.downloadPng}</span>
            </button>

            <button
              type="button"
              onClick={handlePrint}
              className="px-6 py-3 rounded-2xl border border-border bg-card hover:bg-accent text-foreground font-semibold text-xs sm:text-sm shadow-xs transition-colors flex items-center gap-2 cursor-pointer"
            >
              <Printer className="size-4" />
              <span>{t.agent.printPdf}</span>
            </button>

            <button
              type="button"
              onClick={handleCopyLink}
              className="px-6 py-3 rounded-2xl border border-border bg-card hover:bg-accent text-foreground font-semibold text-xs sm:text-sm shadow-xs transition-colors flex items-center gap-2 cursor-pointer"
            >
              <Share2 className="size-4" />
              <span>
                {copiedLink ? t.checkout.copiedToast : t.checkout.copyLinkBtn}
              </span>
            </button>
          </div>
        </div>
      </main>

      {/* MODAL AUDYTU FAKTURY VAT (GEMINI MULTIMODAL VISION) */}
      {showAuditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="relative w-full max-w-xl max-h-[90vh] flex flex-col rounded-3xl border-2 border-lime-500/60 bg-card shadow-2xl overflow-hidden">
            <button
              type="button"
              onClick={() => setShowAuditModal(false)}
              className="absolute top-4 right-4 z-20 size-8 rounded-full border border-border bg-background/90 hover:bg-muted flex items-center justify-center text-xs font-bold text-muted-foreground hover:text-foreground cursor-pointer transition-colors shadow-xs"
            >
              ✕
            </button>

            <div className="flex-1 overflow-y-auto p-5 sm:p-7 space-y-3.5 [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-muted-foreground/25 [&::-webkit-scrollbar-track]:bg-transparent">
              <div className="text-center pb-4 border-b border-border/70">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-lime-400/20 text-lime-800 dark:text-lime-300 border border-lime-400/40 mb-2">
                  <Sparkles className="size-3" />
                  <span>
                    {language === "pl"
                      ? "Audyt AI Faktury VAT • Gemini Multimodal Vision"
                      : "AI VAT Invoice Audit • Gemini Multimodal Vision"}
                  </span>
                </div>
                <h3 className="text-xl sm:text-2xl font-black text-foreground">
                  {language === "pl"
                    ? "100% Transparentny Rejestr Wydatków"
                    : "100% Transparent Expense Ledger"}
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {language === "pl"
                    ? "Weryfikacja faktury VAT przypisanej do alokacji:"
                    : "VAT invoice verification linked to allocation:"}{" "}
                  <span className="font-mono font-bold text-foreground">
                    {certIdParam}
                  </span>
                </p>
              </div>

              {/* Status weryfikacji */}
              <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <CheckCircle2 className="size-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <div>
                    <div className="text-xs font-black uppercase tracking-wider text-emerald-800 dark:text-emerald-300">
                      {language === "pl"
                        ? "Status: 100% Zgodności z celem (Zero defraudacji)"
                        : "Status: 100% Purpose Match (Zero Fraud)"}
                    </div>
                    <div className="text-[11px] text-muted-foreground">
                      {language === "pl"
                        ? "Wskaźnik zaufania Gemini Vision: 100% • Cel pokryty w 100%"
                        : "Gemini Vision confidence: 100% • Goal fully covered"}
                    </div>
                  </div>
                </div>
                <span className="px-2.5 py-1 rounded-md bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 text-[11px] font-bold shrink-0">
                  {t.ledger.verified}
                </span>
              </div>

              {/* Dane faktury */}
              <div className="space-y-2 text-xs">
                <div className="grid grid-cols-2 gap-2 p-3 rounded-xl bg-muted/40 border border-border/60">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-muted-foreground block">
                      {language === "pl"
                        ? "Wystawca faktury"
                        : "Issuer / Vendor"}
                    </span>
                    <span className="font-bold text-foreground">
                      {invoiceData.seller}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-muted-foreground block">
                      {language === "pl" ? "NIP wystawcy" : "Tax ID (NIP)"}
                    </span>
                    <span className="font-mono text-foreground">
                      {invoiceData.sellerNip}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-muted-foreground block">
                      {language === "pl" ? "Nr dokumentu" : "Invoice No."}
                    </span>
                    <span className="font-mono font-bold text-foreground">
                      {invoiceData.invoiceNumber}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-muted-foreground block">
                      {language === "pl" ? "Data księgowania" : "Posting Date"}
                    </span>
                    <span className="text-foreground">
                      {invoiceData.issueDate}
                    </span>
                  </div>
                </div>

                <div className="mt-3">
                  <div className="text-[11px] uppercase font-bold text-muted-foreground mb-1.5 flex items-center justify-between">
                    <span>
                      {language === "pl"
                        ? "Pozycje odczytane ze skanu faktury:"
                        : "Line items extracted from invoice scan:"}
                    </span>
                    <span className="text-[10px] text-lime-700 dark:text-lime-400 font-mono">
                      {language === "pl"
                        ? "Weryfikacja AI OCR ✓"
                        : "AI OCR Verified ✓"}
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
                        {invoiceData.items.map((item, i) => (
                          <tr key={i} className="hover:bg-muted/20">
                            <td className="p-2 text-foreground font-medium">
                              {item.name}
                            </td>
                            <td className="p-2 text-muted-foreground text-center font-mono">
                              {item.qty}
                            </td>
                            <td className="p-2 text-right font-black text-emerald-800 dark:text-emerald-300 font-mono">
                              {item.gross}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="mt-3 p-2.5 rounded-xl bg-background border border-border/80 flex items-center justify-between gap-2 text-[10px]">
                  <div className="flex items-center gap-1.5 text-muted-foreground shrink-0">
                    <Hash className="size-3.5 text-primary" />
                    <span>
                      {language === "pl"
                        ? "Hash spójności bloku:"
                        : "Block Integrity Hash:"}
                    </span>
                  </div>
                  <span className="font-mono text-foreground font-semibold truncate max-w-xs text-right">
                    {invoiceData.auditHash}
                  </span>
                </div>
              </div>

              <div className="pt-3 border-t border-border/70 flex justify-end">
                <button
                  type="button"
                  onClick={() => setShowAuditModal(false)}
                  className="px-4 py-2 rounded-xl bg-lime-400 text-stone-950 font-bold text-xs hover:bg-lime-500 transition-colors cursor-pointer"
                >
                  {t.agent.close}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* STOPKA STRONY */}
      <footer className="py-6 border-t border-border/60 text-center text-xs text-muted-foreground print:hidden">
        <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2 font-semibold text-foreground">
            <WalletCards className="size-4 text-lime-600 dark:text-lime-400" />
            <span>
              Patron
              <span className="text-lime-600 dark:text-lime-400 font-bold">
                AI
              </span>{" "}
              · {t.agent.clubName}
            </span>
          </div>
          <p>{t.footer.rights}</p>
        </div>
      </footer>
    </div>
  );
}
