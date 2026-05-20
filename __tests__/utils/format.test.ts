import {
  estimateMinutesFromBalance,
  formatCentsAsUah,
  formatDuration,
} from "@/utils/format";

describe("formatCentsAsUah", () => {
  it("renders 1234 cents as 12,34 (uk locale, 2 decimals)", () => {
    expect(formatCentsAsUah(1234)).toContain("12");
    expect(formatCentsAsUah(1234)).toContain("34");
  });

  it("renders 0 cents as 0,00", () => {
    expect(formatCentsAsUah(0)).toContain("0");
  });
});

describe("estimateMinutesFromBalance", () => {
  it("returns 0 when price per second is zero or negative", () => {
    expect(estimateMinutesFromBalance(1000, 0)).toBe(0);
    expect(estimateMinutesFromBalance(1000, -1)).toBe(0);
  });

  it("computes whole minutes from balance/pricePerSecond", () => {
    // 1¢/s * 60s/min = 60¢/min ⇒ 6000¢ = 100 min
    expect(estimateMinutesFromBalance(6000, 1)).toBe(100);
  });

  it("floors fractional minutes (no rounding up)", () => {
    // 6090¢ / 1¢/s = 6090s = 101.5 min ⇒ floor → 101
    expect(estimateMinutesFromBalance(6090, 1)).toBe(101);
  });
});

describe("formatDuration", () => {
  it("pads seconds to two digits", () => {
    expect(formatDuration(65)).toBe("1:05");
  });

  it("renders 0 as 0:00", () => {
    expect(formatDuration(0)).toBe("0:00");
  });

  it("handles long calls", () => {
    expect(formatDuration(3725)).toBe("62:05");
  });
});
