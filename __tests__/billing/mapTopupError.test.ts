import { mapTopupError } from "@/features/billing/application/mapTopupError";

function axiosError(payload: unknown, status: number) {
  return {
    isAxiosError: true,
    response: { status, data: payload },
    message: "err",
  };
}

describe("mapTopupError", () => {
  it("429 → rate-limited", () => {
    expect(
      mapTopupError(axiosError({ statusCode: 429, message: "too fast" }, 429)),
    ).toEqual({ kind: "rate-limited" });
  });

  it("400 with string message → bad-amount with server message", () => {
    expect(
      mapTopupError(axiosError({ statusCode: 400, message: "bad value" }, 400)),
    ).toEqual({ kind: "bad-amount", serverMessage: "bad value" });
  });

  it("400 with array message → bad-amount with joined server message", () => {
    expect(
      mapTopupError(
        axiosError({ statusCode: 400, message: ["too low", "or too high"] }, 400),
      ),
    ).toEqual({ kind: "bad-amount", serverMessage: "too low or too high" });
  });

  it("500 → generic", () => {
    expect(mapTopupError(axiosError({ statusCode: 500 }, 500))).toEqual({
      kind: "generic",
    });
  });

  it("plain error → generic", () => {
    expect(mapTopupError(new Error("nope"))).toEqual({ kind: "generic" });
  });
});
