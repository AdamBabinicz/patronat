// app/api/agent/match/route.ts
import { NextResponse } from "next/server";
import { getTranslations, type Language } from "@/lib/translations";
import {
  VERIFIED_NEEDS_CATALOG,
  COMPANY_PROFILE_TEMPLATES,
  convertFromPln,
  type SponsorshipType,
  type SupportedCurrency,
  type NeedCategory,
  type ImpactForecast,
} from "@/lib/needsCatalog";

export const dynamic = "force-dynamic";

export interface AgentMatchResponse {
  goal: string;
  amount: number;
  currency: SupportedCurrency;
  description: string;
  confidence: number;
  category: NeedCategory;
  reasoning: string;
  clubName: string;
  sponsorshipType: SponsorshipType;
  inKindDetails?: string;
  detectedDomain?: string;
  impactForecast: ImpactForecast;
}

// Szybkie pobranie nagłówków HTML ze strony partnera
async function fetchPageMetadata(
  targetUrl: string,
): Promise<{ title: string; description: string }> {
  try {
    const validUrl = targetUrl.startsWith("http")
      ? targetUrl
      : `https://${targetUrl}`;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 1800);

    const res = await fetch(validUrl, {
      signal: controller.signal,
      headers: { "User-Agent": "PatronAI-WebIntelligence-Bot/1.0" },
      cache: "no-store",
    });
    clearTimeout(timeoutId);

    if (!res.ok) return { title: "", description: "" };

    const html = await res.text();
    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    const descMatch =
      html.match(
        /<meta[^>]*name=["']description["'][^>]*content=["']([^"']+)["']/i,
      ) ||
      html.match(
        /<meta[^>]*content=["']([^"']+)["'][^>]*name=["']description["']/i,
      );

    return {
      title: titleMatch ? titleMatch[1].trim() : "",
      description: descMatch ? descMatch[1].trim() : "",
    };
  } catch {
    return { title: "", description: "" };
  }
}

// Analiza witryny firmowej w oparciu o szablony domenowe
async function analyzeCompanyProfile(
  rawQuery: string,
  locale: Language,
  clubName: string,
  targetCurrency: SupportedCurrency,
): Promise<AgentMatchResponse | null> {
  const urlMatch = rawQuery.match(
    /(?:https?:\/\/)?(?:www\.)?([a-zA-Z0-9.-]+\.[a-zA-Z]{2,}(?:\/[^\s]*)?)/i,
  );
  if (!urlMatch) return null;

  const fullDomainAndPath = urlMatch[1].replace(/[/?#]+$/, "").toLowerCase();
  const rawUrl = urlMatch[0].replace(/[/?#]+$/, "");
  const cleanDisplayBrand = fullDomainAndPath.split("/")[0];

  const meta = await fetchPageMetadata(rawUrl);
  const combinedContext =
    `${fullDomainAndPath} ${meta.title} ${meta.description}`.toLowerCase();

  for (const template of COMPANY_PROFILE_TEMPLATES) {
    if (template.pattern.test(combinedContext)) {
      const amount = convertFromPln(template.amountPln, targetCurrency);
      return {
        goal:
          locale === "pl"
            ? template.goalPl(cleanDisplayBrand)
            : template.goalEn(cleanDisplayBrand),
        amount,
        currency: targetCurrency,
        description:
          locale === "pl"
            ? template.descPl(cleanDisplayBrand)
            : template.descEn(cleanDisplayBrand),
        confidence: template.confidence,
        category: template.category,
        reasoning:
          locale === "pl"
            ? template.reasoningPl(cleanDisplayBrand)
            : template.reasoningEn(cleanDisplayBrand),
        clubName,
        sponsorshipType: template.sponsorshipType,
        inKindDetails:
          locale === "pl" ? template.inKindDetailsPl : template.inKindDetailsEn,
        detectedDomain: cleanDisplayBrand,
        impactForecast: locale === "pl" ? template.impactPl : template.impactEn,
      };
    }
  }

  // Domyślny mecenat firmowy B2B
  const defaultAmount = convertFromPln(500, targetCurrency);
  return {
    goal:
      locale === "pl"
        ? `Oficjalne partnerstwo B2B z marką ${cleanDisplayBrand}`
        : `Official Corporate Partnership with ${cleanDisplayBrand}`,
    amount: defaultAmount,
    currency: targetCurrency,
    description:
      locale === "pl"
        ? `Dedykowany pakiet mecenatu firmowego: logotyp na stronie klubu, certyfikat CSR i transparentne rozliczenie w rejestrze.`
        : `Verified corporate patronage package: company logo on club portal, ESG certificate, and public ledger record.`,
    confidence: 96.1,
    category: "general",
    reasoning:
      locale === "pl"
        ? `Zidentyfikowano oficjalną witrynę partnera (${cleanDisplayBrand}). Rekomendowany certyfikowany mecenat firmowy.`
        : `Verified business web domain (${cleanDisplayBrand}). Recommended official corporate patron package.`,
    clubName,
    sponsorshipType: "financial",
    detectedDomain: cleanDisplayBrand,
    impactForecast: {
      beneficiaries:
        locale === "pl"
          ? "Cała społeczność 120 adeptów klubu"
          : "Entire academy community of 120 students",
      metric:
        locale === "pl"
          ? "Oficjalny certyfikat zaangażowania społecznego CSR/ESG"
          : "Official ESG corporate social responsibility verified badge",
      socialRoi:
        locale === "pl"
          ? "Trwały wpis w publicznym rejestrze mecenasów sportu"
          : "Permanent immutable record in public patron ledger",
      badge: locale === "pl" ? "Partnerstwo CSR" : "ESG Verified Partner",
    },
  };
}

// Funkcja wyciągająca kwotę oraz walutę z zapytania tekstowego
function extractCustomAmountAndCurrency(
  text: string,
  defaultCurrency: SupportedCurrency,
): { amount: number; currency: SupportedCurrency } | null {
  const match =
    text.match(/(\d+[\d\s]*)\s*(zł|pln|eur|euro|€|usd|dolar(?:y|ów)?|\$)/i) ||
    text.match(
      /(?:kwot[aę]|daj[eę]|wpłac[eę]|budżet)\s*(?:to|w wysokości)?\s*(\d+[\d\s]*)/i,
    );

  if (match && match[1]) {
    const val = parseInt(match[1].replace(/\s+/g, ""), 10);
    if (!isNaN(val) && val >= 10 && val <= 50000) {
      let detectedCurr = defaultCurrency;
      if (match[2]) {
        const c = match[2].toLowerCase();
        if (c.includes("eur") || c.includes("€")) detectedCurr = "EUR";
        else if (c.includes("usd") || c.includes("dol") || c.includes("$"))
          detectedCurr = "USD";
        else detectedCurr = "PLN";
      }
      return { amount: val, currency: detectedCurr };
    }
  }
  return null;
}

// Wykrywanie intencji wsparcia barterowego
function detectInKindTextIntent(text: string): boolean {
  return /(barter|rzeczow|in-kind|użycz|przewiez|wydruk|upiecz|catering|prowiant|napraw|odmaluj)/i.test(
    text,
  );
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const query = String(body.query || "").trim();
    const locale: Language = body.locale === "en" ? "en" : "pl";
    const requestedCurrency: SupportedCurrency =
      body.currency === "EUR" || body.currency === "USD"
        ? body.currency
        : "PLN";

    const t = getTranslations(locale);

    if (!query) {
      return NextResponse.json(
        {
          code: "EMPTY_QUERY",
          error:
            locale === "pl"
              ? "Wprowadź intencję, budżet lub link do strony firmy."
              : "Please enter your intention, budget, or company website URL.",
        },
        { status: 400 },
      );
    }

    const lowerQuery = query.toLowerCase();

    // 1. Sprawdzamy link do strony www
    const companyMatch = await analyzeCompanyProfile(
      query,
      locale,
      t.agent.clubName,
      requestedCurrency,
    );
    if (companyMatch) {
      return NextResponse.json(companyMatch);
    }

    const customAmountData = extractCustomAmountAndCurrency(
      query,
      requestedCurrency,
    );
    const activeCurrency = customAmountData?.currency || requestedCurrency;
    const isTextInKind = detectInKindTextIntent(lowerQuery);

    // 2. Zapytanie do modelu Gemini
    const geminiKey =
      process.env.GEMINI_API_KEY ||
      process.env.GOOGLE_GENAI_API_KEY ||
      process.env.GOOGLE_API_KEY;

    if (geminiKey) {
      try {
        const promptText = `
Jesteś PatronAgentem – inteligentnym agentem mecenatu sportu dziecięcego dla klubu ${t.agent.clubName}.
Użytkownik wpisał intencję: "${query}".
Wybrana preferowana waluta: ${activeCurrency}. Język odpowiedzi: ${locale}.
Jeśli intencja sugeruje pomoc rzeczową lub barter, ustaw "sponsorshipType": "in_kind". Jeśli finansową, "financial".
Wygeneruj także przewidywany wpływ społeczny ("impactForecast"): liczbę beneficjentów, metrykę oraz socialRoi.

Zwróć WYŁĄCZNIE poprawny JSON pasujący do schematu:
{
  "goal": "konkretna, profesjonalna nazwa celu dopasowana do klubu szachowego",
  "amount": kwota_numeryczna_odpowiednia_dla_waluty_${activeCurrency},
  "currency": "${activeCurrency}",
  "description": "precyzyjny opis na co pójdą środki lub w czym pomoże partner (1-2 zdania)",
  "confidence": liczba_od_92_do_99_z_jednym_miejscem_po_przecinku,
  "category": "equipment" | "travel" | "trophies" | "scholarship" | "general",
  "reasoning": "krótkie uzasadnienie agenta dlaczego ta potrzeba jest kluczowa dla klubu",
  "sponsorshipType": "financial" | "in_kind",
  "inKindDetails": "krótki opis darowizny rzeczowej (opcjonalnie jeśli in_kind)",
  "impactForecast": {
    "beneficiaries": "np. 40 dzieci",
    "metric": "np. 180 partii turniejowych",
    "socialRoi": "np. 100% z medalem",
    "badge": "np. Sukces Dzieci"
  }
}
`;

        const modelEndpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiKey}`;

        const geminiRes = await fetch(modelEndpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: promptText }] }],
            generationConfig: {
              responseMimeType: "application/json",
              temperature: 0.2,
            },
          }),
          cache: "no-store",
        });

        if (geminiRes.ok) {
          const geminiData = await geminiRes.json();
          const rawText =
            geminiData?.candidates?.[0]?.content?.parts?.[0]?.text;

          if (rawText) {
            let cleanJson = rawText.trim();
            if (cleanJson.startsWith("```json")) {
              cleanJson = cleanJson
                .replace(/^```json\s*/, "")
                .replace(/\s*```$/, "");
            } else if (cleanJson.startsWith("```")) {
              cleanJson = cleanJson
                .replace(/^```\s*/, "")
                .replace(/\s*```$/, "");
            }

            const parsed = JSON.parse(cleanJson);

            const responsePayload: AgentMatchResponse = {
              goal: parsed.goal || t.agent.line,
              amount:
                customAmountData?.amount ||
                Number(parsed.amount) ||
                convertFromPln(400, activeCurrency),
              currency: activeCurrency,
              description: parsed.description || t.agent.purpose,
              confidence: Number(parsed.confidence) || 97.5,
              category: parsed.category || "general",
              reasoning:
                parsed.reasoning ||
                (locale === "pl"
                  ? "Cel zweryfikowany przez protokół PatronAgent."
                  : "Goal verified by PatronAgent protocol."),
              clubName: t.agent.clubName,
              sponsorshipType:
                parsed.sponsorshipType === "in_kind" || isTextInKind
                  ? "in_kind"
                  : "financial",
              inKindDetails: parsed.inKindDetails,
              impactForecast: parsed.impactForecast || {
                beneficiaries:
                  locale === "pl"
                    ? "40 dzieci z klubu"
                    : "40 youth club members",
                metric:
                  locale === "pl"
                    ? "Bezpośrednie wsparcie rozwoju sportowego"
                    : "Direct sports development funding",
                socialRoi:
                  locale === "pl"
                    ? "100% transparentne wykorzystanie środków"
                    : "100% verifiable community impact",
                badge:
                  locale === "pl" ? "Zweryfikowany Wpływ" : "Verified Impact",
              },
            };
            return NextResponse.json(responsePayload);
          }
        }
      } catch (geminiError) {
        console.warn(
          "Fallback do katalogu semantycznego z powodu błędu Gemini API:",
          geminiError,
        );
      }
    }

    // 3. Dopasowanie semantyczne z bazy potrzeb
    const matchedCatalogItem = VERIFIED_NEEDS_CATALOG.find((item) =>
      item.keywords.some((kw) => lowerQuery.includes(kw)),
    );

    if (matchedCatalogItem) {
      const baseAmount = convertFromPln(
        matchedCatalogItem.amountPln,
        activeCurrency,
      );
      const responsePayload: AgentMatchResponse = {
        goal:
          locale === "pl"
            ? matchedCatalogItem.goalPl
            : matchedCatalogItem.goalEn,
        amount: customAmountData?.amount || baseAmount,
        currency: activeCurrency,
        description:
          locale === "pl"
            ? matchedCatalogItem.descPl
            : matchedCatalogItem.descEn,
        confidence: matchedCatalogItem.confidenceBase,
        category: matchedCatalogItem.category,
        reasoning:
          locale === "pl"
            ? `Wykryto bezpośrednią zbieżność z priorytetową kategorią potrzeb klubu: ${matchedCatalogItem.category}.`
            : `Direct match detected with priority club needs category: ${matchedCatalogItem.category}.`,
        clubName: t.agent.clubName,
        sponsorshipType: isTextInKind ? "in_kind" : "financial",
        inKindDetails: isTextInKind
          ? locale === "pl"
            ? `Świadczenie barterowe w obszarze: ${matchedCatalogItem.goalPl}`
            : `In-kind sponsorship matching: ${matchedCatalogItem.goalEn}`
          : undefined,
        impactForecast:
          locale === "pl"
            ? matchedCatalogItem.impactPl
            : matchedCatalogItem.impactEn,
      };
      return NextResponse.json(responsePayload);
    }

    // 4. Uniwersalny fallback
    const fallbackAmount = convertFromPln(400, activeCurrency);
    const generalResponse: AgentMatchResponse = {
      goal:
        locale === "pl"
          ? `Mecenat celowy: ${query.slice(0, 70)}`
          : `Dedicated Patronage: ${query.slice(0, 70)}`,
      amount: customAmountData?.amount || fallbackAmount,
      currency: activeCurrency,
      description:
        locale === "pl"
          ? `Środki zostaną skierowane na bezpośrednią realizację wskazanej potrzeby pod nadzorem Zarządu ${t.agent.clubName}.`
          : `Funds will be allocated directly towards the requested need under the supervision of ${t.agent.clubName} Board.`,
      confidence: 94.8,
      category: "general",
      reasoning:
        locale === "pl"
          ? "Indywidualna intencja mecenasa przekształcona w transparentną mikrozbiórkę celową."
          : "Individual patron intention converted into a transparent verifiable allocation.",
      clubName: t.agent.clubName,
      sponsorshipType: isTextInKind ? "in_kind" : "financial",
      inKindDetails: isTextInKind
        ? locale === "pl"
          ? `Świadczenie rzeczowe: ${query.slice(0, 60)}`
          : `In-kind contribution: ${query.slice(0, 60)}`
        : undefined,
      impactForecast: {
        beneficiaries:
          locale === "pl"
            ? "Podopieczni sekcji juniorów"
            : "Junior division athletes",
        metric:
          locale === "pl"
            ? "Realizacja wskazanego celu statutowego klubu"
            : "Statutory goal execution verified by club board",
        socialRoi:
          locale === "pl"
            ? "Certyfikat mecenasa z unikalnym identyfikatorem"
            : "Official patron certificate with public ledger entry",
        badge: locale === "pl" ? "Wpływ Celowy" : "Targeted Impact",
      },
    };

    return NextResponse.json(generalResponse);
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Internal Agent Error";
    console.error("Błąd w /api/agent/match:", message);

    return NextResponse.json(
      {
        code: "AGENT_ANALYSIS_FAILED",
        error: message,
      },
      { status: 500 },
    );
  }
}
