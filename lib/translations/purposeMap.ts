// lib/translations/purposeMap.ts

import type { Language } from "@/lib/translations";

export interface LocalizedPurposeResult {
  /** Główny tekst do wyświetlenia w wybranym języku */
  text: string;
  /** Oryginalna treść polska (do wyświetlenia w podpowiedzi dla audytora w trybie EN) */
  originalPl?: string;
  /** Czy tekst został przetłumaczony ze źródła polskiego */
  wasTranslated: boolean;
}

export interface LocalizedAmountResult {
  /** Główna kwota do wyświetlenia (np. "EUR 105" w EN lub "450 PLN" w PL) */
  primary: string;
  /** Opcjonalna waluta transakcyjna (np. "(450 PLN)" pod spodem) */
  secondary?: string;
}

/** Kursy przeliczeniowe demonstracyjne dla widoku jury */
const FX_EUR = 4.3;
const FX_USD = 4.0;

/**
 * Kanoniczny słownik celów alokacji obejmujący:
 * 1. Wszystkie cele z bazy Neon PostgreSQL
 * 2. Wszystkie cele z katalogu potrzeb statutowych klubu
 * 3. Wszystkie profile barterowe B2B (Grama, Słodkolandia, Super Pucuś itp.)
 */
export const KNOWN_PURPOSE_DICTIONARY: Record<
  string,
  { pl: string; en: string }
> = {
  // --- Profile Barterowe B2B ---
  "Mecenat rzeczowy: Oficjalne partnerstwo B2B z marką Grama": {
    pl: "Mecenat rzeczowy: Oficjalne partnerstwo B2B z marką Grama",
    en: "In-Kind Patronage: Official B2B Partnership with Grama",
  },
  "Oficjalne partnerstwo B2B z marką Grama": {
    pl: "Oficjalne partnerstwo B2B z marką Grama",
    en: "Official B2B Partnership with Grama",
  },
  "Mecenat rzeczowy: Słodki stół i poczęstunek na Turniej Mikołajkowy": {
    pl: "Mecenat rzeczowy: Słodki stół i poczęstunek na Turniej Mikołajkowy",
    en: "In-Kind Patronage: Sweet Table & Pastry Treats for Youth Tournament",
  },
  "Mecenat rzeczowy: Profesjonalne czyszczenie sali treningowej klubu": {
    pl: "Mecenat rzeczowy: Profesjonalne czyszczenie sali treningowej klubu",
    en: "In-Kind Patronage: Professional Youth Training Facility Deep Clean",
  },
  "Czyszczenie i renowacja sali treningowej klubu": {
    pl: "Czyszczenie i renowacja sali treningowej klubu",
    en: "Deep Cleaning & Renovation of Club Training Facility",
  },
  "Dofinansowanie profesjonalnych środków czystości i renowacji sali treningowej":
    {
      pl: "Dofinansowanie profesjonalnych środków czystości i renowacji sali treningowej",
      en: "Deep Cleaning & Renovation of Club Training Facility",
    },
  "Mecenat rzeczowy: Druk 150 dyplomów i banerów sponsorskich": {
    pl: "Mecenat rzeczowy: Druk 150 dyplomów i banerów sponsorskich",
    en: "In-Kind Patronage: Production of 150 Diplomas & Event Banners",
  },
  "Mecenat rzeczowy: Transport busem na Finały Mistrzostw Polski": {
    pl: "Mecenat rzeczowy: Transport busem na Finały Mistrzostw Polski",
    en: "In-Kind Patronage: Junior Finals Bus Transportation",
  },
  "Mecenat technologiczny: Cyfrowa transmisja partii i stypendia IT": {
    pl: "Mecenat technologiczny: Cyfrowa transmisja partii i stypendia IT",
    en: "Tech Patronage: Live Chess Broadcast & IT Scholarships",
  },

  // --- Cele statutowe i turniejowe ---
  "Puchary grawerowane i medale na Mistrzostwa Juniorów": {
    pl: "Puchary grawerowane i medale na Mistrzostwa Juniorów",
    en: "Engraved Trophies and Medals for Junior Championships",
  },
  "5 profesjonalnych zegarów elektronicznych DGT 2010": {
    pl: "5 profesjonalnych zegarów elektronicznych DGT 2010",
    en: "5 Professional DGT 2010 Electronic Chess Clocks",
  },
  "Zegary szachowe DGT 2010": {
    pl: "Zegary szachowe DGT 2010",
    en: "DGT 2010 Official Chess Clocks",
  },
  "Zakup 3 kompletów szachownic turniejowych z atestem FIDE": {
    pl: "Zakup 3 kompletów szachownic turniejowych z atestem FIDE",
    en: "Purchase of 3 Tournament Chessboard Sets (FIDE Certified)",
  },
  "Fundusz startowy: Mistrzostwa Polski Juniorów w Szachach": {
    pl: "Fundusz startowy: Mistrzostwa Polski Juniorów w Szachach",
    en: "Entry Fee Fund: Polish Youth Chess Championship",
  },
  "Fundusz transportowo-hotelowy: Finały Mistrzostw Polski": {
    pl: "Fundusz transportowo-hotelowy: Finały Mistrzostw Polski",
    en: "Travel & Accommodation Fund: National Junior Finals",
  },
  "Stypendium szkoleniowe dla utalentowanych juniorów": {
    pl: "Stypendium szkoleniowe dla utalentowanych juniorów",
    en: "Training Scholarship for Gifted Junior Talents",
  },
  "Cykl warsztatów arcymistrzowskich dla sekcji wyczynowej": {
    pl: "Cykl warsztatów arcymistrzowskich dla sekcji wyczynowej",
    en: "Grandmaster Masterclass Workshop Series for High-Performance Section",
  },
  "Warsztaty arcymistrzowskie z taktyki debiutowej": {
    pl: "Warsztaty arcymistrzowskie z taktyki debiutowej",
    en: "Grandmaster Opening Tactics Masterclass Workshops",
  },
  "Opłaty startowe turniejów": {
    pl: "Opłaty startowe turniejów",
    en: "Tournament Entry Fees Fund",
  },
  "Transport na mistrzostwa": {
    pl: "Transport na mistrzostwa",
    en: "Championship Bus Transit",
  },
  "Figury i szachownice turniejowe": {
    pl: "Figury i szachownice turniejowe",
    en: "Tournament Chessboards & Pieces",
  },
  "Wynajem sali treningowej": {
    pl: "Wynajem sali treningowej",
    en: "Training Hall Facility Rental",
  },
  "Dyplomy, puchary i medale": {
    pl: "Dyplomy, puchary i medale",
    en: "Diplomas, Trophies & Medals",
  },
  "Materiały szkoleniowe i druk": {
    pl: "Materiały szkoleniowe i druk",
    en: "Training Materials & Printing",
  },
};

/**
 * Rozszerzone wzorce semantyczne fallbacku (uporządkowane według priorytetu)
 */
const PATTERN_FALLBACKS: Array<{ pattern: RegExp; en: string; pl: string }> = [
  // 1. Czyszczenie, sala treningowa, renowacja, środki czystości (WYŻSZY PRIORYTET niż "trening")
  {
    pattern:
      /(czyszcz|sprząt|sprzat|sala|sali treningow|renowac|środk.*czysto|facility|clean|remont)/i,
    en: "Deep Cleaning & Renovation of Club Training Facility",
    pl: "Czyszczenie i renowacja sali treningowej klubu",
  },
  // 2. Zegary i elektronika
  {
    pattern: /(zegar|clock|dgt|czas|timer|elektroniczn)/i,
    en: "Electronic Chess Clocks Procurement",
    pl: "Zakup elektronicznych zegarów szachowych",
  },
  // 3. Puchary, medale, nagrody
  {
    pattern: /(puchar|medal|trofe|cup|award|nagrod|statuetk)/i,
    en: "Championship Trophies and Awards",
    pl: "Puchary i medale turniejowe",
  },
  // 4. Transport, busy, dojazdy, hotele
  {
    pattern: /(trans|bus|przewoz|dojazd|travel|trip|hotel|nocleg|wyjazd)/i,
    en: "Tournament Team Transportation & Travel Fund",
    pl: "Fundusz transportu drużyny na turniej",
  },
  // 5. Warsztaty, szkolenia szachowe, arcymistrzowie
  {
    pattern:
      /(warsztat|arcymistrz|taktyk|trener|szkolen|coach|masterclass|lekcj)/i,
    en: "Grandmaster Coaching & Tactics Masterclass",
    pl: "Szkolenie mistrzowskie juniorów",
  },
  // 6. Szachownice, bierki, atesty FIDE
  {
    pattern: /(szachownic|bierk|board|pieces|fide|sprzet|wyposazen)/i,
    en: "FIDE Tournament Equipment & Boards",
    pl: "Sprzęt i szachownice turniejowe FIDE",
  },
  // 7. Słodki stół, poczęstunek
  {
    pattern: /(słodk|slodk|poczęst|poczest|ciast|catering)/i,
    en: "In-Kind Patronage: Sweet Table & Pastry Treats for Youth Tournament",
    pl: "Mecenat rzeczowy: Słodki stół i poczęstunek na turniej",
  },
  // 8. Druki, banery, dyplomy
  {
    pattern: /(druk|dyplom|baner|print|plakat|ulotk)/i,
    en: "Tournament Diplomas & Promotional Banners",
    pl: "Wydruk dyplomów i banerów turniejowych",
  },
  // 9. Stypendia, opłaty wpisowe, startowe
  {
    pattern: /(stypend|wpisow|startow|pomoc|wsparci|grant|fundusz|darowizn)/i,
    en: "Youth Talent Scholarship & Participation Grant",
    pl: "Stypendium i dofinansowanie udziału juniorów",
  },
];

/**
 * Sprawdza obecność polskich znaków lub fraz
 */
function containsPolishMarkers(text: string): boolean {
  if (/[ąćęłńóśźżĄĆĘŁŃÓŚŹŻ]/.test(text)) return true;
  const lower = text.toLowerCase();
  return (
    lower.includes(" i ") ||
    lower.includes(" w ") ||
    lower.includes(" na ") ||
    lower.includes(" dla ") ||
    lower.includes(" turniej") ||
    lower.includes(" mistrzostw") ||
    lower.includes(" puchar") ||
    lower.includes(" zegar") ||
    lower.includes(" szach") ||
    lower.includes(" sala ") ||
    lower.includes(" warsztat") ||
    lower.includes(" wpłat") ||
    lower.includes("mecenat")
  );
}

/**
 * Pobiera zlokalizowany cel alokacji
 */
export function getLocalizedPurpose(
  rawPurpose: string,
  language: Language,
): LocalizedPurposeResult {
  if (!rawPurpose || typeof rawPurpose !== "string") {
    return {
      text:
        language === "pl"
          ? "Ogólny cel statutowy klubu"
          : "General club statutory purpose",
      wasTranslated: false,
    };
  }

  const trimmed = rawPurpose.trim();
  const lowerTrimmed = trimmed.toLowerCase();

  // 1. Dynamiczne rozpoznanie partnerstwa B2B z dowolną marką (np. Grama)
  const b2bMatch = trimmed.match(
    /^(?:mecenat rzeczowy:\s*)?oficjalne partnerstwo b2b z marką\s+(.+)$/i,
  );
  if (b2bMatch) {
    const brandName = b2bMatch[1].trim();
    if (language === "en") {
      return {
        text: `In-Kind Patronage: Official B2B Partnership with ${brandName}`,
        originalPl: trimmed,
        wasTranslated: true,
      };
    }
    return {
      text: `Mecenat rzeczowy: Oficjalne partnerstwo B2B z marką ${brandName}`,
      wasTranslated: false,
    };
  }

  // 2. Sprawdzenie, czy tekst wejściowy nie jest JUŻ wersją angielską ze słownika
  for (const value of Object.values(KNOWN_PURPOSE_DICTIONARY)) {
    if (value.en.toLowerCase() === lowerTrimmed) {
      if (language === "en") {
        return {
          text: value.en,
          wasTranslated: false,
        };
      }
      return {
        text: value.pl,
        wasTranslated: true,
      };
    }
  }

  // 3. Sprawdzenie dokładnego dopasowania do polskich kluczy w słowniku
  const exactMatch = KNOWN_PURPOSE_DICTIONARY[trimmed];
  if (exactMatch) {
    if (language === "en") {
      return {
        text: exactMatch.en,
        originalPl: exactMatch.pl,
        wasTranslated: true,
      };
    }
    return {
      text: exactMatch.pl,
      wasTranslated: false,
    };
  }

  // 4. Sprawdzenie case-insensitive po kluczach
  for (const [key, value] of Object.entries(KNOWN_PURPOSE_DICTIONARY)) {
    if (key.toLowerCase() === lowerTrimmed) {
      if (language === "en") {
        return {
          text: value.en,
          originalPl: value.pl,
          wasTranslated: true,
        };
      }
      return {
        text: value.pl,
        wasTranslated: false,
      };
    }
  }

  // 5. Jeśli w trybie EN tekst NIE zawiera cech języka polskiego, traktujemy go jako natywny wpis EN
  if (language === "en" && !containsPolishMarkers(trimmed)) {
    return {
      text: trimmed,
      wasTranslated: false,
    };
  }

  // 6. Dopasowanie wzorców semantycznych (Pattern Fallbacks)
  for (const item of PATTERN_FALLBACKS) {
    if (item.pattern.test(trimmed)) {
      if (language === "en") {
        const isPolish = containsPolishMarkers(trimmed);
        return {
          text: item.en,
          originalPl: isPolish ? trimmed : undefined,
          wasTranslated: isPolish,
        };
      }
      return {
        text: trimmed,
        wasTranslated: false,
      };
    }
  }

  // 7. Dynamiczna obsługa dowolnego mecenatu rzeczowego
  if (/^mecenat rzeczowy:\s*/i.test(trimmed)) {
    const cleanGoal = trimmed.replace(/^mecenat rzeczowy:\s*/i, "").trim();
    if (language === "en") {
      return {
        text: `In-Kind Patronage: ${cleanGoal}`,
        originalPl: trimmed,
        wasTranslated: true,
      };
    }
    return {
      text: trimmed,
      wasTranslated: false,
    };
  }

  // 8. Globalny fallback dla nietypowych wpisów
  if (language === "en" && containsPolishMarkers(trimmed)) {
    return {
      text: "Youth Sports Equipment & Club Support",
      originalPl: trimmed,
      wasTranslated: true,
    };
  }

  // 9. Domyślny zwrot dla trybu PL
  return {
    text: trimmed,
    wasTranslated: false,
  };
}

/**
 * Formatuje kwotę alokacji w standardzie Dual-Currency.
 * Dla EUR/USD kod waluty ZAWSZE z przodu (np. "EUR 25", "EUR 93", "USD 15").
 * Dla PLN kod waluty na końcu (np. "450 PLN").
 */
export function formatAllocationAmount(
  amountStr: string,
  language: Language,
): LocalizedAmountResult {
  if (!amountStr) {
    return { primary: language === "pl" ? "0 PLN" : "EUR 0" };
  }

  const clean = amountStr.trim();
  const match = clean.match(/^([\d\s.,]+)\s*([A-Z]{3})?$/i);

  if (!match) {
    return { primary: clean };
  }

  const rawNumber = parseFloat(match[1].replace(/\s+/g, "").replace(",", "."));
  const currency = (match[2] || "PLN").toUpperCase();

  if (isNaN(rawNumber)) {
    return { primary: clean };
  }

  const rounded = Math.round(rawNumber);

  // Tryb polski:
  if (language === "pl") {
    const formattedAmount = rounded
      .toString()
      .replace(/\B(?=(\d{3})+(?!\d))/g, " ");

    if (currency === "PLN") {
      return { primary: `${formattedAmount} PLN` };
    }

    const plnEquiv = Math.round(rawNumber * FX_EUR)
      .toString()
      .replace(/\B(?=(\d{3})+(?!\d))/g, " ");

    return {
      primary: `${currency} ${formattedAmount}`,
      secondary: `(~${plnEquiv} PLN)`,
    };
  }

  // Tryb angielski (EN): kod waluty ZAWSZE z przodu
  if (currency === "EUR") {
    return { primary: `EUR ${rounded.toLocaleString("en-US")}` };
  }

  if (currency === "USD") {
    return { primary: `USD ${rounded.toLocaleString("en-US")}` };
  }

  // Jeśli w bazie jest PLN: przeliczamy na EUR
  const eurVal = Math.round(rawNumber / FX_EUR);
  const formattedPln = rounded.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");

  return {
    primary: `EUR ${eurVal.toLocaleString("en-US")}`,
    secondary: `(${formattedPln} PLN)`,
  };
}
