// lib/needsCatalog.ts

import type { Language } from "@/lib/translations";

export type SponsorshipType = "financial" | "in_kind";
export type SupportedCurrency = "PLN" | "EUR" | "USD";
export type NeedCategory =
  | "equipment"
  | "travel"
  | "trophies"
  | "scholarship"
  | "general";

export interface ImpactForecast {
  beneficiaries: string;
  metric: string;
  socialRoi: string;
  badge: string;
}

export interface VerifiedNeed {
  category: NeedCategory;
  keywords: string[];
  goalPl: string;
  goalEn: string;
  amountPln: number;
  descPl: string;
  descEn: string;
  confidenceBase: number;
  impactPl: ImpactForecast;
  impactEn: ImpactForecast;
}

export interface CompanyProfileTemplate {
  pattern: RegExp;
  category: NeedCategory;
  sponsorshipType: SponsorshipType;
  amountPln: number;
  confidence: number;
  goalPl: (brand: string) => string;
  goalEn: (brand: string) => string;
  descPl: (brand: string) => string;
  descEn: (brand: string) => string;
  reasoningPl: (brand: string) => string;
  reasoningEn: (brand: string) => string;
  inKindDetailsPl?: string;
  inKindDetailsEn?: string;
  impactPl: ImpactForecast;
  impactEn: ImpactForecast;
}

// Przelicznik walutowy dla zagranicznych mecenasów (zaokrąglany)
export function convertFromPln(
  amountPln: number,
  currency: SupportedCurrency,
): number {
  if (currency === "EUR") return Math.round(amountPln / 4);
  if (currency === "USD") return Math.round(amountPln / 4);
  return amountPln;
}

// Baza zweryfikowanych potrzeb statutowych klubu UKS Roszada Radom
export const VERIFIED_NEEDS_CATALOG: VerifiedNeed[] = [
  {
    category: "trophies",
    keywords: [
      "puchar",
      "puchary",
      "trofe",
      "medal",
      "medale",
      "nagrod",
      "troph",
      "cup",
      "award",
    ],
    goalPl: "Puchary grawerowane i medale na Mistrzostwa Juniorów",
    goalEn: "Engraved Trophies and Medals for Junior Championships",
    amountPln: 400,
    descPl:
      "Komplet 12 pucharów z tabliczką pamiątkową oraz 40 tłoczonych medali dla najmłodszych adeptów szachów.",
    descEn:
      "Set of 12 custom engraved trophies and 40 cast medals for youth chess tournament finalists.",
    confidenceBase: 98.4,
    impactPl: {
      beneficiaries: "52 dzieci (roczniki 2012–2018)",
      metric: "180 partii turniejowych w atmosferze profesjonalnej rywalizacji",
      socialRoi: "100% uczestników z oficjalnym medalem pamiątkowym",
      badge: "Wzrost motywacji o 40%",
    },
    impactEn: {
      beneficiaries: "52 young players (age 8–14)",
      metric:
        "180 competitive matches played in professional tournament conditions",
      socialRoi: "100% participant recognition with custom keepsake medal",
      badge: "Motivation boost +40%",
    },
  },
  {
    category: "equipment",
    keywords: [
      "zegar",
      "zegary",
      "dgt",
      "czas",
      "szachownica",
      "bierki",
      "clock",
      "clocks",
      "timer",
      "board",
      "pieces",
    ],
    goalPl: "5 profesjonalnych zegarów elektronicznych DGT 2010",
    goalEn: "5 Professional DGT 2010 Official Chess Clocks",
    amountPln: 600,
    descPl:
      "Atestowane przez FIDE zegary elektroniczne niezbędne do rozgrywek ligowych i turniejów klasyfikacyjnych.",
    descEn:
      "FIDE-approved digital chess timers essential for league fixtures and official rating tournaments.",
    confidenceBase: 97.2,
    impactPl: {
      beneficiaries: "80 członków klubu przez 5+ lat",
      metric: "Ponad 1200 godzin profesjonalnego treningu tempowego",
      socialRoi: "Awans 6 juniorów do wyższej kategorii szachowej PZSzach",
      badge: "Inwestycja długoterminowa",
    },
    impactEn: {
      beneficiaries: "80 academy club members across 5+ seasons",
      metric: "Over 1200 hours of FIDE-standard blitz and classical training",
      socialRoi: "6 junior qualifications for regional championships",
      badge: "Long-term equipment ROI",
    },
  },
  {
    category: "travel",
    keywords: [
      "dojazd",
      "wyjazd",
      "transport",
      "bus",
      "paliwo",
      "hotel",
      "travel",
      "trip",
      "accommodation",
    ],
    goalPl: "Fundusz transportowo-hotelowy: Finały Mistrzostw Polski",
    goalEn: "Travel & Accommodation Fund: National Junior Finals",
    amountPln: 1200,
    descPl:
      "Pokrycie kosztów bezpiecznego przejazdu busem i zakwaterowania 6-osobowej kadry juniorów UKS Roszada.",
    descEn:
      "Covering bus travel and hotel lodging for the 6-player junior squad representing UKS Roszada.",
    confidenceBase: 99.1,
    impactPl: {
      beneficiaries: "6 czołowych reprezentantów klubu + trener",
      metric: "3 dni ogólnopolskich zmagań mistrzowskich",
      socialRoi: "100% zniwelowanie bariery finansowej dla rodzin talentów",
      badge: "Równe szanse startu",
    },
    impactEn: {
      beneficiaries: "6 top youth squad representatives + coach",
      metric: "3 days of elite national championship play",
      socialRoi: "100% financial barrier removal for low-income talent",
      badge: "Equal sports access",
    },
  },
  {
    category: "scholarship",
    keywords: [
      "stypendium",
      "stypendia",
      "szkolenie",
      "trener",
      "arcymistrz",
      "scholarship",
      "training",
      "coach",
      "master",
    ],
    goalPl: "Stypendium szkoleniowe dla utalentowanych juniorów",
    goalEn: "Training Scholarship for Gifted Junior Talents",
    amountPln: 800,
    descPl:
      "Cykl indywidualnych warsztatów analitycznych z mistrzem krajowym dla czołowych juniorów klubu.",
    descEn:
      "Series of individual opening preparation and masterclass coaching for promising youth players.",
    confidenceBase: 96.5,
    impactPl: {
      beneficiaries: "3 najzdolniejszych juniorów klubu",
      metric: "24 godziny zaawansowanej analizy partii i debiutów",
      socialRoi: "Przyrost rankingu FIDE o średnio +85 punktów ELO",
      badge: "Rozwój talentu",
    },
    impactEn: {
      beneficiaries: "3 premier junior chess prospects",
      metric: "24 hours of deep engine opening preparation with FIDE Master",
      socialRoi: "Estimated rating improvement of +85 ELO points",
      badge: "Talent acceleration",
    },
  },
];

// Profile branżowe dopasowania mecenatu B2B oraz barterowego
export const COMPANY_PROFILE_TEMPLATES: CompanyProfileTemplate[] = [
  // 1. Cukiernie / Piekarnie / Słodycze
  {
    pattern:
      /(slodk|słodk|cukier|ciast|tort|candy|sweet|choc|czekol|baker|piekarn|prowiant)/i,
    category: "general",
    sponsorshipType: "in_kind",
    amountPln: 350,
    confidence: 98.7,
    goalPl: () =>
      "Mecenat rzeczowy: Słodki stół i poczęstunek na Turniej Mikołajkowy",
    goalEn: () =>
      "In-Kind Patronage: Sweet Table & Pastry Treats for Youth Tournament",
    descPl: () =>
      "Zapewnienie słodkich upominków, wypieków lub zdrowych przekąsek dla 60 dzieci podczas uroczystego zakończenia memoriału przez Twoją markę.",
    descEn: () =>
      "Supply of sweet treats, pastry snacks and celebratory dessert packages for 60 youth finalists by your brand.",
    reasoningPl: (brand) =>
      `Zidentyfikowano profil cukierniczy/słodkości (${brand}). Klub organizuje coroczny Turniej Mikołajkowy i potrzebuje słodkiego poczęstunku dla najmłodszych.`,
    reasoningEn: (brand) =>
      `Confectionery/bakery business profile detected (${brand}). Club has verified demand for youth tournament celebration catering.`,
    inKindDetailsPl: "60 paczek ze słodyczami / ciasto na ceremonię medalową",
    inKindDetailsEn: "60 sweet celebration snack packs for young participants",
    impactPl: {
      beneficiaries: "60 uśmiechniętych juniorów",
      metric: "Uroczysty słodki stół podczas ceremonii wręczenia nagród",
      socialRoi: "100% rodzin z pozytywnym skojarzeniem z Twoją marką",
      badge: "Radość dzieci",
    },
    impactEn: {
      beneficiaries: "60 happy junior players",
      metric: "Festive celebration table at award ceremony",
      socialRoi: "100% positive community brand recall among parents",
      badge: "Youth Joy Impact",
    },
  },
  // 2. Pranie dywanów / Sprzątanie / Czystość
  {
    pattern:
      /(pranie|dywan|czyszcz|sprzat|sprząt|clean|wash|ozonow|tapicerk|higien)/i,
    category: "equipment",
    sponsorshipType: "in_kind",
    amountPln: 450,
    confidence: 99.1,
    goalPl: () =>
      "Mecenat rzeczowy: Profesjonalne czyszczenie sali treningowej klubu",
    goalEn: () =>
      "In-Kind Patronage: Professional Youth Training Facility Deep Clean",
    descPl: () =>
      "Partnerstwo barterowe: kompleksowe pranie wykładzin i tapicerek w sali gier UKS Roszada przed rozpoczęciem sezonu ligowego.",
    descEn: () =>
      "Barter service partnership: deep cleaning and sanitization of youth training clubroom flooring and seating.",
    reasoningPl: (brand) =>
      `Zidentyfikowano usługi czyszczenia i prania (${brand}). Czysta, bezpieczna sala treningowa ma bezpośredni wpływ na komfort 80 dzieci.`,
    reasoningEn: (brand) =>
      `Cleaning/carpet washing business detected (${brand}). Maintaining a sanitized chess hall directly benefits 80 youth members.`,
    inKindDetailsPl: "Czyszczenie 60m² wykładziny w sali klubowej",
    inKindDetailsEn: "Deep steam cleaning of 60m² clubroom carpet",
    impactPl: {
      beneficiaries: "80 młodych szachistów i ich rodzice",
      metric: "Higieniczne warunki treningowe przez 6 miesięcy",
      socialRoi: "Ochrona zdrowia alergików i komfort skupienia",
      badge: "Zdrowie & Bezpieczeństwo",
    },
    impactEn: {
      beneficiaries: "80 youth athletes and their families",
      metric: "Sanitized indoor training environment for 6 months",
      socialRoi: "Hypoallergenic environment & enhanced cognitive focus",
      badge: "Health & Safety Impact",
    },
  },
  // 3. Drukarnie / Poligrafia / Reklama
  {
    pattern:
      /(druk|print|poligraf|reklam|virgo|studio|graf|sign|plakat|baner)/i,
    category: "equipment",
    sponsorshipType: "in_kind",
    amountPln: 350,
    confidence: 98.4,
    goalPl: () => "Mecenat rzeczowy: Druk 150 dyplomów i banerów sponsorskich",
    goalEn: () =>
      "In-Kind Patronage: Production of 150 Diplomas & Event Banners",
    descPl: () =>
      "Wsparcie barterowe: wydruk dyplomów z uszlachetnieniem, identyfikatorów i banera turniejowego z logo Twojej firmy.",
    descEn: () =>
      "In-kind printing sponsorship: premium tournament diplomas, badges, and venue banners with sponsor logo.",
    reasoningPl: (brand) =>
      `Rozpoznano profil poligraficzny/reklamowy (${brand}). Klub potrzebuje estetycznych materiałów na każdy turniej.`,
    reasoningEn: (brand) =>
      `Print and advertising profile verified (${brand}). Essential for official tournament branding.`,
    inKindDetailsPl: "150 dyplomów A4 + baner 2x1m",
    inKindDetailsEn: "150 premium A4 diplomas + 2x1m vinyl banner",
    impactPl: {
      beneficiaries: "150 uczestników turniejów wojewódzkich",
      metric: "Oficjalna oprawa wizualna i pamiątka na całe życie",
      socialRoi: "Stała ekspozycja marki mecenasa na banerze klubu",
      badge: "Wizerunek & Prestiż",
    },
    impactEn: {
      beneficiaries: "150 regional tournament competitors",
      metric: "Professional ceremony aesthetics and lifelong certificates",
      socialRoi: "Permanent brand visibility on official club backdrop",
      badge: "Prestige & Branding",
    },
  },
  // 4. Transport / Wynajem busów / Logistyka
  {
    pattern: /(trans|bus|autobus|przewoz|przewóz|logist|wynaj|taxi|voyage)/i,
    category: "travel",
    sponsorshipType: "in_kind",
    amountPln: 800,
    confidence: 99.2,
    goalPl: () =>
      "Mecenat rzeczowy: Transport busem na Finały Mistrzostw Polski",
    goalEn: () => "In-Kind Patronage: Junior Finals Bus Transportation",
    descPl: () =>
      "Przewóz 8-osobowej reprezentacji juniorów klubu na zawody wyjazdowe z oznaczeniem busa tablicą Mecenasa.",
    descEn: () =>
      "Complimentary safe travel for 8 junior players to national tournament fixtures with sponsor signage.",
    reasoningPl: (brand) =>
      `Zidentyfikowano branżę transportową (${brand}). Koszty transportu są największym obciążeniem budżetu rodziców.`,
    reasoningEn: (brand) =>
      `Transportation firm detected (${brand}). Travel expenses are the largest financial burden on youth players' families.`,
    inKindDetailsPl: "Przejazd Radom - Finały Ligi (tam i z powrotem)",
    inKindDetailsEn: "Roundtrip tournament transit for 8 players",
    impactPl: {
      beneficiaries: "8 zawodników i sztab trenerski",
      metric: "700 km bezpiecznej podróży na zawody rangi mistrzowskiej",
      socialRoi: "Umożliwienie startu bez obciążania budżetów domowych",
      badge: "Wyrównanie Szans",
    },
    impactEn: {
      beneficiaries: "8 squad players and coaching staff",
      metric: "700 km safe travel to national championship",
      socialRoi: "Zero out-of-pocket costs for promising student athletes",
      badge: "Direct Equality Impact",
    },
  },
  // 5. IT / Software / Technologie
  {
    pattern: /(tech|soft|dev|code|it|cloud|kancelar|prawo|finans|broker)/i,
    category: "equipment",
    sponsorshipType: "financial",
    amountPln: 600,
    confidence: 97.9,
    goalPl: () =>
      "Mecenat technologiczny: Cyfrowa transmisja partii i stypendia IT",
    goalEn: () => "Tech Patronage: Live Chess Broadcast & IT Scholarships",
    descPl: () =>
      "Finansowanie sprzętu transmisyjnego i oprogramowania szachowego dla juniorów z certyfikatem Mecenasa Innowacji.",
    descEn: () =>
      "Funding broadcast digital chess boards and analytic software with an official Innovation Patron certificate.",
    reasoningPl: (brand) =>
      `Profil innowacyjny/doradczy (${brand}). Idealne dopasowanie do edukacji analitycznej dzieci i transmisji online.`,
    reasoningEn: (brand) =>
      `Technology/consulting presence detected (${brand}). Directly empowers analytical training.`,
    impactPl: {
      beneficiaries: "1200+ widzów transmisji online rocznie",
      metric: "Globalna ekspozycja logotypu mecenasa w streamingu",
      socialRoi: "Rozwój myślenia algorytmicznego i strategicznego młodzieży",
      badge: "Innowacja & Edukacja",
    },
    impactEn: {
      beneficiaries: "1200+ annual live stream viewers",
      metric: "Global sponsor exposure across broadcast streams",
      socialRoi: "Fostering STEM and analytical mindset among youth",
      badge: "Innovation & STEM",
    },
  },
];
