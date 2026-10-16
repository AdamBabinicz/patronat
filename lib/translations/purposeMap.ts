// lib/translations/purposeMap.ts

import type { Language } from "@/lib/translations";

export interface LocalizedPurposeResult {
  /** Główny tekst do wyświetlenia w wybranym języku */
  text: string;
  /** Oryginalna treść polska (do wyświetlenia w podtytule dla sędziego w trybie EN) */
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
 * 1. Wszystkie cele z migracji seedującej Neon PostgreSQL (006_seed_demo_dataset.sql)
 * 2. Wszystkie cele z katalogu potrzeb statutowych klubu (lib/needsCatalog.ts)
 * 3. Wszystkie profile barterowe B2B (cukiernie, czyszczenie, drukarnie, transport, IT)
 * 4. Powszechne warianty testowe i demonstracyjne
 */
export const KNOWN_PURPOSE_DICTIONARY: Record<
  string,
  { pl: string; en: string }
> = {
  // --- Z bazy i zrzutów ekranu (w tym brakujące warsztaty arcymistrzowskie) ---
  "Cykl warsztatów arcymistrzowskich dla sekcji wyczynowej": {
    pl: "Cykl warsztatów arcymistrzowskich dla sekcji wyczynowej",
    en: "Grandmaster Masterclass Workshop Series for High-Performance Section",
  },
  "Warsztaty arcymistrzowskie z taktyki debiutowej": {
    pl: "Warsztaty arcymistrzowskie z taktyki debiutowej",
    en: "Grandmaster Opening Tactics Masterclass Workshops",
  },

  // --- Z migracji 006_seed_demo_dataset.sql ---
  "Zegary szachowe DGT 2010": {
    pl: "Zegary szachowe DGT 2010",
    en: "DGT 2010 Official Chess Clocks",
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

  // --- Z lib/needsCatalog.ts (VERIFIED_NEEDS_CATALOG) ---
  "Puchary grawerowane i medale na Mistrzostwa Juniorów": {
    pl: "Puchary grawerowane i medale na Mistrzostwa Juniorów",
    en: "Engraved Trophies and Medals for Junior Championships",
  },
  "5 profesjonalnych zegarów elektronicznych DGT 2010": {
    pl: "5 profesjonalnych zegarów elektronicznych DGT 2010",
    en: "5 Professional DGT 2010 Electronic Chess Clocks",
  },
  "Fundusz transportowo-hotelowy: Finały Mistrzostw Polski": {
    pl: "Fundusz transportowo-hotelowy: Finały Mistrzostw Polski",
    en: "Travel & Accommodation Fund: National Junior Finals",
  },
  "Stypendium szkoleniowe dla utalentowanych juniorów": {
    pl: "Stypendium szkoleniowe dla utalentowanych juniorów",
    en: "Training Scholarship for Gifted Junior Talents",
  },

  // --- Z COMPANY_PROFILE_TEMPLATES (Barter i B2B) ---
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

  // --- Warianty z danych testowych i widocznych na zrzucie ekranu ---
  "Fundusz startowy: Mistrzostwa Polski Juniorów w Szachach": {
    pl: "Fundusz startowy: Mistrzostwa Polski Juniorów w Szachach",
    en: "Entry Fee Fund: Polish Youth Chess Championship",
  },
  "Zakup 3 kompletów szachownic turniejowych z atestem FIDE": {
    pl: "Zakup 3 kompletów szachownic turniejowych z atestem FIDE",
    en: "Purchase of 3 Tournament Chessboard Sets (FIDE Certified)",
  },
  "Dofinansowanie transportu na Turniej Mikołajkowy": {
    pl: "Dofinansowanie transportu na Turniej Mikołajkowy",
    en: "Transit Subsidy for Saint Nicholas Youth Tournament",
  },
  "Puchary i medale na turniej o Puchar Prezesa UKS Roszada": {
    pl: "Puchary i medale na turniej o Puchar Prezesa UKS Roszada",
    en: "Trophies and Medals for UKS Roszada President's Cup",
  },
  "Wyjazd na Mistrzostwa": {
    pl: "Wyjazd na Mistrzostwa",
    en: "Championship Travel Fund",
  },
  "Puchary dla Juniorów": {
    pl: "Puchary dla Juniorów",
    en: "Trophies for Youth Finalists",
  },
  "Zegary elektroniczne DGT": {
    pl: "Zegary elektroniczne DGT",
    en: "DGT Electronic Clocks",
  },
  "Stypendia szkoleniowe": {
    pl: "Stypendia szkoleniowe",
    en: "Youth Training Scholarships",
  },
};

/**
 * Rozszerzone wzorce semantyczne fallbacku dla dowolnych dynamicznych wpisów darczyńców
 */
const PATTERN_FALLBACKS: Array<{ pattern: RegExp; en: string; pl: string }> = [
  // 1. Zegary i elektronika
  {
    pattern: /(zegar|clock|dgt|czas|timer|elektroniczn)/i,
    en: "Electronic Chess Clocks Procurement",
    pl: "Zakup elektronicznych zegarów szachowych",
  },
  // 2. Puchary, medale, nagrody
  {
    pattern: /(puchar|medal|trofe|cup|award|nagrod|statuetk)/i,
    en: "Championship Trophies and Awards",
    pl: "Puchary i medale turniejowe",
  },
  // 3. Transport, dojazdy, hotele, busy
  {
    pattern: /(trans|bus|przewoz|dojazd|travel|trip|hotel|nocleg|wyjazd)/i,
    en: "Tournament Team Transportation & Travel Fund",
    pl: "Fundusz transportu drużyny na turniej",
  },
  // 4. Warsztaty, szkolenia, arcymistrzowie, lekcje, treningi
  {
    pattern:
      /(warsztat|arcymistrz|taktyk|trener|szkolen|coach|masterclass|lekcj|trening|zajec)/i,
    en: "Grandmaster Coaching & Tactics Masterclass",
    pl: "Szkolenie mistrzowskie juniorów",
  },
  // 5. Szachownice, bierki, atesty FIDE, sprzęt
  {
    pattern: /(szachownic|bierk|board|pieces|fide|sprzet|wyposazen)/i,
    en: "FIDE Tournament Equipment & Boards",
    pl: "Sprzęt i szachownice turniejowe FIDE",
  },
  // 6. Druki, banery, dyplomy
  {
    pattern: /(druk|dyplom|baner|print|plakat|ulotk)/i,
    en: "Tournament Diplomas & Promotional Banners",
    pl: "Wydruk dyplomów i banerów turniejowych",
  },
  // 7. Sala, remont, sprzątanie
  {
    pattern: /(sala|czyszcz|sprzat|facility|clean|remont|renowac)/i,
    en: "Youth Training Facility Maintenance",
    pl: "Renowacja i utrzymanie sali klubowej",
  },
  // 8. Obozy, kolonie, zgrupowania
  {
    pattern: /(oboz|zgrupowan|koloni|camp)/i,
    en: "Youth Chess Summer & Winter Training Camp",
    pl: "Zgrupowanie szkoleniowe juniorów",
  },
  // 9. Stypendia, pomoc, opłaty wpisowe, granty
  {
    pattern: /(stypend|wpisow|startow|pomoc|wsparci|grant|fundusz|darowizn)/i,
    en: "Youth Talent Scholarship & Participation Grant",
    pl: "Stypendium i dofinansowanie udziału juniorów",
  },
];

/**
 * Sprawdza, czy dany tekst ma cechy języka polskiego (polskie znaki diakrytyczne lub polskie słowa kluczowe)
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
    lower.includes(" wpłat")
  );
}

/**
 * Pobiera zlokalizowany cel alokacji w trybie deterministycznym O(1).
 * Jeśli tekst wejściowy jest już w języku angielskim, NIE dodaje badge'a PL Original.
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

  // 1. Sprawdzenie, czy tekst wejściowy nie jest JUŻ bezpośrednią wersją angielską ze słownika
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

  // 2. Sprawdzenie dokładnego dopasowania do polskich kluczy w słowniku
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

  // 3. Sprawdzenie case-insensitive po kluczach
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

  // 4. Jeśli w trybie EN tekst NIE zawiera cech języka polskiego, traktujemy go jako natywny wpis EN
  if (language === "en" && !containsPolishMarkers(trimmed)) {
    return {
      text: trimmed,
      wasTranslated: false,
    };
  }

  // 5. Fallback wzorcowy (pattern matching) dla dynamicznych celów w języku polskim
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

  // 6. Globalny Fallback dla całkowicie dowolnych, niestandardowych wpisów w języku polskim:
  // W trybie EN wyświetla czytelną dla sędziów etykietę i zachowuje oryginalny polski wpis w badge'u!
  if (language === "en" && containsPolishMarkers(trimmed)) {
    return {
      text: "Custom Youth Sports Patronage Allocation",
      originalPl: trimmed,
      wasTranslated: true,
    };
  }

  // 7. Domyślny zwrot dla trybu PL
  return {
    text: trimmed,
    wasTranslated: false,
  };
}

/**
 * Formatuje kwotę alokacji w standardzie Dual-Currency.
 * Dla EUR/USD kod waluty ZAWSZE z przodu (np. "EUR 25", "EUR 93", "USD 100").
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

    // Dla wpłat w EUR/USD kod waluty ZAWSZE z przodu: EUR 25
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

  // Jeśli w bazie jest PLN: przeliczamy na EUR (kod waluty ZAWSZE z przodu: EUR 93)
  const eurVal = Math.round(rawNumber / FX_EUR);
  const formattedPln = rounded.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");

  return {
    primary: `EUR ${eurVal.toLocaleString("en-US")}`,
    secondary: `(${formattedPln} PLN)`,
  };
}
