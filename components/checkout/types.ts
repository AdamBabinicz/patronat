// components/checkout/types.ts
import type { Language, Messages } from "@/lib/translations";

export type Currency = "PLN" | "EUR" | "USD";

export interface DonationCheckoutProps {
  initialLocale?: Language;
  initialAmount?: number;
  initialCurrency?: Currency;
  initialGoal?: string;
  allocationDescription?: string;
  clubName?: string;
  messages?: Messages;
  onSuccessCallback?: (details: any) => void;
  onCancel?: () => void;
}

export const PRESET_AMOUNTS: Record<Currency, number[]> = {
  PLN: [50, 100, 250, 400, 600, 1200],
  EUR: [15, 25, 60, 100, 150, 300],
  USD: [15, 25, 60, 100, 150, 300],
};
