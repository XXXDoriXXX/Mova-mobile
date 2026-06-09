import {
  estimateMinutesFromTopup,
  TOPUP_MAX_UAH,
  TOPUP_MIN_UAH,
  validateTopupAmount,
} from "@/features/billing/application/validateTopupAmount";

describe("validateTopupAmount", () => {
  it("empty input → fail with reason empty", () => {
    expect(validateTopupAmount("")).toEqual({ ok: false, reason: "empty" });
  });

  it("non-numeric → fail with out-of-range", () => {
    expect(validateTopupAmount("abc")).toEqual({
      ok: false,
      reason: "out-of-range",
    });
  });

  it("below min → fail", () => {
    expect(validateTopupAmount(String(TOPUP_MIN_UAH - 1))).toEqual({
      ok: false,
      reason: "out-of-range",
    });
  });

  it("above max → fail", () => {
    expect(validateTopupAmount(String(TOPUP_MAX_UAH + 1))).toEqual({
      ok: false,
      reason: "out-of-range",
    });
  });

  it("100 → ok, 10000 cents", () => {
    expect(validateTopupAmount("100")).toEqual({
      ok: true,
      amountUah: 100,
      amountCents: 10_000,
    });
  });

  it("fractional → rounds cents", () => {
    expect(validateTopupAmount("12.34")).toEqual({
      ok: true,
      amountUah: 12.34,
      amountCents: 1234,
    });
  });
});

describe("estimateMinutesFromTopup", () => {
  it("floors fractional minutes", () => {
    expect(estimateMinutesFromTopup(100, 1)).toBe(166);
  });

  it("price <= 0 falls back to 1c/s baseline", () => {
    expect(estimateMinutesFromTopup(100, 0)).toBe(166);
    expect(estimateMinutesFromTopup(100, -5)).toBe(166);
  });
});
