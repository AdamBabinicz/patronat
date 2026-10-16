"use client";

import type { Messages } from "@/lib/translations";

interface FooterProps {
  messages: Messages;
}

export default function Footer({ messages }: FooterProps) {
  const t = messages.footer;

  // Automatyczna obsługa roku: 2026 w tym roku, 2026 - 2027 w przyszłym roku itd.
  const currentYear = new Date().getFullYear();
  const yearString = currentYear > 2026 ? `2026 - ${currentYear}` : "2026";
  const localizedRights = t.rights.includes("2026")
    ? t.rights.replace("2026", yearString)
    : `${t.rights} (${yearString})`;

  const handleOpenCookieSettings = () => {
    window.dispatchEvent(new CustomEvent("openCookieSettings"));
  };

  return (
    <footer className="border-t border-neutral-300 dark:border-neutral-800 bg-slate-100 dark:bg-neutral-950">
      <div className="mx-auto flex max-w-7xl flex-col gap-6 px-5 py-8 sm:py-10 text-sm text-neutral-700 dark:text-neutral-300 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="font-bold text-base text-neutral-900 dark:text-white">
            Patron
            <span className="text-lime-600 dark:text-lime-400">AI</span>
          </div>
          <p className="mt-2 max-w-sm text-xs sm:text-sm leading-relaxed text-neutral-700 dark:text-neutral-300">
            {t.description}
          </p>
          <p className="mt-4 text-xs text-neutral-700 dark:text-neutral-300 font-medium">
            {localizedRights}
          </p>
        </div>
        <div className="flex flex-wrap gap-5 text-xs sm:text-sm font-semibold">
          <a
            href="/polityka-prywatnosci"
            className="hover:underline text-neutral-800 dark:text-neutral-200"
          >
            {t.privacy}
          </a>
          <a
            href="/regulamin"
            className="hover:underline text-neutral-800 dark:text-neutral-200"
          >
            {t.terms}
          </a>
          <button
            type="button"
            onClick={handleOpenCookieSettings}
            className="hover:underline text-neutral-800 dark:text-neutral-200 cursor-pointer"
          >
            {t.cookie}
          </button>
        </div>
      </div>
    </footer>
  );
}
