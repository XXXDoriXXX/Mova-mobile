import { leaveCallScreen } from "@/features/calls/leaveCallScreen";

type RouterMock = Parameters<typeof leaveCallScreen>[0];

function makeRouter(canGoBack: boolean) {
  const router = {
    canGoBack: jest.fn(() => canGoBack),
    back: jest.fn(),
    replace: jest.fn(),
  };
  return router as unknown as RouterMock & typeof router;
}

describe("leaveCallScreen", () => {
  it("pops the stack when a screen is underneath", () => {
    const router = makeRouter(true);
    leaveCallScreen(router);
    expect(router.back).toHaveBeenCalledTimes(1);
    expect(router.replace).not.toHaveBeenCalled();
  });

  it("falls back to /home when the call screen is the navigation root", () => {
    // e.g. an incoming call opened straight from a push — nothing to GO_BACK to.
    const router = makeRouter(false);
    leaveCallScreen(router);
    expect(router.replace).toHaveBeenCalledWith("/home");
    expect(router.back).not.toHaveBeenCalled();
  });
});
