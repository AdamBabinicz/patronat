// components/ScrollToTop.tsx
"use client";

import React, { useState, useEffect } from "react";
import { ChevronUp } from "lucide-react";

export default function ScrollToTop() {
  const [showTop, setShowTop] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      setShowTop(window.scrollY > 400);
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  if (!showTop) return null;

  return (
    <button
      type="button"
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      aria-label="Przewiń do góry / Scroll to top"
      className="fixed bottom-6 right-6 z-40 grid size-12 place-items-center rounded-full bg-lime-400 text-neutral-950 shadow-xl transition-all duration-200 hover:scale-110 hover:bg-lime-300 active:scale-95 cursor-pointer print:hidden"
    >
      <ChevronUp className="size-6" />
    </button>
  );
}
