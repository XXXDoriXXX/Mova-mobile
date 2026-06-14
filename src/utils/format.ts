import { formatDistanceToNowStrict } from "date-fns";
import { enUS, uk } from "date-fns/locale";

import i18n from "@/i18n";

export function formatCentsAsUah(cents: number): string {
  const value = cents / 100;
  return value.toLocaleString("uk-UA", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export function estimateMinutesFromBalance(
  balanceCents: number,
  pricePerSecondCents: number,
): number {
  if (pricePerSecondCents <= 0) return 0;
  return Math.floor(balanceCents / pricePerSecondCents / 60);
}

export function formatRelativeFromNow(iso: string): string {
  const locale = i18n.language === "en" ? enUS : uk;
  return formatDistanceToNowStrict(new Date(iso), { addSuffix: true, locale });
}

export function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export type DayPart = "morning" | "afternoon" | "evening" | "night";

export function dayPartFor(date: Date = new Date()): DayPart {
  const h = date.getHours();
  if (h < 5) return "night";
  if (h < 12) return "morning";
  if (h < 18) return "afternoon";
  if (h < 23) return "evening";
  return "night";
}

export function greetingKey(
  part: DayPart = dayPartFor(),
  random: number = Math.random(),
): string {
  const useAlt = random < 0.2;
  return useAlt ? `home.greeting_${part}_alt` : `home.greeting_${part}`;
}
