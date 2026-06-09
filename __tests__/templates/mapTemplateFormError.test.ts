import { mapTemplateFormError } from "@/features/templates/application/mapTemplateFormError";

function axiosError(payload: unknown, status = 400) {
  return {
    isAxiosError: true,
    response: { status, data: payload },
    message: "err",
  };
}

describe("mapTemplateFormError", () => {
  it("PROMPT_INJECTION → inline field error on systemPrompt", () => {
    expect(
      mapTemplateFormError(
        axiosError({ statusCode: 400, error: "PROMPT_INJECTION", message: "x" }),
      ),
    ).toEqual({ kind: "field", field: "systemPrompt", code: "promptInjection" });
  });

  it("anything else → generic banner", () => {
    expect(
      mapTemplateFormError(axiosError({ statusCode: 500, message: "oops" }, 500)),
    ).toEqual({ kind: "banner", code: "generic" });
  });

  it("non-axios error → banner", () => {
    expect(mapTemplateFormError(new Error("nope"))).toEqual({
      kind: "banner",
      code: "generic",
    });
  });
});
