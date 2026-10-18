// app/page.tsx
"use client";

import { useEffect, useState, useCallback } from "react";
import dynamic from "next/dynamic";
import {
  ArrowRight,
  ArrowUpRight,
  Moon,
  Sun,
  WalletCards,
  X,
  Loader2,
} from "lucide-react";
import {
  type Language,
  type Messages,
  getTranslations,
} from "@/lib/translations";
import PatronAgent, { type AllocationPayload } from "@/components/PatronAgent";
import CookieBanner from "@/components/CookieBanner";
import Footer from "@/components/Footer";
import type { Currency } from "@/components/checkout/types";
import type { LedgerEntry } from "@/components/PublicLedger";

// Dynamiczne ładowanie komponentów poniżej ekranu głównego (drastycznie odchudza startowy bundle JS)
const DonationCheckout = dynamic(
  () => import("@/components/DonationCheckout"),
  {
    ssr: false,
  },
);

// Językowo-neutralny loader oparty o animowany spinner (brak twardo zakodowanych tekstów)
const PublicLedger = dynamic(() => import("@/components/PublicLedger"), {
  ssr: false,
  loading: () => (
    <div className="py-16 flex items-center justify-center gap-2 text-xs text-muted-foreground font-mono">
      <Loader2 className="size-4 animate-spin text-lime-500" />
    </div>
  ),
});

// Standardowy kurs przeliczeniowy spójny z tabelą rejestru (1 EUR ≈ 4.30 PLN)
const EUR_EXCHANGE_RATE = 4.3;

export default function Page() {
  const [language, setLanguage] = useState<Language>("pl");
  const [dark, setDark] = useState(true);

  // Sterowanie widocznością kasy – domyślnie UKRYTA
  const [isCheckoutVisible, setIsCheckoutVisible] = useState(false);
  const [selectedAllocation, setSelectedAllocation] =
    useState<AllocationPayload | null>(null);

  // Stabilny stan początkowy zapobiegający przesunięciu LCP
  const [dbStats, setDbStats] = useState<{
    totalAmount: number;
    count: number;
  }>({
    totalAmount: 18012,
    count: 33,
  });

  // Dynamiczny stan sesyjny w czasie rzeczywistym (optimistic UI)
  const [extraRaisedAmount, setExtraRaisedAmount] = useState<number>(0);
  const [extraVerifiedCount, setExtraVerifiedCount] = useState<number>(0);
  const [liveEntries, setLiveEntries] = useState<LedgerEntry[]>([]);

  const t: Messages = getTranslations(language);

  // Funkcja pobierająca zagregowane sumy bezpośrednio z bazy Neon PostgreSQL
  const fetchLiveDatabaseStats = useCallback(async () => {
    try {
      const res = await fetch("/api/ledger");
      if (!res.ok) return;

      const data = await res.json();
      let total = 0;
      let count = 0;

      if (data.stats && typeof data.stats.totalAmount === "number") {
        total = data.stats.totalAmount;
      } else if (typeof data.totalAmount === "number") {
        total = data.totalAmount;
      } else if (Array.isArray(data.allocations)) {
        total = data.allocations.reduce(
          (sum: number, item: { amount?: number | string }) =>
            sum + (Number(item.amount) || 0),
          0,
        );
      }

      if (data.stats && typeof data.stats.totalCount === "number") {
        count = data.stats.totalCount;
      } else if (
        typeof data.totalCount === "number" ||
        typeof data.count === "number"
      ) {
        count = data.totalCount ?? data.count;
      } else if (Array.isArray(data.allocations)) {
        count = data.allocations.length;
      }

      if (total > 0) {
        setDbStats({ totalAmount: total, count });
      }
    } catch {
      // W razie chwilowego braku sieci zachowaj obecny stan
    }
  }, []);

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

    // 3. Wczytanie utrwalonych transakcji z bieżącej sesji
    try {
      const savedExtra =
        Number(window.localStorage.getItem("patronai_extra_amount")) || 0;
      const savedCount =
        Number(window.localStorage.getItem("patronai_extra_count")) || 0;
      const savedEntries = JSON.parse(
        window.localStorage.getItem("patronai_live_entries") || "[]",
      );
      setExtraRaisedAmount(savedExtra);
      setExtraVerifiedCount(savedCount);
      if (Array.isArray(savedEntries)) {
        setLiveEntries(savedEntries);
      }
    } catch {}

    // 4. Pobranie danych w tle
    fetchLiveDatabaseStats();
  }, [fetchLiveDatabaseStats]);

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

  const scrollToCheckout = () => {
    setIsCheckoutVisible(true);
    setTimeout(() => {
      const el = document.getElementById("checkout-section");
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }, 100);
  };

  const handleAllocationFromAgent = (allocation: AllocationPayload) => {
    setSelectedAllocation(allocation);
    scrollToCheckout();
  };

  // Obsługa kliknięcia w dolne kafelki procesu
  const handleStepCardClick = (stepIndex: number) => {
    if (stepIndex === 0) {
      const agentInput = document.querySelector<HTMLInputElement>(
        'input[placeholder*="Krzysztof"], input[placeholder*="intencj"], input[placeholder*="intention"], input[type="text"]',
      );
      if (agentInput) {
        agentInput.scrollIntoView({ behavior: "smooth", block: "center" });
        setTimeout(() => agentInput.focus(), 400);
      } else {
        document.getElementById("top")?.scrollIntoView({ behavior: "smooth" });
      }
    } else if (stepIndex === 1) {
      scrollToCheckout();
    } else if (stepIndex === 2) {
      const ledgerSection = document.getElementById("ledger-section");
      if (ledgerSection) {
        ledgerSection.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }
  };

  // Rejestracja udanej transakcji w czasie rzeczywistym
  const handlePaymentSuccess = (details: any) => {
    const paidAmount =
      Number(details.amount) || selectedAllocation?.amount || 100;
    const paidCurrency =
      details.currency || selectedAllocation?.currency || "PLN";
    const patronName =
      details.donorName || details.patronName || t.checkout.defaultAnonymous;
    const goalTitle =
      details.goal || selectedAllocation?.goal || t.checkout.defaultGoal;
    const orderId =
      details.orderId ||
      details.id ||
      `ROSZADA-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`;

    const formattedAmountEntry =
      language === "en"
        ? `${paidCurrency} ${paidAmount}`
        : `${paidAmount} ${paidCurrency}`;

    const newEntry: LedgerEntry = [
      patronName,
      goalTitle,
      formattedAmountEntry,
      orderId,
    ];

    const updatedExtra = extraRaisedAmount + paidAmount;
    const updatedCount = extraVerifiedCount + 1;
    const updatedEntries = [newEntry, ...liveEntries];

    setExtraRaisedAmount(updatedExtra);
    setExtraVerifiedCount(updatedCount);
    setLiveEntries(updatedEntries);

    try {
      window.localStorage.setItem(
        "patronai_extra_amount",
        String(updatedExtra),
      );
      window.localStorage.setItem("patronai_extra_count", String(updatedCount));
      window.localStorage.setItem(
        "patronai_live_entries",
        JSON.stringify(updatedEntries),
      );
    } catch {}

    fetchLiveDatabaseStats();
  };

  const totalPln = dbStats.totalAmount + extraRaisedAmount;

  const isEurMode = language === "en" || t.stats.currency === "EUR";
  const displayAmount = isEurMode
    ? Math.round(totalPln / EUR_EXCHANGE_RATE)
    : totalPln;

  const currentTotalAmount =
    language === "pl"
      ? displayAmount.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ")
      : displayAmount.toLocaleString("en-US");

  const currentTotalCount = dbStats.count + extraVerifiedCount;

  return (
    <>
      <main className="min-h-screen bg-slate-50 text-neutral-900 dark:bg-neutral-950 dark:text-neutral-100">
        {/* HEADER / NAWIGACJA */}
        <header className="fixed top-0 left-0 right-0 z-40 border-b border-neutral-200/80 bg-slate-50/90 backdrop-blur-md dark:border-neutral-800/80 dark:bg-neutral-950/90">
          <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-3.5 sm:py-4">
            <a href="#top" className="flex items-center gap-3 font-semibold">
              <span className="grid size-9 place-items-center rounded-xl bg-lime-400 text-neutral-950 shadow-sm">
                <WalletCards className="size-5" />
              </span>
              <span className="text-lg">
                Patron
                <span className="text-lime-600 dark:text-lime-400 font-bold">
                  AI
                </span>
              </span>
            </a>

            <nav className="flex items-center gap-2">
              <button
                type="button"
                aria-label={t.nav.theme}
                onClick={toggleTheme}
                className="grid size-9 place-items-center rounded-full border border-neutral-300 bg-white text-neutral-800 hover:bg-neutral-100 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-200 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
              >
                {dark ? (
                  <Sun className="size-4" />
                ) : (
                  <Moon className="size-4" />
                )}
              </button>

              <div className="flex items-center rounded-full border border-neutral-300 bg-white p-0.5 text-xs font-bold dark:border-neutral-700 dark:bg-neutral-900">
                <button
                  type="button"
                  onClick={() => handleLanguageChange("pl")}
                  className={`rounded-full px-2.5 py-1 transition-all cursor-pointer ${
                    language === "pl"
                      ? "bg-lime-400 text-neutral-950 shadow-xs"
                      : "text-neutral-700 hover:text-neutral-950 dark:text-neutral-300 dark:hover:text-white"
                  }`}
                >
                  PL
                </button>
                <button
                  type="button"
                  onClick={() => handleLanguageChange("en")}
                  className={`rounded-full px-2.5 py-1 transition-all cursor-pointer ${
                    language === "en"
                      ? "bg-lime-400 text-neutral-950 shadow-xs"
                      : "text-neutral-700 hover:text-neutral-950 dark:text-neutral-300 dark:hover:text-white"
                  }`}
                >
                  EN
                </button>
              </div>

              <button
                type="button"
                onClick={scrollToCheckout}
                className="hidden sm:block rounded-full bg-neutral-900 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-neutral-800 dark:bg-white dark:text-neutral-950 dark:hover:bg-neutral-100 transition-all cursor-pointer"
              >
                {t.nav.become}
              </button>
            </nav>
          </div>
        </header>

        {/* HERO SECTION */}
        <section
          id="top"
          className="mx-auto grid max-w-7xl gap-8 px-5 pt-24 pb-10 sm:pt-28 sm:pb-14 lg:grid-cols-2 lg:gap-12 lg:pt-32 lg:pb-16"
        >
          <div>
            <p className="mb-3 text-xs font-bold uppercase tracking-widest text-lime-700 dark:text-lime-400">
              {t.hero.eyebrow}
            </p>
            <h1 className="text-3xl font-extrabold tracking-tight text-neutral-900 sm:text-5xl lg:text-6xl dark:text-white leading-tight">
              {t.hero.title}
            </h1>
            <p className="mt-4 sm:mt-6 max-w-xl text-base sm:text-lg leading-relaxed text-neutral-700 dark:text-neutral-300">
              {t.hero.body}
            </p>
            <button
              type="button"
              onClick={scrollToCheckout}
              className="mt-6 sm:mt-8 inline-flex items-center gap-2 rounded-full bg-lime-400 px-6 py-3.5 text-sm font-bold text-neutral-950 shadow-md transition-transform hover:scale-105 hover:bg-lime-300 cursor-pointer"
            >
              <span>{t.hero.primary}</span>
              <ArrowRight className="size-4" />
            </button>
          </div>

          <div className="rounded-3xl border border-neutral-300 bg-white p-6 sm:p-8 text-neutral-900 shadow-sm dark:border-neutral-800 dark:bg-neutral-900/90 dark:text-white">
            <p className="text-xs font-bold uppercase tracking-wider text-neutral-700 dark:text-neutral-300">
              {t.stats.raised}
            </p>

            <p className="mt-2.5 sm:mt-3 text-4xl sm:text-5xl font-black tracking-tight text-neutral-900 dark:text-white inline-flex items-baseline gap-2 flex-nowrap whitespace-nowrap">
              {isEurMode ? (
                <>
                  <span className="text-xl sm:text-2xl font-bold text-neutral-700 dark:text-neutral-200 font-mono">
                    {t.stats.currency}
                  </span>
                  <span>{currentTotalAmount}</span>
                </>
              ) : (
                <>
                  <span>{currentTotalAmount}</span>
                  <span className="text-xl sm:text-2xl font-bold text-neutral-700 dark:text-neutral-200 font-mono">
                    {t.stats.currency}
                  </span>
                </>
              )}
            </p>

            <div className="mt-6 h-2.5 rounded-full bg-neutral-200 dark:bg-neutral-800 overflow-hidden">
              <div className="h-full w-3/4 rounded-full bg-lime-400" />
            </div>
            <p className="mt-3 text-xs font-bold text-neutral-700 dark:text-neutral-300">
              {t.stats.verified}: {currentTotalCount}
            </p>
          </div>
        </section>

        {/* 1. SILNIK AGENTIC COMMERCE (PATRON AGENT) */}
        <PatronAgent
          messages={t}
          language={language}
          onSelectAllocation={handleAllocationFromAgent}
        />

        {/* 2. KASA MECENATU (DYNAMICZNA) */}
        {isCheckoutVisible && (
          <section
            id="checkout-section"
            className="py-10 sm:py-14 bg-emerald-500/5 dark:bg-emerald-950/15 border-y border-emerald-500/20 animate-in fade-in slide-in-from-bottom-6 duration-300"
          >
            <div className="max-w-4xl mx-auto px-4 sm:px-6">
              <div className="relative text-center max-w-xl mx-auto mb-6 sm:mb-8">
                <button
                  type="button"
                  onClick={() => setIsCheckoutVisible(false)}
                  className="absolute right-0 top-0 p-2 text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white transition-colors cursor-pointer"
                  aria-label={t.agent.close}
                >
                  <X className="size-5" />
                </button>

                <span className="text-xs font-black uppercase tracking-widest text-emerald-800 dark:text-emerald-300">
                  {t.checkout.stepEyebrow}
                </span>
                <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-neutral-900 dark:text-white mt-1">
                  {t.checkout.title}
                </h2>
              </div>

              <DonationCheckout
                key={
                  selectedAllocation
                    ? `${selectedAllocation.goal}-${selectedAllocation.amount}-${language}`
                    : `default-${language}`
                }
                messages={t}
                initialLocale={language}
                initialGoal={selectedAllocation?.goal}
                initialAmount={
                  selectedAllocation?.amount || (language === "en" ? 25 : 100)
                }
                initialCurrency={
                  selectedAllocation?.currency ||
                  (language === "en"
                    ? ("EUR" as Currency)
                    : ("PLN" as Currency))
                }
                allocationDescription={selectedAllocation?.description}
                clubName={selectedAllocation?.clubName || t.agent.clubName}
                onSuccessCallback={handlePaymentSuccess}
              />
            </div>
          </section>
        )}

        {/* 3. PUBLICZNY REJESTR ALOKACJI (DYNAMICZNY - CODE SPLIT) */}
        <PublicLedger
          messages={t}
          language={language}
          extraEntries={liveEntries}
        />

        {/* 4. INTERAKTYWNE KARTY PROCESU */}
        <section
          aria-labelledby="impact-heading"
          className="mx-auto max-w-7xl px-5 py-10 sm:py-14"
        >
          <h2 id="impact-heading" className="sr-only">
            {t.impact.heading}
          </h2>

          <div className="grid gap-6 md:grid-cols-3">
            {t.impact.cards.map((card, i) => {
              const actionLabel = t.impact.actionLabels[i] || card.title;

              return (
                <div
                  key={card.title}
                  tabIndex={0}
                  onClick={() => handleStepCardClick(i)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      handleStepCardClick(i);
                    }
                  }}
                  className="group text-left rounded-3xl border border-neutral-300 bg-white p-6 sm:p-8 text-neutral-900 shadow-sm hover:shadow-md hover:border-lime-500/60 dark:border-neutral-800 dark:bg-neutral-900/60 dark:text-white dark:hover:border-lime-500/50 transition-all cursor-pointer transform hover:-translate-y-1 active:translate-y-0 flex flex-col justify-between"
                  title={`${actionLabel} ↗`}
                >
                  <div>
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-black text-lime-600 dark:text-lime-400 uppercase tracking-widest font-mono">
                        0{i + 1}
                      </span>
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-neutral-700 dark:text-neutral-200 group-hover:text-lime-700 dark:group-hover:text-lime-300 transition-colors">
                        <span>{actionLabel}</span>
                        <ArrowUpRight className="size-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 text-lime-600 dark:text-lime-400" />
                      </span>
                    </div>

                    <h3 className="mt-4 sm:mt-5 text-xl font-bold tracking-tight group-hover:text-lime-700 dark:group-hover:text-lime-400 transition-colors">
                      {card.title}
                    </h3>
                    <p className="mt-2.5 text-xs sm:text-sm leading-relaxed text-neutral-700 dark:text-neutral-300">
                      {card.body}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* WYDZIELONY KOMPONENT STOPKI */}
        <Footer messages={t} />
      </main>

      {/* WYDZIELONY KOMPONENT BANERA COOKIE */}
      <CookieBanner messages={t} />
    </>
  );
}
