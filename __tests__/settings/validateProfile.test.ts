import { validateProfile } from "@/features/settings/application/validateProfile";

describe("validateProfile", () => {
  it("empty name → nameRequired", () => {
    expect(validateProfile("", "")).toEqual({
      ok: false,
      reason: "nameRequired",
    });
  });

  it("whitespace-only name → nameRequired", () => {
    expect(validateProfile("   ", "")).toEqual({
      ok: false,
      reason: "nameRequired",
    });
  });

  it("name only (no phone) → ok with phone undefined", () => {
    expect(validateProfile("Alice", "")).toEqual({
      ok: true,
      name: "Alice",
      phone: undefined,
    });
  });

  it("non-E164 phone → badPhone", () => {
    expect(validateProfile("Alice", "0671234567")).toEqual({
      ok: false,
      reason: "badPhone",
    });
  });

  it("E164 phone → ok with trimmed values", () => {
    expect(validateProfile(" Alice ", " +380671234567 ")).toEqual({
      ok: true,
      name: "Alice",
      phone: "+380671234567",
    });
  });
});
