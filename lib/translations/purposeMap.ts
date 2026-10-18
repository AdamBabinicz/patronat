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
export const FX_EUR = 4.3;
export const FX_USD = 4.0;

/**
 * Kanoniczny słownik celów alokacji obejmujący:
 * 1. Wszystkie cele z bazy Neon PostgreSQL
 * 2. Wszystkie cele z katalogu potrzeb statutowych klubu (lib/needsCatalog.ts)
 * 3. Skrócone cele z tabel demonstracyjnych (lib/translations/pl.ts)
 * 4. Wszystkie profile barterowe B2B (Grama, Słodkolandia, Super Pucuś, Virgo itp.)
 */
export const KNOWN_PURPOSE_DICTIONARY: Record<
  string,
  { pl: string; en: string }
> = {
  // --- Profile Barterowe B2B i Mecenaty Branżowe ---
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

  // --- Cele statutowe i turniejowe (Katalog potrzeb & Rejestr) ---
  "Puchary grawerowane i medale na Mistrzostwa Juniorów": {
    pl: "Puchary grawerowane i medale na Mistrzostwa Juniorów",
    en: "Engraved Trophies and Medals for Junior Championships",
  },
  "Puchary dla Juniorów": {
    pl: "Puchary dla Juniorów",
    en: "Engraved Trophies and Medals for Junior Championships",
  },
  "5 profesjonalnych zegarów elektronicznych DGT 2010": {
    pl: "5 profesjonalnych zegarów elektronicznych DGT 2010",
    en: "5 Professional DGT 2010 Official Chess Clocks",
  },
  "Zegary szachowe DGT 2010": {
    pl: "Zegary szachowe DGT 2010",
    en: "DGT 2010 Official Chess Clocks",
  },
  "Zegary elektroniczne DGT": {
    pl: "Zegary elektroniczne DGT",
    en: "DGT 2010 Official Chess Clocks",
  },
  "Zakup 3 kompletów szachownic turniejowych z atestem FIDE": {
    pl: "Zakup 3 kompletów szachownic turniejowych z atestem FIDE",
    en: "Purchase of 3 Tournament Chessboard Sets (FIDE Certified)",
  },
  "Zestawy szachowe dla szkółki początkującej": {
    pl: "Zestawy szachowe dla szkółki początkującej",
    en: "Chess Sets & Equipment for Junior Academy",
  },
  "Zestaw szachowy dla szkółki": {
    pl: "Zestaw szachowy dla szkółki",
    en: "Chess Sets & Equipment for Junior Academy",
  },
  "Fundusz startowy: Mistrzostwa Polski Juniorów w Szachach": {
    pl: "Fundusz startowy: Mistrzostwa Polski Juniorów w Szachach",
    en: "Entry Fee Fund: Polish Youth Chess Championship",
  },
  "Fundusz transportowo-hotelowy: Finały Mistrzostw Polski": {
    pl: "Fundusz transportowo-hotelowy: Finały Mistrzostw Polski",
    en: "Travel & Accommodation Fund: National Junior Finals",
  },
  "Transport na mistrzostwa": {
    pl: "Transport na mistrzostwa",
    en: "Championship Bus Transit & Travel Fund",
  },
  "Wyjazd na Mistrzostwa": {
    pl: "Wyjazd na Mistrzostwa",
    en: "Championship Bus Transit & Travel Fund",
  },
  "Stypendium szkoleniowe dla utalentowanych juniorów": {
    pl: "Stypendium szkoleniowe dla utalentowanych juniorów",
    en: "Training Scholarship for Gifted Junior Talents",
  },
  "Stypendia szkoleniowe": {
    pl: "Stypendia szkoleniowe",
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
  "Złoty Mecenat: 5 profesjonalnych zegarów szachowych": {
    pl: "Złoty Mecenat: 5 profesjonalnych zegarów szachowych",
    en: "Gold Patronage: 5 Professional Chess Clocks",
  },
};

/**
 * Uporządkowane wzorce semantyczne fallbacku dla celów dynamicznych
 */
const PATTERN_FALLBACKS: Array<{ pattern: RegExp; en: string; pl: string }> = [
  // 1. Czyszczenie, sala treningowa, renowacja, środki czystości
  {
    pattern:
      /(czyszcz|sprząt|sprzat|sala|sali treningow|renowac|środk.*czysto|facility|clean|remont)/i,
    en: "Deep Cleaning & Renovation of Club Training Facility",
    pl: "Czyszczenie i renowacja sali treningowej klubu",
  },
  // 2. Zegary i elektronika szachowa
  {
    pattern: /(zegar|clock|dgt|czas|timer|elektroniczn)/i,
    en: "5 Professional DGT 2010 Official Chess Clocks",
    pl: "Zakup elektronicznych zegarów szachowych DGT",
  },
  // 3. Puchary, medale, nagrody
  {
    pattern: /(puchar|medal|trofe|cup|award|nagrod|statuetk)/i,
    en: "Engraved Trophies and Medals for Junior Championships",
    pl: "Puchary grawerowane i medale na Mistrzostwa Juniorów",
  },
  // 4. Szachownice, bierki, zestawy dla szkółki, atesty FIDE
  {
    pattern:
      /(szachownic|bierk|board|pieces|fide|szkółk|szkolk|początkuj|poczatkuj|zestaw.*szach)/i,
    en: "Chess Sets & Equipment for Junior Academy",
    pl: "Zestawy szachowe dla szkółki początkującej",
  },
  // 5. Transport, busy, dojazdy, hotele, wyjazdy
  {
    pattern: /(trans|bus|przewoz|dojazd|travel|trip|hotel|nocleg|wyjazd)/i,
    en: "Travel & Accommodation Fund: National Junior Finals",
    pl: "Fundusz transportowo-hotelowy na zawody",
  },
  // 6. Warsztaty, szkolenia szachowe, arcymistrzowie
  {
    pattern:
      /(warsztat|arcymistrz|taktyk|trener|szkolen|coach|masterclass|lekcj)/i,
    en: "Grandmaster Coaching & Tactics Masterclass",
    pl: "Cykl warsztatów arcymistrzowskich dla juniorów",
  },
  // 7. Słodki stół, poczęstunek, catering
  {
    pattern: /(słodk|slodk|poczęst|poczest|ciast|catering)/i,
    en: "In-Kind Patronage: Sweet Table & Pastry Treats for Youth Tournament",
    pl: "Mecenat rzeczowy: Słodki stół i poczęstunek na turniej",
  },
  // 8. Druki, banery, dyplomy, reklama
  {
    pattern: /(druk|dyplom|baner|print|plakat|ulotk|poligraf)/i,
    en: "In-Kind Patronage: Production of 150 Diplomas & Event Banners",
    pl: "Wydruk dyplomów i banerów turniejowych",
  },
  // 9. IT, transmisja, streaming, oprogramowanie
  {
    pattern:
      /(transmisj|streaming|live.*chess|cyfrow|stypend.*it|software|kodow)/i,
    en: "Tech Patronage: Live Chess Broadcast & IT Scholarships",
    pl: "Mecenat technologiczny: Cyfrowa transmisja partii i stypendia IT",
  },
  // 10. Stypendia, opłaty wpisowe, startowe
  {
    pattern: /(stypend|wpisow|startow|pomoc|wsparci|grant|fundusz|darowizn)/i,
    en: "Training Scholarship & Tournament Entry Grants",
    pl: "Stypendium szkoleniowe dla utalentowanych juniorów",
  },
];

/**
 * Usuwa techniczne prefiksy audytowe (np. "Alokacja celowa:", "Alokacja:")
 * aby dopasować czysty rdzeń celu
 */
function stripAuditPrefix(str: string): { prefix?: string; core: string } {
  const match = str.match(
    /^(Alokacja celowa:\s*|Alokacja:\s*|Cel alokacji:\s*|Cel:\s*|Target:\s*)/i,
  );
  if (match) {
    return {
      prefix: match[1],
      core: str.slice(match[0].length).trim(),
    };
  }
  return { core: str.trim() };
}

/**
 * Sprawdza obecność polskich znaków diakrytycznych lub typowych polskich słów łączących
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
 * Pobiera zlokalizowany cel alokacji (obsługuje cele słownikowe, wzorce semantyczne oraz cele własne darczyńcy)
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
  const { prefix, core } = stripAuditPrefix(trimmed);
  const lowerCore = core.toLowerCase();

  // 1. Dynamiczne rozpoznanie partnerstwa B2B z dowolną marką (np. Grama, Virgo, Słodkolandia)
  const b2bMatch = core.match(
    /^(?:mecenat rzeczowy:\s*)?oficjalne partnerstwo b2b z marką\s+(.+)$/i,
  );
  if (b2bMatch) {
    const brandName = b2bMatch[1].trim();
    if (language === "en") {
      const enText = `In-Kind Patronage: Official B2B Partnership with ${brandName}`;
      return {
        text: prefix ? `${prefix}${enText}` : enText,
        originalPl: trimmed,
        wasTranslated: true,
      };
    }
    return {
      text: trimmed,
      wasTranslated: false,
    };
  }

  // 2. Sprawdzenie, czy tekst wejściowy nie jest JUŻ wersją angielską ze słownika
  for (const value of Object.values(KNOWN_PURPOSE_DICTIONARY)) {
    if (value.en.toLowerCase() === lowerCore) {
      if (language === "en") {
        return {
          text: prefix ? `${prefix}${value.en}` : value.en,
          wasTranslated: false,
        };
      }
      return {
        text: prefix ? `${prefix}${value.pl}` : value.pl,
        wasTranslated: true,
      };
    }
  }

  // 3. Sprawdzenie dokładnego dopasowania do polskich kluczy w słowniku
  const exactMatch = KNOWN_PURPOSE_DICTIONARY[core];
  if (exactMatch) {
    if (language === "en") {
      return {
        text: prefix ? `${prefix}${exactMatch.en}` : exactMatch.en,
        originalPl: trimmed,
        wasTranslated: true,
      };
    }
    return {
      text: trimmed,
      wasTranslated: false,
    };
  }

  // 4. Sprawdzenie case-insensitive po kluczach słownika
  for (const [key, value] of Object.entries(KNOWN_PURPOSE_DICTIONARY)) {
    if (key.toLowerCase() === lowerCore) {
      if (language === "en") {
        return {
          text: prefix ? `${prefix}${value.en}` : value.en,
          originalPl: trimmed,
          wasTranslated: true,
        };
      }
      return {
        text: trimmed,
        wasTranslated: false,
      };
    }
  }

  // 5. Jeśli w trybie EN tekst NIE zawiera cech języka polskiego, traktujemy go jako natywny wpis EN
  if (language === "en" && !containsPolishMarkers(core)) {
    return {
      text: trimmed,
      wasTranslated: false,
    };
  }

  // 6. Dopasowanie wzorców semantycznych (Pattern Fallbacks)
  for (const item of PATTERN_FALLBACKS) {
    if (item.pattern.test(core)) {
      if (language === "en") {
        const isPolish = containsPolishMarkers(core);
        return {
          text: prefix ? `${prefix}${item.en}` : item.en,
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
  if (/^mecenat rzeczowy:\s*/i.test(core)) {
    const cleanGoal = core.replace(/^mecenat rzeczowy:\s*/i, "").trim();
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

  // 8. Bezpieczna obsługa celu własnego mecenasa (Custom Patron Goal):
  // Nie niszczymy autorskiej intencji darczyńcy!
  if (language === "en" && containsPolishMarkers(core)) {
    return {
      text: `Patron Allocation: ${core}`,
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

  // Tryb polski (PL):
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
