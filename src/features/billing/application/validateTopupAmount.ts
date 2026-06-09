export const TOPUP_QUICK_AMOUNTS = [50, 100, 500];
export const TOPUP_MIN_UAH = 1;
export const TOPUP_MAX_UAH = 1000;

export type TopupValidation =
  | { ok: true; amountUah: number; amountCents: number }
  | { ok: false; reason: "empty" | "out-of-range" };

export function validateTopupAmount(raw: string): TopupValidation {
  if (raw.length === 0) return { ok: false, reason: "empty" };
  const n = Number(raw);
  if (!Number.isFinite(n) || n < TOPUP_MIN_UAH || n > TOPUP_MAX_UAH) {
    return { ok: false, reason: "out-of-range" };
  }
  return { ok: true, amountUah: n, amountCents: Math.round(n * 100) };
}

export function estimateMinutesFromTopup(
  amountUah: number,
  pricePerSecondCents: number,
): number {
  const price = Math.max(pricePerSecondCents, 1);
  return Math.floor((amountUah * 100) / price / 60);
}
