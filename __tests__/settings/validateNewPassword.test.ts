import { validateNewPassword } from "@/features/settings/application/validateNewPassword";

describe("validateNewPassword", () => {
  it("under 8 chars → tooShort", () => {
    expect(validateNewPassword("short", "short")).toEqual({
      ok: false,
      reason: "tooShort",
    });
  });

  it("mismatch → mismatch", () => {
    expect(validateNewPassword("longpassword1", "longpassword2")).toEqual({
      ok: false,
      reason: "mismatch",
    });
  });

  it("8+ matching → ok", () => {
    expect(validateNewPassword("longpassword", "longpassword")).toEqual({
      ok: true,
    });
  });
});
