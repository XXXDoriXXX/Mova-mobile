import { newIdempotencyKey } from "@/utils/idempotency-key";

describe("newIdempotencyKey", () => {
  it("returns a string", () => {
    expect(typeof newIdempotencyKey()).toBe("string");
  });

  it("matches UUID v4 shape (8-4-4-4-12 hex)", () => {
    const key = newIdempotencyKey();
    expect(key).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
    );
  });

  it("returns distinct values on successive calls", () => {
    const a = newIdempotencyKey();
    const b = newIdempotencyKey();
    expect(a).not.toBe(b);
  });

  it("conforms to the backend Idempotency-Key regex /^[\\x20-\\x7E]{1,64}$/", () => {
    const key = newIdempotencyKey();
    expect(key.length).toBeLessThanOrEqual(64);
    expect(key.length).toBeGreaterThanOrEqual(1);
    expect(/^[\x20-\x7E]+$/.test(key)).toBe(true);
  });
});
