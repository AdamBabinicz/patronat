// components/PatronAgent.tsx
"use client";

import React, { useState, useEffect, useMemo } from "react";
import { FileText, Handshake } from "lucide-react";
import type { Language, Messages } from "@/lib/translations";
import type { Currency } from "./checkout/types";
import { getLocalizedPurpose } from "@/lib/translations/purposeMap";
import BarterAgreementModal from "./agent/BarterAgreementModal";

export interface AllocationPayload {
  goal: string;
  amount: number;
  currency: Currency;
  description: string;
  clubName: string;
  donorName?: string;
  donorWebsite?: string;
  isBarter?: boolean;
}

export interface ImpactForecast {
  beneficiaries: string;
  metric: string;
  socialRoi: string;
  badge: string;
}

interface MatchedGoalResult {
  goal: string;
  amount: number;
  currency: Currency;
  description: string;
  confidence: number;
  category?: string;
  reasoning?: string;
  sponsorshipType?: "financial" | "in_kind";
  inKindDetails?: string;
  detectedDomain?: string;
  companyName?: string;
  impactForecast?: ImpactForecast;
}

interface PatronAgentProps {
  messages: Messages;
  language: Language;
  onSelectAllocation?: (allocation: AllocationPayload) => void;
}

interface RotatingSponsor {
  name: string;
  queryPl: string;
  queryEn: string;
  isCompany: boolean;
  isAnonymous?: boolean;
}

// Deklaracje dla Web Speech API
interface SpeechRecognitionEventLike {
  results: {
    [index: number]: {
      [index: number]: {
        transcript: string;
      };
    };
  };
}

interface SpeechRecognitionErrorEventLike {
  error: string;
}

interface ISpeechRecognitionInstance {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onstart: (() => void) | null;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEventLike) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
}

type SpeechRecognitionConstructor = new () => ISpeechRecognitionInstance;

// Progi kwotowe dla poszczególnych walut
const PRESET_AMOUNTS_BY_CURRENCY: Record<Currency, number[]> = {
  PLN: [100, 250, 400, 600, 1200],
  EUR: [25, 50, 100, 250, 500],
  USD: [25, 50, 100, 250, 500],
};

function convertFromPln(amountPln: number, target: Currency): number {
  if (target === "EUR") return Math.round(amountPln / 4.2 / 5) * 5 || 25;
  if (target === "USD") return Math.round(amountPln / 4.0 / 5) * 5 || 25;
  return amountPln;
}

// Ekstrakcja linku lub domeny z tekstu zapytania
function extractDomainOrUrl(text: string): string {
  const match = text.match(
    /(https?:\/\/[^\s]+|www\.[^\s]+|[a-zA-Z0-9-]+\.(?:pl|com|eu|org|net|io|netlify\.app|vercel\.app)[^\s]*)/i,
  );
  return match ? match[0] : "";
}

// 100% uniwersalny algorytm ekstrakcji czystej marki z domeny lub linku
function formatDomainToBrand(domainOrUrl: string): string {
  try {
    let clean = domainOrUrl
      .trim()
      .toLowerCase()
      .replace(/^https?:\/\//i, "")
      .replace(/^www\./i, "")
      .split("/")[0]
      .split("?")[0];

    // Obsługa platform hostingowych typu grama.netlify.app -> grama
    const hostingMatch = clean.match(
      /^([a-z0-9-]+)\.(netlify\.app|vercel\.app|github\.io|webflow\.io|pages\.dev|render\.com|herokuapp\.com)$/i,
    );
    if (hostingMatch) {
      clean = hostingMatch[1];
    } else {
      // Standardowe TLDs
      clean = clean.replace(
        /\.(com\.pl|net\.pl|org\.pl|edu\.pl|gov\.pl|info\.pl|pl|com|eu|org|net|io|co|de|uk|app)$/i,
        "",
      );
      const parts = clean.split(".");
      clean = parts[parts.length - 1];
    }

    const words = clean.split(/[-_]+/).filter(Boolean);
    if (words.length === 0) return domainOrUrl;

    return words
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(" ");
  } catch {
    return domainOrUrl;
  }
}

// Czyszczenie surowych adresów URL w wygenerowanych tytułach celów
function sanitizeGoalText(
  text: string,
  rawUrl?: string,
  brandName?: string,
): string {
  let result = text;
  if (brandName && rawUrl) {
    const cleanUrl = rawUrl
      .replace(/^https?:\/\//i, "")
      .replace(/^www\./i, "")
      .replace(/\/.*$/, "");
    if (cleanUrl.length > 0) {
      const escaped = cleanUrl.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      result = result.replace(new RegExp(escaped, "gi"), brandName);
    }
  }

  // Zabezpieczenie przed widocznymi końcówkami hostingów w tytule
  result = result.replace(
    /(https?:\/\/)?(?:www\.)?([a-zA-Z0-9-]+)\.(?:netlify\.app|vercel\.app|github\.io|webflow\.io)/gi,
    (_, __, brand) =>
      brand.charAt(0).toUpperCase() + brand.slice(1).toLowerCase(),
  );

  return result;
}

export default function PatronAgent({
  messages,
  language,
  onSelectAllocation,
}: PatronAgentProps) {
  const [query, setQuery] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [matchedGoal, setMatchedGoal] = useState<MatchedGoalResult | null>(
    null,
  );
  const [customAmount, setCustomAmount] = useState<number | null>(null);

  // 100% dynamiczna lista mecenasów pobierana z bazy Neon
  const [sponsorsList, setSponsorsList] = useState<RotatingSponsor[]>([]);
  const [currentSponsorIndex, setCurrentSponsorIndex] = useState(0);
  const [isSponsorFading, setIsSponsorFading] = useState(false);

  const [showBarterModal, setShowBarterModal] = useState(false);

  const [selectedCurrency, setSelectedCurrency] = useState<Currency>(
    language === "en" ? "EUR" : "PLN",
  );

  useEffect(() => {
    setSelectedCurrency(language === "en" ? "EUR" : "PLN");
  }, [language]);

  // Wykrywanie marki z wpisywanego tekstu w czasie rzeczywistym
  const detectedBrandInQuery = useMemo(() => {
    const url = extractDomainOrUrl(query);
    if (!url) return "";
    return formatDomainToBrand(url);
  }, [query]);

  // Pobieranie mecenasów wyłącznie z bazy Neon (przez /api/ledger)
  useEffect(() => {
    let isMounted = true;

    async function fetchSponsorsFromNeon() {
      try {
        const response = await fetch("/api/ledger");
        if (!response.ok) return;

        const data = await response.json();
        const entries = Array.isArray(data)
          ? data
          : data.entries || data.allocations || [];

        if (!Array.isArray(entries) || entries.length === 0) return;

        const extracted: RotatingSponsor[] = [];
        const seenNames = new Set<string>();

        for (const item of entries) {
          const rawName = Array.isArray(item)
            ? item[0]
            : item.patron_name || item.donor_name || item.patron || item.name;

          if (!rawName || typeof rawName !== "string") continue;
          const cleanName = rawName.trim();

          const isAnonymous =
            cleanName.toLowerCase().includes("anonim") ||
            cleanName.toLowerCase().includes("anonymous");

          const dedupKey = isAnonymous ? "anonymous" : cleanName.toLowerCase();
          if (seenNames.has(dedupKey)) {
            continue;
          }
          seenNames.add(dedupKey);

          const isCompany =
            !isAnonymous &&
            (cleanName.toLowerCase().includes("sp.") ||
              cleanName.toLowerCase().includes("sp z") ||
              cleanName.toLowerCase().includes(".pl") ||
              cleanName.toLowerCase().includes(".com") ||
              cleanName.toLowerCase().includes("solutions") ||
              cleanName.toLowerCase().includes("kancelaria") ||
              cleanName.toLowerCase().includes("studio") ||
              cleanName.toLowerCase().includes("firma") ||
              cleanName.toLowerCase().includes("group"));

          const queryUrlPl = isAnonymous
            ? "Anonimowy Darczyńca - statutowe wsparcie młodzieży i klubu"
            : cleanName.includes(".") && !cleanName.includes(" ")
              ? cleanName.startsWith("http")
                ? cleanName
                : `https://${cleanName}`
              : `${cleanName} - wsparcie statutowych celów klubu`;

          const queryUrlEn = isAnonymous
            ? "Anonymous Patron - youth sports development sponsorship"
            : cleanName.includes(".") && !cleanName.includes(" ")
              ? cleanName.startsWith("http")
                ? cleanName
                : `https://${cleanName}`
              : `${cleanName} - youth sports club sponsorship`;

          extracted.push({
            name: cleanName,
            queryPl: queryUrlPl,
            queryEn: queryUrlEn,
            isCompany,
            isAnonymous,
          });
        }

        if (isMounted && extracted.length > 0) {
          setSponsorsList(extracted.sort(() => Math.random() - 0.5));
        }
      } catch (err) {
        console.debug("Baza Neon jeszcze odpowiada lub brak połączenia:", err);
      }
    }

    fetchSponsorsFromNeon();
    return () => {
      isMounted = false;
    };
  }, []);

  // Rotacja mecenasów co 4.5 sekundy
  useEffect(() => {
    if (sponsorsList.length <= 1) return;

    const interval = setInterval(() => {
      setIsSponsorFading(true);
      setTimeout(() => {
        setCurrentSponsorIndex((prev) => (prev + 1) % sponsorsList.length);
        setIsSponsorFading(false);
      }, 300);
    }, 4500);

    return () => clearInterval(interval);
  }, [sponsorsList.length]);

  const activeSponsor = sponsorsList[currentSponsorIndex] || null;

  const tAgent = messages.agent;
  const tAi = messages.ai;

  const toggleVoiceInput = () => {
    if (typeof window === "undefined") return;

    const windowWithSpeech = window as unknown as {
      SpeechRecognition?: SpeechRecognitionConstructor;
      webkitSpeechRecognition?: SpeechRecognitionConstructor;
    };

    const SpeechRecognition =
      windowWithSpeech.SpeechRecognition ||
      windowWithSpeech.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert(
        language === "pl"
          ? "Twoja przeglądarka nie obsługuje rozpoznawania mowy. Użyj pola tekstowego."
          : "Your browser does not support speech recognition. Please type your query.",
      );
      return;
    }

    if (isListening) {
      setIsListening(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = language === "pl" ? "pl-PL" : "en-US";
      recognition.continuous = false;
      recognition.interimResults = false;

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onresult = (event: SpeechRecognitionEventLike) => {
        const transcript = event.results?.[0]?.[0]?.transcript;
        if (transcript) {
          setQuery(transcript);
          handleMatch(transcript);
        }
      };

      recognition.onerror = (event: SpeechRecognitionErrorEventLike) => {
        console.warn("Błąd rozpoznawania mowy:", event.error);
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.start();
    } catch (err) {
      console.warn("Nie można uruchomić mikrofonu:", err);
      setIsListening(false);
    }
  };

  const handleMatch = async (textToAnalyze?: string) => {
    const rawQuery = (
      textToAnalyze !== undefined ? textToAnalyze : query
    ).trim();
    if (!rawQuery) return;

    setIsAnalyzing(true);
    setMatchedGoal(null);
    setCustomAmount(null);

    const detectedUrl = extractDomainOrUrl(rawQuery);
    const localBrandName = detectedUrl ? formatDomainToBrand(detectedUrl) : "";

    try {
      const response = await fetch("/api/agent/match", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: rawQuery,
          locale: language,
          currency: selectedCurrency,
        }),
      });

      if (!response.ok) {
        throw new Error(`Agent API returned status: ${response.status}`);
      }

      const data = await response.json();
      const effectiveAmount =
        Number(data.amount) ||
        (selectedCurrency === "PLN"
          ? 400
          : convertFromPln(400, selectedCurrency));

      const detectedDomain = data.detectedDomain || detectedUrl;
      const resolvedCompany = data.companyName || localBrandName;

      // Oczyszczamy tytuł celu mecenatu, zamieniając surowe domeny na elegancką nazwę marki
      const cleanedGoal = sanitizeGoalText(
        data.goal || tAgent.line,
        detectedDomain,
        resolvedCompany,
      );

      setMatchedGoal({
        goal: cleanedGoal,
        amount: effectiveAmount,
        currency: (data.currency as Currency) || selectedCurrency,
        description: data.description || tAgent.purpose,
        confidence: Number(data.confidence) || 96.5,
        category: data.category,
        reasoning: data.reasoning,
        sponsorshipType:
          data.sponsorshipType || (detectedDomain ? "in_kind" : "financial"),
        inKindDetails: data.inKindDetails,
        detectedDomain,
        companyName: resolvedCompany,
        impactForecast: data.impactForecast,
      });
      setCustomAmount(effectiveAmount);
    } catch (error) {
      console.warn("Błąd komunikacji z agentem AI, używam fallbacku:", error);
      const fallbackAmount =
        selectedCurrency === "PLN"
          ? 400
          : convertFromPln(400, selectedCurrency);

      const isLikelyInKind =
        Boolean(detectedUrl) ||
        rawQuery.toLowerCase().includes("angielsk") ||
        rawQuery.toLowerCase().includes("nauka") ||
        rawQuery.toLowerCase().includes("usług") ||
        rawQuery.toLowerCase().includes("barter") ||
        rawQuery.toLowerCase().includes("catering") ||
        rawQuery.toLowerCase().includes("sprzęt");

      const brandFallback = localBrandName || "Partner B2B";
      const fallbackGoal = detectedUrl
        ? language === "pl"
          ? `Oficjalne partnerstwo B2B z marką ${brandFallback}`
          : `Official B2B Partnership with ${brandFallback}`
        : rawQuery.length > 5
          ? rawQuery
          : tAgent.line;

      setMatchedGoal({
        goal: fallbackGoal,
        amount: fallbackAmount,
        currency: selectedCurrency,
        description: tAgent.purpose,
        confidence: 95.8,
        sponsorshipType: isLikelyInKind ? "in_kind" : "financial",
        detectedDomain: detectedUrl,
        companyName: brandFallback,
        inKindDetails: isLikelyInKind
          ? language === "pl"
            ? `Świadczenie barterowe / usługi promocyjne (${brandFallback})`
            : `In-kind sponsorship & service delivery (${brandFallback})`
          : undefined,
        impactForecast: {
          beneficiaries:
            language === "pl" ? "120 adeptów klubu" : "120 club youth players",
          metric:
            language === "pl"
              ? "Certyfikat CSR i transparentne rozliczenie"
              : "CSR Certificate & transparent ledger entry",
          socialRoi:
            language === "pl"
              ? "100% transparentna alokacja"
              : "100% verifiable community impact",
          badge: language === "pl" ? "Partnerstwo CSR" : "CSR Partnership",
        },
      });
      setCustomAmount(fallbackAmount);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleExampleClick = (exampleText: string) => {
    setQuery(exampleText);
    handleMatch(exampleText);
  };

  const handleCurrencyChange = (newCurrency: Currency) => {
    setSelectedCurrency(newCurrency);
    if (matchedGoal) {
      const basePln = 500;
      const newAmount =
        newCurrency === "PLN" ? basePln : convertFromPln(basePln, newCurrency);
      setCustomAmount(newAmount);
      setMatchedGoal({
        ...matchedGoal,
        currency: newCurrency,
        amount: newAmount,
      });
    }
  };

  const toggleSponsorshipType = (type: "financial" | "in_kind") => {
    if (!matchedGoal) return;
    setMatchedGoal({
      ...matchedGoal,
      sponsorshipType: type,
      inKindDetails:
        type === "in_kind"
          ? matchedGoal.inKindDetails ||
            (language === "pl"
              ? "Świadczenie barterowe dla zawodników"
              : "In-kind barter delivery for club")
          : undefined,
    });
  };

  const handleCommitAllocation = () => {
    if (!matchedGoal) return;

    const finalAmount = customAmount || matchedGoal.amount;
    const isBarter = matchedGoal.sponsorshipType === "in_kind";

    // 100% dynamiczne rozpoznawanie tożsamości mecenasa
    let resolvedDonorName = "";
    let resolvedDonorWebsite = "";

    const rawDomain = matchedGoal.detectedDomain || extractDomainOrUrl(query);

    if (rawDomain) {
      resolvedDonorWebsite = rawDomain.startsWith("http")
        ? rawDomain
        : `https://${rawDomain}`;
    }

    // 1. Sprawdzamy, czy mecenas istnieje w bazie Neon (pobrany w sponsorsList)
    const existingSponsorFromNeon = sponsorsList.find((s) => {
      if (
        rawDomain &&
        (s.name.toLowerCase().includes(rawDomain.toLowerCase()) ||
          s.queryPl.toLowerCase().includes(rawDomain.toLowerCase()) ||
          s.queryEn.toLowerCase().includes(rawDomain.toLowerCase()))
      ) {
        return true;
      }
      return s.name.toLowerCase() === query.trim().toLowerCase();
    });

    if (existingSponsorFromNeon && !existingSponsorFromNeon.isAnonymous) {
      resolvedDonorName = existingSponsorFromNeon.name;
    } else if (
      matchedGoal.companyName &&
      matchedGoal.companyName.trim().length > 0
    ) {
      resolvedDonorName = matchedGoal.companyName.trim();
    } else if (rawDomain) {
      resolvedDonorName = formatDomainToBrand(rawDomain);
    } else if (query.trim().length > 0) {
      resolvedDonorName = query.trim();
    }

    // KLUCZOWE: Gwarantujemy dodanie przedrostka barterowego przed przekazaniem do kasy,
    // co uniemożliwia przypadkowe otworzenie kasy w trybie gotówkowym PayPal!
    const cleanBaseGoal = matchedGoal.goal
      .replace(/^(mecenat rzeczowy|in-kind patronage|barter):\s*/i, "")
      .trim();

    const finalizedGoal = isBarter
      ? language === "pl"
        ? `Mecenat rzeczowy: ${cleanBaseGoal}`
        : `In-Kind Patronage: ${cleanBaseGoal}`
      : cleanBaseGoal;

    const enrichedDescription = resolvedDonorWebsite
      ? `${matchedGoal.description} (${resolvedDonorWebsite})`
      : matchedGoal.description;

    if (onSelectAllocation) {
      onSelectAllocation({
        goal: finalizedGoal,
        amount: finalAmount,
        currency: selectedCurrency,
        description: enrichedDescription,
        clubName: tAgent.clubName,
        donorName: resolvedDonorName,
        donorWebsite: resolvedDonorWebsite,
        isBarter,
      });
    }

    const checkoutEl = document.getElementById("checkout-section");
    if (checkoutEl) {
      checkoutEl.scrollIntoView({ behavior: "smooth" });
    }
  };

  const effectiveAmount =
    customAmount ||
    matchedGoal?.amount ||
    (selectedCurrency === "PLN" ? 400 : 100);

  const getBarterTier = (amount: number, cur: Currency) => {
    const plnEquiv =
      cur === "EUR" ? amount * 4.2 : cur === "USD" ? amount * 4.0 : amount;
    if (plnEquiv >= 1000) {
      return {
        name:
          language === "pl" ? "Złoty Mecenas Rzeczowy" : "Gold In-Kind Patron",
        color:
          "text-amber-900 dark:text-amber-200 bg-amber-500/20 border-amber-500/40 font-black",
      };
    }
    if (plnEquiv >= 500) {
      return {
        name:
          language === "pl"
            ? "Srebrny Mecenas Rzeczowy"
            : "Silver In-Kind Patron",
        color:
          "text-slate-900 dark:text-slate-100 bg-slate-500/20 border-slate-500/40 font-black",
      };
    }
    return {
      name:
        language === "pl"
          ? "Brązowy Mecenas Rzeczowy"
          : "Bronze In-Kind Patron",
      color:
        "text-amber-950 dark:text-amber-100 bg-amber-700/20 border-amber-700/40 font-black",
    };
  };

  const barterTier = getBarterTier(effectiveAmount, selectedCurrency);

  // Zlokalizowany cel dopasowania AI dla prezentacji
  const localizedMatched = matchedGoal
    ? getLocalizedPurpose(matchedGoal.goal, language)
    : null;

  const getSponsorDisplayName = (sponsor: RotatingSponsor) => {
    if (sponsor.isAnonymous) {
      return language === "pl" ? "Anonimowy Darczyńca" : "Anonymous Patron";
    }
    return sponsor.name;
  };

  return (
    <section id="agent-section" className="relative py-7 sm:py-11">
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        <div className="text-center max-w-2xl mx-auto mb-5 sm:mb-7">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase tracking-widest bg-emerald-700/15 text-emerald-900 dark:text-emerald-200 border border-emerald-700/35 mb-2.5">
            <span>⚡</span>
            <span>{tAgent.eyebrow}</span>
          </div>
          <h2 className="text-2xl sm:text-4xl font-black tracking-tight text-foreground">
            {tAgent.title}
          </h2>
          <p className="mt-2 text-xs sm:text-sm text-neutral-700 dark:text-neutral-300 leading-relaxed font-medium">
            {tAgent.body}
          </p>
        </div>

        <div className="rounded-3xl border border-border bg-card p-4 sm:p-6 shadow-xl transition-all">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleMatch();
            }}
            className="flex flex-col sm:flex-row gap-2.5"
          >
            <div className="relative flex-1">
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={
                  isListening
                    ? language === "pl"
                      ? "Słucham... powiedz swoją intencję lub podaj stronę firmy"
                      : "Listening... speak your intention or website"
                    : activeSponsor
                      ? language === "pl"
                        ? `Wpisz intencję, budżet lub stronę (np. ${getSponsorDisplayName(activeSponsor)})...`
                        : `Enter intention, budget or URL (e.g. ${getSponsorDisplayName(activeSponsor)})...`
                      : language === "pl"
                        ? "Wpisz intencję, budżet lub wklej stronę firmy..."
                        : "Enter intention, budget or paste website..."
                }
                className={`w-full px-4 py-2.5 sm:py-3 pr-12 text-sm sm:text-base rounded-2xl border bg-background text-foreground placeholder:text-neutral-700 dark:placeholder:text-neutral-300 focus:outline-none focus:ring-2 focus:ring-emerald-700 transition-all font-medium ${
                  isListening
                    ? "border-red-500 ring-2 ring-red-500/30"
                    : "border-border"
                }`}
              />
              <button
                type="button"
                onClick={toggleVoiceInput}
                title={
                  language === "pl"
                    ? "Podyktuj intencję głosem"
                    : "Dictate intention with voice"
                }
                className={`absolute right-3 top-1/2 -translate-y-1/2 size-8 rounded-xl flex items-center justify-center text-sm transition-all cursor-pointer ${
                  isListening
                    ? "bg-red-500 text-white animate-pulse"
                    : "bg-muted hover:bg-accent text-neutral-700 dark:text-neutral-300 hover:text-foreground"
                }`}
              >
                🎙️
              </button>
            </div>

            <button
              type="submit"
              disabled={isAnalyzing || !query.trim()}
              className="px-6 py-2.5 sm:py-3 rounded-2xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-sm sm:text-base transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md flex items-center justify-center gap-2 cursor-pointer"
            >
              {isAnalyzing ? (
                <>
                  <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>{tAi.analyzing}</span>
                </>
              ) : (
                <>
                  <span>🔍</span>
                  <span>{tAgent.send}</span>
                </>
              )}
            </button>
          </form>

          {/* Wykryta marka w czasie rzeczywistym + Sugerowane przykłady + rotujący mecenas z bazy */}
          <div className="mt-3.5 sm:mt-4 flex flex-wrap items-center gap-1.5 sm:gap-2">
            {detectedBrandInQuery && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-black border border-emerald-500/50 bg-emerald-500/20 text-emerald-950 dark:text-emerald-100 shadow-xs mr-1 animate-in fade-in">
                <span>🌐</span>
                <span>
                  {language === "pl"
                    ? `Wykryto firmę: ${detectedBrandInQuery}`
                    : `Detected company: ${detectedBrandInQuery}`}
                </span>
              </span>
            )}

            <span className="text-[11px] font-black uppercase tracking-wider text-neutral-800 dark:text-neutral-200 mr-1">
              {language === "pl" ? "Przykłady:" : "Examples:"}
            </span>

            {tAgent.examples.map((example, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleExampleClick(example)}
                className="px-2.5 sm:px-3 py-1 rounded-xl text-xs font-semibold border border-border bg-background hover:bg-accent text-neutral-800 hover:text-foreground dark:text-neutral-200 dark:hover:text-white transition-colors cursor-pointer"
              >
                {example}
              </button>
            ))}

            {activeSponsor && (
              <button
                type="button"
                onClick={() =>
                  handleExampleClick(
                    language === "pl"
                      ? activeSponsor.queryPl
                      : activeSponsor.queryEn,
                  )
                }
                title={
                  language === "pl"
                    ? "Kliknij, aby przetestować dopasowanie dla tego darczyńcy z bazy"
                    : "Click to simulate matching for this patron from database"
                }
                className={`inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1 rounded-xl text-xs font-bold border border-emerald-600/40 bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-950 dark:text-emerald-100 transition-all duration-300 cursor-pointer ${
                  isSponsorFading
                    ? "opacity-0 scale-95"
                    : "opacity-100 scale-100"
                }`}
              >
                <span>{activeSponsor.isCompany ? "🌐" : "🤝"}</span>
                <span>
                  {activeSponsor.isCompany
                    ? language === "pl"
                      ? `Firma: ${activeSponsor.name}`
                      : `Company: ${activeSponsor.name}`
                    : activeSponsor.isAnonymous
                      ? language === "pl"
                        ? "Mecenas: Anonimowy Darczyńca"
                        : "Patron: Anonymous Donor"
                      : language === "pl"
                        ? `Mecenas: ${activeSponsor.name}`
                        : `Patron: ${activeSponsor.name}`}
                </span>
              </button>
            )}
          </div>

          {isAnalyzing && (
            <div className="mt-5 p-3.5 sm:p-4 rounded-2xl bg-muted/60 border border-border text-center space-y-1 animate-pulse">
              <div className="text-xs font-black text-emerald-900 dark:text-emerald-200">
                {tAi.matchingGoal}
              </div>
              <p className="text-[11px] font-semibold text-neutral-700 dark:text-neutral-300">
                {tAgent.clubName} • {tAi.confidenceScore}...
              </p>
            </div>
          )}

          {matchedGoal && !isAnalyzing && localizedMatched && (
            <div className="mt-5 rounded-2xl border-2 border-amber-500/40 bg-gradient-to-b from-amber-500/5 via-card to-card p-4 sm:p-6 shadow-md transition-all">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3.5 border-b border-border/70">
                <div className="flex items-center justify-between sm:justify-start gap-2">
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-500/20 text-amber-950 dark:text-amber-100 border border-amber-500/40 shrink-0">
                    <span>✓</span>
                    <span>{tAi.verifiedNeed}</span>
                  </div>

                  <div className="sm:hidden text-xs font-bold text-neutral-700 dark:text-neutral-300">
                    {tAi.confidenceScore}:{" "}
                    <span className="text-emerald-800 dark:text-emerald-400 font-black">
                      {matchedGoal.confidence}%
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-3">
                  <div className="inline-flex items-center rounded-xl bg-muted p-1 text-xs font-bold border border-border shrink-0">
                    <button
                      type="button"
                      onClick={() => toggleSponsorshipType("financial")}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg whitespace-nowrap transition-all cursor-pointer text-xs ${
                        matchedGoal.sponsorshipType !== "in_kind"
                          ? "bg-emerald-600 text-white shadow-xs font-black"
                          : "text-neutral-700 hover:text-foreground dark:text-neutral-300 font-semibold"
                      }`}
                    >
                      <span className="text-sm leading-none">💰</span>
                      <span>
                        {language === "pl" ? "Finansowy" : "Financial"}
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={() => toggleSponsorshipType("in_kind")}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg whitespace-nowrap transition-all cursor-pointer text-xs ${
                        matchedGoal.sponsorshipType === "in_kind"
                          ? "bg-purple-600 text-white shadow-xs font-black"
                          : "text-neutral-700 hover:text-foreground dark:text-neutral-300 font-semibold"
                      }`}
                    >
                      <span className="text-sm leading-none">🎁</span>
                      <span>
                        {language === "pl"
                          ? "Rzeczowy / Barter"
                          : "In-Kind / Barter"}
                      </span>
                    </button>
                  </div>

                  <div className="hidden sm:block text-xs font-bold text-neutral-700 dark:text-neutral-300 shrink-0">
                    {tAi.confidenceScore}:{" "}
                    <span className="text-emerald-800 dark:text-emerald-400 font-black">
                      {matchedGoal.confidence}%
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-3.5 space-y-3">
                <div className="text-xs uppercase font-black tracking-wider text-neutral-800 dark:text-neutral-200">
                  {tAgent.matched}
                </div>

                <div>
                  <h3 className="text-lg sm:text-xl font-black text-foreground">
                    {localizedMatched.text}
                  </h3>
                  {language === "en" &&
                    localizedMatched.wasTranslated &&
                    localizedMatched.originalPl && (
                      <p className="text-xs text-neutral-700 dark:text-neutral-300 italic mt-0.5 font-medium">
                        (PL: {localizedMatched.originalPl})
                      </p>
                    )}
                </div>

                <p className="text-xs sm:text-sm text-neutral-800 dark:text-neutral-200 leading-relaxed font-medium">
                  {matchedGoal.description}
                </p>

                {/* Sekcja mecenatu rzeczowego / umowy barterowej */}
                {matchedGoal.sponsorshipType === "in_kind" && (
                  <div className="p-3.5 sm:p-4 rounded-2xl bg-purple-500/10 border border-purple-500/25 space-y-2.5">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <Handshake className="size-4 text-purple-600 dark:text-purple-400" />
                        <span className="text-xs font-black uppercase tracking-wider text-purple-950 dark:text-purple-100">
                          {language === "pl"
                            ? "AI Barter Valuator • Wycena rynkowa"
                            : "AI Barter Valuator • Market Equivalence"}
                        </span>
                      </div>
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border ${barterTier.color}`}
                      >
                        {barterTier.name}
                      </span>
                    </div>

                    <p className="text-xs text-purple-950 dark:text-purple-100 leading-relaxed font-medium">
                      {matchedGoal.inKindDetails ||
                        (language === "pl"
                          ? `Świadczenie usługowe lub dostarczenie materiałów przez partnera ${matchedGoal.companyName || ""}.`
                          : `Direct services or physical equipment delivery by partner ${matchedGoal.companyName || ""}.`)}
                    </p>

                    <div className="pt-2 border-t border-purple-500/20 text-[11px] text-neutral-700 dark:text-neutral-300 space-y-1">
                      <div className="font-bold text-foreground">
                        {language === "pl"
                          ? "Gwarantowane świadczenia promocyjne klubu:"
                          : "Guaranteed club promotion deliverables:"}
                      </div>
                      <div className="flex flex-wrap gap-2 text-[10px]">
                        <span className="px-2 py-0.5 rounded-md bg-background border border-border font-semibold text-neutral-800 dark:text-neutral-200">
                          ✓{" "}
                          {language === "pl"
                            ? "Ekspozycja banera / logo"
                            : "Banner & Logo exposure"}
                        </span>
                        <span className="px-2 py-0.5 rounded-md bg-background border border-border font-semibold text-neutral-800 dark:text-neutral-200">
                          ✓{" "}
                          {language === "pl"
                            ? "Post w mediach społecznościowych"
                            : "Social media feature"}
                        </span>
                        <span className="px-2 py-0.5 rounded-md bg-background border border-border font-semibold text-neutral-800 dark:text-neutral-200">
                          ✓{" "}
                          {language === "pl"
                            ? "Certyfikat w Publicznym Rejestrze"
                            : "Public Ledger Certificate"}
                        </span>
                      </div>
                    </div>

                    <div className="pt-1 flex justify-end">
                      <button
                        type="button"
                        onClick={() => setShowBarterModal(true)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold transition-all shadow-sm cursor-pointer"
                      >
                        <FileText className="size-3.5" />
                        <span>
                          {language === "pl"
                            ? "Generuj szkic umowy barterowej"
                            : "Generate Barter Agreement Draft"}
                        </span>
                      </button>
                    </div>
                  </div>
                )}

                {/* Pojedyncza, estetyczna plakietka rozpoznanej oficjalnej strony firmy */}
                {matchedGoal.detectedDomain && (
                  <div className="flex items-center gap-1.5 text-[11px] text-emerald-800 dark:text-emerald-300 font-semibold bg-emerald-500/10 p-2.5 rounded-xl border border-emerald-500/25">
                    <span>⚡</span>
                    <span>
                      {language === "pl"
                        ? `Zidentyfikowano oficjalną witrynę partnera: ${matchedGoal.companyName || formatDomainToBrand(matchedGoal.detectedDomain)} (${matchedGoal.detectedDomain}). Rekomendowany certyfikowany mecenat firmowy.`
                        : `Identified official partner website: ${matchedGoal.companyName || formatDomainToBrand(matchedGoal.detectedDomain)} (${matchedGoal.detectedDomain}). Recommended certified corporate patronage.`}
                    </span>
                  </div>
                )}

                {/* Uzasadnienie dopasowania AI (wyświetlane tylko, jeśli nie powiela plakietki witryny) */}
                {matchedGoal.reasoning &&
                  !matchedGoal.reasoning
                    .toLowerCase()
                    .includes("zidentyfikowano oficjalną") &&
                  !matchedGoal.reasoning
                    .toLowerCase()
                    .includes("rekomendowany certyfikowany") && (
                    <p className="text-[11px] text-neutral-800 dark:text-neutral-200 italic bg-muted/50 p-2.5 rounded-xl border border-border/50 font-medium">
                      💡 {matchedGoal.reasoning}
                    </p>
                  )}

                {matchedGoal.impactForecast && (
                  <div className="p-3 sm:p-3.5 rounded-2xl bg-emerald-500/10 dark:bg-emerald-950/20 border border-emerald-500/30 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-emerald-950 dark:text-emerald-100">
                        <span>🌱</span>
                        <span>
                          {language === "pl"
                            ? "AI Prognoza Wpływu Społecznego (Social ROI)"
                            : "AI Social Impact Forecast (ESG ROI)"}
                        </span>
                      </div>
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-950 dark:text-emerald-100 border border-emerald-500/40">
                        {matchedGoal.impactForecast.badge}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1 text-[11px]">
                      <div className="p-2 rounded-xl bg-background/80 border border-border/60">
                        <span className="block text-[10px] uppercase font-bold text-neutral-700 dark:text-neutral-300">
                          {language === "pl"
                            ? "Beneficjenci:"
                            : "Beneficiaries:"}
                        </span>
                        <span className="font-semibold text-foreground">
                          {matchedGoal.impactForecast.beneficiaries}
                        </span>
                      </div>
                      <div className="p-2 rounded-xl bg-background/80 border border-border/60">
                        <span className="block text-[10px] uppercase font-bold text-neutral-700 dark:text-neutral-300">
                          {language === "pl"
                            ? "Wymierny rezultat:"
                            : "Direct Metric:"}
                        </span>
                        <span className="font-semibold text-foreground">
                          {matchedGoal.impactForecast.metric}
                        </span>
                      </div>
                      <div className="p-2 rounded-xl bg-background/80 border border-border/60">
                        <span className="block text-[10px] uppercase font-bold text-neutral-700 dark:text-neutral-300">
                          {language === "pl"
                            ? "Wpływ społeczny:"
                            : "Community ROI:"}
                        </span>
                        <span className="font-semibold text-emerald-800 dark:text-emerald-400">
                          {matchedGoal.impactForecast.socialRoi}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                <div className="pt-3 border-t border-border/60">
                  <div className="flex flex-wrap items-center justify-between gap-3 sm:gap-4">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[11px] text-neutral-800 dark:text-neutral-200 uppercase font-bold tracking-wider">
                          {matchedGoal.sponsorshipType === "in_kind"
                            ? language === "pl"
                              ? "Szacowana wartość świadczenia:"
                              : "Estimated In-Kind Value:"
                            : tAgent.allocation}
                        </span>

                        <div className="flex items-center rounded-lg bg-muted p-0.5 text-[10px] font-bold border border-border">
                          {(["PLN", "EUR", "USD"] as Currency[]).map((cur) => (
                            <button
                              key={cur}
                              type="button"
                              onClick={() => handleCurrencyChange(cur)}
                              className={`px-2 py-0.5 rounded-md transition-all cursor-pointer ${
                                selectedCurrency === cur
                                  ? "bg-card text-foreground shadow-xs font-black border border-border/60"
                                  : "text-neutral-700 hover:text-foreground dark:text-neutral-300 font-semibold"
                              }`}
                            >
                              {cur}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xl sm:text-2xl font-black text-emerald-800 dark:text-emerald-300">
                          {effectiveAmount} {selectedCurrency}
                        </span>

                        <div className="flex items-center gap-1 ml-2">
                          {PRESET_AMOUNTS_BY_CURRENCY[selectedCurrency].map(
                            (preset) => (
                              <button
                                key={preset}
                                type="button"
                                onClick={() => setCustomAmount(preset)}
                                className={`px-2 py-0.5 text-[10px] font-bold rounded-lg border transition-all cursor-pointer ${
                                  effectiveAmount === preset
                                    ? "bg-emerald-700 text-white border-emerald-700 shadow-xs"
                                    : "border-border bg-background text-neutral-800 hover:text-foreground dark:text-neutral-200 font-semibold"
                                }`}
                              >
                                {preset}
                              </button>
                            ),
                          )}
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={handleCommitAllocation}
                      className="px-5 sm:px-6 py-2.5 sm:py-3 rounded-xl bg-amber-500 hover:bg-amber-600 active:scale-[0.99] text-stone-950 font-black text-xs sm:text-sm transition-all shadow-md flex items-center gap-2 cursor-pointer"
                    >
                      <span>⚡</span>
                      <span>
                        {matchedGoal.sponsorshipType === "in_kind"
                          ? language === "pl"
                            ? "Potwierdź mecenat rzeczowy"
                            : "Confirm In-Kind Patronage"
                          : tAgent.paypal}
                      </span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal porozumienia barterowego */}
        {showBarterModal && matchedGoal && (
          <BarterAgreementModal
            isOpen={showBarterModal}
            onClose={() => setShowBarterModal(false)}
            language={language}
            clubName={tAgent.clubName}
            goal={localizedMatched?.text || matchedGoal.goal}
            inKindDetails={matchedGoal.inKindDetails}
            detectedDomain={matchedGoal.detectedDomain}
            amount={effectiveAmount}
            currency={selectedCurrency}
            barterTierName={barterTier.name}
          />
        )}
      </div>
    </section>
  );
}
