import { mapPhoneVerifyError } from "@/features/auth/application/phoneVerifyErrors";

describe("mapPhoneVerifyError", () => {
  it("maps Firebase auth error codes", () => {
    expect(mapPhoneVerifyError({ code: "auth/invalid-phone-number" })).toBe(
      "verifyPhone.errInvalidNumber",
    );
    expect(
      mapPhoneVerifyError({ code: "auth/invalid-verification-code" }),
    ).toBe("verifyPhone.errInvalidCode");
    expect(mapPhoneVerifyError({ code: "auth/too-many-requests" })).toBe(
      "verifyPhone.errTooMany",
    );
  });

  it("maps a 409 backend payload to already-taken", () => {
    expect(
      mapPhoneVerifyError({ isAxiosError: true, response: { data: { statusCode: 409 } } }),
    ).toBe("verifyPhone.errAlreadyTaken");
  });

  it("maps a 401 backend payload to token-rejected", () => {
    expect(
      mapPhoneVerifyError({ isAxiosError: true, response: { data: { statusCode: 401 } } }),
    ).toBe("verifyPhone.errTokenRejected");
  });

  it("falls back to generic for unknown errors", () => {
    expect(mapPhoneVerifyError(new Error("boom"))).toBe(
      "verifyPhone.errGeneric",
    );
  });
});
