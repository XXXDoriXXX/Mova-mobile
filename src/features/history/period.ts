export type PeriodKey = "all" | "today" | "week" | "month";

export type PeriodRange = {
  from?: string;
  to?: string;
};

const DAY_MS = 86_400_000;

export function rangeForPeriod(period: PeriodKey, now: Date = new Date()): PeriodRange {
  if (period === "all") return {};
  if (period === "today") {
    const start = new Date(now);
    start.setHours(0, 0, 0, 0);
    return { from: start.toISOString() };
  }
  if (period === "week") {
    return { from: new Date(now.getTime() - 7 * DAY_MS).toISOString() };
  }
  return { from: new Date(now.getTime() - 30 * DAY_MS).toISOString() };
}
