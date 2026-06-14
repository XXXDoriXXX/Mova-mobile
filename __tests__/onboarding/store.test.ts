/* eslint-disable @typescript-eslint/no-require-imports */

describe("onboarding store", () => {
  beforeEach(() => {
    jest.resetModules();
  });

  it("starts in 'unknown' before hydrate", () => {
    const { useOnboardingStore } = require("@/onboarding/store");
    expect(useOnboardingStore.getState().status).toBe("unknown");
  });

  it("hydrate lands in 'needed' for a fresh device", async () => {
    const { useOnboardingStore } = require("@/onboarding/store");
    await useOnboardingStore.getState().hydrate();
    expect(useOnboardingStore.getState().status).toBe("needed");
  });

  it("complete flips status to 'done' and persists across hydrate", async () => {
    const { useOnboardingStore } = require("@/onboarding/store");
    await useOnboardingStore.getState().complete();
    expect(useOnboardingStore.getState().status).toBe("done");

    useOnboardingStore.setState({ status: "unknown" });
    await useOnboardingStore.getState().hydrate();
    expect(useOnboardingStore.getState().status).toBe("done");
  });
});
