"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Moon, Sun } from "lucide-react";
import { en } from "@/lib/translations/en";
import { pl } from "@/lib/translations/pl";

export default function PolitykaPrywatnosciPage() {
  const [language, setLanguage] = useState<"pl" | "en">("pl");
  const [dark, setDark] = useState(true);

  useEffect(() => {
    // Odczyt wybranego motywu
    const savedTheme = localStorage.getItem("patronai_theme");
    const isDark = savedTheme ? savedTheme === "dark" : true;
    setDark(isDark);
    document.documentElement.classList.toggle("dark", isDark);
    document.documentElement.classList.toggle("light", !isDark);

    // Odczyt wybranego języka ze strony głównej
    const savedLang = localStorage.getItem("patronai_lang") as
      | "pl"
      | "en"
      | null;
    if (savedLang) {
      setLanguage(savedLang);
    }
  }, []);

  const toggleTheme = () => {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle("dark", next);
    document.documentElement.classList.toggle("light", !next);
    localStorage.setItem("patronai_theme", next ? "dark" : "light");
  };

  const toggleLanguage = () => {
    const next = language === "pl" ? "en" : "pl";
    setLanguage(next);
    localStorage.setItem("patronai_lang", next);
  };

  const t = language === "pl" ? pl : en;

  return (
    <main className="min-h-screen bg-slate-50 text-neutral-900 transition-colors duration-200 dark:bg-neutral-950 dark:text-neutral-100">
      <header className="border-b border-neutral-200 bg-white/80 backdrop-blur dark:border-neutral-800 dark:bg-neutral-950/80">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-5 py-4">
          <Link
            href="/"
            className="text-sm font-medium text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white"
          >
            {t.legal.back}
          </Link>
          <div className="flex items-center gap-2">
            <button
              onClick={toggleTheme}
              aria-label={t.nav.theme}
              className="grid size-9 place-items-center rounded-full border border-neutral-200 bg-white text-neutral-700 hover:bg-neutral-100 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-300 dark:hover:bg-neutral-800"
            >
              {dark ? <Sun className="size-4" /> : <Moon className="size-4" />}
            </button>
            <button
              onClick={toggleLanguage}
              className="rounded-full border border-neutral-200 px-3 py-1.5 text-xs font-bold text-neutral-800 hover:bg-neutral-100 dark:border-neutral-800 dark:text-neutral-200 dark:hover:bg-neutral-800"
            >
              {language === "pl" ? "EN" : "PL"}
            </button>
          </div>
        </div>
      </header>

      <article className="mx-auto max-w-4xl px-5 py-16">
        <h1 className="text-4xl font-bold tracking-tight text-neutral-900 sm:text-5xl dark:text-white">
          {t.privacy.title}
        </h1>
        <div className="mt-12 space-y-8">
          {t.privacy.sections.map((section) => (
            <section
              key={section.heading}
              className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-900/60"
            >
              <h2 className="text-xl font-semibold text-neutral-900 dark:text-white">
                {section.heading}
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-neutral-600 dark:text-neutral-400">
                {section.body}
              </p>
            </section>
          ))}
        </div>
      </article>
    </main>
  );
}
