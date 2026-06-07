import { rangeForPeriod } from "@/features/history/period";

describe("rangeForPeriod", () => {
  const now = new Date("2026-05-15T14:30:00Z");

  it("returns empty range for 'all'", () => {
    expect(rangeForPeriod("all", now)).toEqual({});
  });

  it("'today' anchors from local midnight", () => {
    const range = rangeForPeriod("today", now);
    expect(range.from).toBeDefined();
    expect(range.to).toBeUndefined();
    const from = new Date(range.from!);
    expect(from.getHours()).toBe(0);
    expect(from.getMinutes()).toBe(0);
    expect(from.getSeconds()).toBe(0);
    expect(from.getMilliseconds()).toBe(0);
    expect(from.getTime()).toBeLessThanOrEqual(now.getTime());
  });

  it("'week' covers the last 7 days", () => {
    const range = rangeForPeriod("week", now);
    const fromMs = new Date(range.from!).getTime();
    const diffDays = (now.getTime() - fromMs) / 86_400_000;
    expect(diffDays).toBeCloseTo(7, 1);
  });

  it("'month' covers the last 30 days", () => {
    const range = rangeForPeriod("month", now);
    const fromMs = new Date(range.from!).getTime();
    const diffDays = (now.getTime() - fromMs) / 86_400_000;
    expect(diffDays).toBeCloseTo(30, 1);
  });

  it("never sets a `to` upper bound", () => {
    for (const p of ["all", "today", "week", "month"] as const) {
      expect(rangeForPeriod(p, now).to).toBeUndefined();
    }
  });
});
