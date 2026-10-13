import { pl } from "./pl";
import { en } from "./en";

/**
 * Rekurencyjny typ przekształcający literały 'as const' w ogólny typ string,
 * z zachowaniem pełnej struktury zagnieżdżeń, tablic i obiektów.
 */
type DeepString<T> = T extends string
  ? string
  : T extends number
    ? number
    : T extends boolean
      ? boolean
      : T extends readonly (infer U)[]
        ? readonly DeepString<U>[]
        : T extends object
          ? { readonly [K in keyof T]: DeepString<T[K]> }
          : T;

export type Language = "pl" | "en";
export type Messages = DeepString<typeof pl>;

export const translations: Record<Language, Messages> = {
  pl,
  en,
};

export const DEFAULT_LANGUAGE: Language = "pl";
export const SUPPORTED_LANGUAGES: Language[] = ["pl", "en"] as const;

export function getTranslations(lang: Language = DEFAULT_LANGUAGE): Messages {
  return translations[lang] || translations[DEFAULT_LANGUAGE];
}
