// app/page.tsx
"use client";

import { useEffect, useState, useCallback } from "react";
import { ArrowRight, Cookie, Moon, Sun, WalletCards, X } from "lucide-react";
import {
  type Language,
  type Messages,
  getTranslations,
} from "@/lib/translations";
import PatronAgent, { type AllocationPayload } from "@/components/PatronAgent";
import DonationCheckout from "@/components/DonationCheckout";
import PublicLedger, { type LedgerEntry } from "@/components/PublicLedger";
import type { Currency } from "@/components/checkout/types";

// Standardowy kurs przeliczeniowy spójny z tabelą rejestru (1 EUR ≈ 4.30 PLN)
const EUR_EXCHANGE_RATE = 4.3;

export default function Page() {
  const [language, setLanguage] = useState<Language>("pl");
  const [dark, setDark] = useState(true);

  // Sterowanie widocznością kasy – domyślnie UKRYTA
  const [isCheckoutVisible, setIsCheckoutVisible] = useState(false);
  const [selectedAllocation, setSelectedAllocation] =
    useState<AllocationPayload | null>(null);

  // Dynamiczny stan licznika pobierany na żywo z bazy Neon PostgreSQL
  const [dbStats, setDbStats] = useState<{
    totalAmount: number;
    count: number;
  } | null>(null);

  // Dynamiczny stan sesyjny w czasie rzeczywistym (optimistic UI)
  const [extraRaisedAmount, setExtraRaisedAmount] = useState<number>(0);
  const [extraVerifiedCount, setExtraVerifiedCount] = useState<number>(0);
  const [liveEntries, setLiveEntries] = useState<LedgerEntry[]>([]);

  // Zgody Cookie
  const [showCookies, setShowCookies] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [analytics, setAnalytics] = useState(false);
  const [marketing, setMarketing] = useState(false);

  const t: Messages = getTranslations(language);

  // Funkcja pobierająca zagregowane sumy bezpośrednio z bazy Neon PostgreSQL
  const fetchLiveDatabaseStats = useCallback(async () => {
    try {
      const res = await fetch("/api/ledger");
      if (!res.ok) return;

      const data = await res.json();
      let total = 0;
      let count = 0;

      // 1. Priorytet: odczyt z obiektu stats zwracanego przez Neon DB
      if (data.stats && typeof data.stats.totalAmount === "number") {
        total = data.stats.totalAmount;
      } else if (typeof data.totalAmount === "number") {
        total = data.totalAmount;
      } else if (Array.isArray(data.allocations)) {
        // Fallback: suma kwot z pobranej listy alokacji
        total = data.allocations.reduce(
          (sum: number, item: { amount?: number | string }) =>
            sum + (Number(item.amount) || 0),
          0,
        );
      }

      // 2. Liczba zweryfikowanych alokacji z Neon DB
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

      if (count > 0 || total > 0) {
        setDbStats({ totalAmount: total, count });
      }
    } catch {
      // W razie chwilowego braku sieci zachowaj stan fallback
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

    // 3. Cookie
    const consent = window.localStorage.getItem("patronai_cookie_consent");
    if (consent) setShowCookies(false);

    // 4. Wczytanie utrwalonych transakcji z bieżącej sesji
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
    } catch {
      // Ignoruj błędy parsowania
    }

    // 5. Pobranie rzeczywistych danych statystycznych z bazy Neon
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
        el.scrollIntoView({ behavior: "smooth" });
      }
    }, 100);
  };

  const handleAllocationFromAgent = (allocation: AllocationPayload) => {
    setSelectedAllocation(allocation);
    scrollToCheckout();
  };

  // Rejestracja udanej transakcji w czasie rzeczywistym
  const handlePaymentSuccess = (details: any) => {
    const paidAmount =
      Number(details.amount) || selectedAllocation?.amount || 100;
    const paidCurrency =
      details.currency || selectedAllocation?.currency || "PLN";
    const patronName =
      details.donorName ||
      details.patronName ||
      (language === "pl" ? "Anonimowy Mecenas" : "Anonymous Patron");
    const goalTitle =
      details.goal ||
      selectedAllocation?.goal ||
      (language === "pl" ? "Wsparcie klubu" : "Club Support");
    const orderId =
      details.orderId ||
      details.id ||
      `ROSZADA-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`;

    const newEntry: LedgerEntry = [
      patronName,
      goalTitle,
      `${paidAmount} ${paidCurrency}`,
      orderId,
    ];

    const updatedExtra = extraRaisedAmount + paidAmount;
    const updatedCount = extraVerifiedCount + 1;
    const updatedEntries = [newEntry, ...liveEntries];

    setExtraRaisedAmount(updatedExtra);
    setExtraVerifiedCount(updatedCount);
    setLiveEntries(updatedEntries);

    // Zapis do localStorage dla utrwalenia efektu po przeładowaniu
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
    } catch {
      // Ignoruj
    }

    // Odśwież dane bezpośrednio z bazy Neon
    fetchLiveDatabaseStats();
  };

  // 100% Dynamiczne formatowanie statystyk z bazy Neon (w PLN)
  const baseRaisedPln =
    dbStats !== null
      ? dbStats.totalAmount
      : parseInt(t.stats.amount.replace(/\s+/g, ""), 10) || 19945;

  const totalPln = baseRaisedPln + extraRaisedAmount;

  // Przeliczenie kwoty na walutę interfejsu (EUR w wersji EN)
  const isEurMode = language === "en" || t.stats.currency === "EUR";
  const displayAmount = isEurMode
    ? Math.round(totalPln / EUR_EXCHANGE_RATE)
    : totalPln;

  const currentTotalAmount = displayAmount.toLocaleString(
    language === "pl" ? "pl-PL" : "en-US",
  );

  const baseCount =
    dbStats !== null
      ? dbStats.count
      : parseInt(t.stats.verifiedCount, 10) || 130;

  const currentTotalCount = baseCount + extraVerifiedCount;

  const saveConsent = (a: boolean, m: boolean) => {
    window.localStorage.setItem(
      "patronai_cookie_consent",
      JSON.stringify({
        essential: true,
        analytics: a,
        marketing: m,
        timestamp: new Date().toISOString(),
      }),
    );
    setAnalytics(a);
    setMarketing(m);
    setShowCookies(false);
    setShowSettings(false);
  };

  return (
    <>
      <main className="min-h-screen bg-slate-50 text-neutral-900 transition-colors duration-200 dark:bg-neutral-950 dark:text-neutral-100">
        {/* HEADER / NAWIGACJA */}
        <header className="sticky top-0 z-30 border-b border-neutral-200 bg-slate-50/95 backdrop-blur dark:border-neutral-800 dark:bg-neutral-950/95">
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
              {/* Przełącznik motywu ciemny/jasny */}
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

              {/* Segmentowy, czytelny przełącznik języka [ PL | EN ] */}
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

              {/* Przycisk CTA Zostań mecenasem */}
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

        {/* HERO SECTION + STATYSTYKI ZE ZBALANSOWANYM RYTMEM PIONOWYM */}
        <section
          id="top"
          className="mx-auto grid max-w-7xl gap-8 px-5 py-10 sm:py-14 lg:grid-cols-2 lg:gap-12 lg:py-16"
        >
          <div>
            <p className="mb-3 text-xs font-bold uppercase tracking-widest text-lime-600 dark:text-lime-400">
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
            <p className="mt-2.5 sm:mt-3 text-4xl sm:text-5xl font-black tracking-tight text-neutral-900 dark:text-white transition-all">
              {currentTotalAmount}{" "}
              <span className="text-lg font-medium text-neutral-600 dark:text-neutral-400">
                {t.stats.currency}
              </span>
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

        {/* 2. KASA MECENATU – POKAZYWANA TYLKO PO DECYZJI MECENASA */}
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
                  {language === "pl"
                    ? "Krok 02 · Finalizacja alokacji"
                    : "Step 02 · Allocation checkout"}
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

        {/* 3. PUBLICZNY REJESTR ALOKACJI (PUBLIC LEDGER Z OBSŁUGĄ LIVE ENTRIES) */}
        <PublicLedger
          messages={t}
          language={language}
          extraEntries={liveEntries}
        />

        {/* 4. KARTY WPŁYWU (IMPACT CARDS) ZE ZMNIEJSZONĄ PUSTKĄ */}
        <section className="mx-auto max-w-7xl px-5 py-10 sm:py-14">
          <div className="grid gap-6 md:grid-cols-3">
            {t.impact.cards.map((card, i) => (
              <article
                key={card.title}
                className="rounded-3xl border border-neutral-300 bg-white p-6 sm:p-8 text-neutral-900 shadow-sm dark:border-neutral-800 dark:bg-neutral-900/60 dark:text-white"
              >
                <span className="text-xs font-black text-lime-600 dark:text-lime-400 uppercase tracking-widest">
                  0{i + 1}
                </span>
                <h3 className="mt-4 sm:mt-6 text-xl font-bold tracking-tight">
                  {card.title}
                </h3>
                <p className="mt-2.5 sm:mt-3 text-xs sm:text-sm leading-relaxed text-neutral-700 dark:text-neutral-300">
                  {card.body}
                </p>
              </article>
            ))}
          </div>
        </section>

        {/* FOOTER - ZWIĘKSZONY KONTRAST DLA WCAG AA ORAZ ZWARTY PADDING */}
        <footer className="border-t border-neutral-300 dark:border-neutral-800 bg-slate-100 dark:bg-neutral-950">
          <div className="mx-auto flex max-w-7xl flex-col gap-6 px-5 py-8 sm:py-10 text-sm text-neutral-700 dark:text-neutral-300 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <div className="font-bold text-base text-neutral-900 dark:text-white">
                Patron
                <span className="text-lime-600 dark:text-lime-400">AI</span>
              </div>
              <p className="mt-2 max-w-sm text-xs sm:text-sm leading-relaxed text-neutral-700 dark:text-neutral-300">
                {t.footer.description}
              </p>
              <p className="mt-4 text-xs text-neutral-700 dark:text-neutral-300 font-medium">
                {t.footer.rights}
              </p>
            </div>
            <div className="flex flex-wrap gap-5 text-xs sm:text-sm font-semibold">
              <a
                href="/polityka-prywatnosci"
                className="hover:underline text-neutral-800 dark:text-neutral-200"
              >
                {t.footer.privacy}
              </a>
              <a
                href="/regulamin"
                className="hover:underline text-neutral-800 dark:text-neutral-200"
              >
                {t.footer.terms}
              </a>
              <button
                type="button"
                onClick={() => setShowSettings(true)}
                className="hover:underline text-neutral-800 dark:text-neutral-200 cursor-pointer"
              >
                {t.footer.cookie}
              </button>
            </div>
          </div>
        </footer>
      </main>

      {/* BANER COOKIE */}
      {showCookies && (
        <div className="fixed inset-x-4 bottom-4 z-40 mx-auto max-w-3xl rounded-3xl border border-neutral-300 bg-white p-5 shadow-2xl dark:border-neutral-800 dark:bg-neutral-900">
          <div className="flex gap-3">
            <Cookie className="mt-1 size-5 shrink-0 text-lime-600 dark:text-lime-400" />
            <div className="flex-1">
              <h2 className="font-bold text-sm text-neutral-900 dark:text-white">
                {t.cookie.title}
              </h2>
              <p className="mt-1 text-xs text-neutral-700 dark:text-neutral-300 leading-relaxed">
                {t.cookie.body}
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => saveConsent(true, true)}
                  className="rounded-full bg-neutral-900 px-4 py-2 text-xs font-bold text-white hover:bg-neutral-800 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-100 transition-colors cursor-pointer"
                >
                  {t.cookie.accept}
                </button>
                <button
                  type="button"
                  onClick={() => saveConsent(false, false)}
                  className="rounded-full border border-neutral-400 px-4 py-2 text-xs font-semibold text-neutral-800 hover:bg-neutral-100 dark:border-neutral-600 dark:text-neutral-200 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
                >
                  {t.cookie.reject}
                </button>
                <button
                  type="button"
                  onClick={() => setShowSettings(true)}
                  className="rounded-full border border-neutral-400 px-4 py-2 text-xs font-semibold text-neutral-800 hover:bg-neutral-100 dark:border-neutral-600 dark:text-neutral-200 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
                >
                  {t.cookie.settings}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL COOKIE */}
      {showSettings && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4 backdrop-blur-xs animate-in fade-in duration-200">
          <div
            role="dialog"
            aria-modal="true"
            className="w-full max-w-md rounded-3xl border border-neutral-300 bg-white p-6 text-neutral-900 shadow-2xl dark:border-neutral-800 dark:bg-neutral-900 dark:text-white"
          >
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold">{t.cookie.settings}</h2>
              <button
                type="button"
                onClick={() => setShowSettings(false)}
                aria-label={t.cookie.close}
                className="text-neutral-700 hover:text-neutral-950 dark:text-neutral-300 dark:hover:text-white cursor-pointer"
              >
                <X className="size-5" />
              </button>
            </div>
            <p className="mt-2 text-xs text-neutral-700 dark:text-neutral-300">
              {t.cookie.preferences}
            </p>
            <div className="mt-5 flex flex-col gap-2.5">
              <div className="rounded-2xl border border-neutral-300 bg-neutral-100 p-3.5 text-xs font-medium dark:border-neutral-800 dark:bg-neutral-950 flex justify-between items-center">
                <span className="text-neutral-800 dark:text-neutral-200">
                  {t.cookie.essential}
                </span>
                <span className="text-emerald-700 dark:text-emerald-400 font-bold">
                  {t.cookie.alwaysActive}
                </span>
              </div>
              {(
                [
                  [t.cookie.analytics, analytics, setAnalytics],
                  [t.cookie.marketing, marketing, setMarketing],
                ] as const
              ).map(([label, value, setter]) => (
                <button
                  key={label}
                  type="button"
                  onClick={() => setter(!value)}
                  className="flex items-center justify-between rounded-2xl border border-neutral-300 p-3.5 text-left text-xs hover:bg-neutral-50 dark:border-neutral-800 dark:hover:bg-neutral-800/50 transition-colors cursor-pointer"
                >
                  <span className="font-semibold text-neutral-800 dark:text-neutral-200">
                    {label}
                  </span>
                  <span
                    className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${
                      value
                        ? "bg-lime-400 text-neutral-950"
                        : "bg-neutral-200 text-neutral-800 dark:bg-neutral-800 dark:text-neutral-300"
                    }`}
                  >
                    {value ? t.cookie.activeState : t.cookie.inactiveState}
                  </span>
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={() => saveConsent(analytics, marketing)}
              className="mt-6 w-full rounded-full bg-neutral-900 px-4 py-3 text-xs font-bold text-white shadow-sm hover:bg-neutral-800 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-100 transition-all cursor-pointer"
            >
              {t.cookie.save}
            </button>
          </div>
        </div>
      )}
    </>
  );
}
