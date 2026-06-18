import { nextRevealCount } from "@/components/useStreamedText";

describe("nextRevealCount", () => {
  it("reveals one word at a time at a normal pace", () => {
    expect(nextRevealCount(0, 1)).toBe(1);
    expect(nextRevealCount(0, 6)).toBe(1);
    expect(nextRevealCount(3, 6)).toBe(4);
  });

  it("speeds up (catch-up) when a backlog builds, never overshooting", () => {
    expect(nextRevealCount(0, 12)).toBe(2); // ceil(12/6)
    expect(nextRevealCount(0, 60)).toBe(10);
    expect(nextRevealCount(58, 60)).toBe(59);
  });

  it("stops at the total and clamps when the target shrinks", () => {
    expect(nextRevealCount(6, 6)).toBe(6);
    expect(nextRevealCount(9, 4)).toBe(4); // interim revision made text shorter
    expect(nextRevealCount(0, 0)).toBe(0);
  });

  it("always converges to total by repeated application", () => {
    let n = 0;
    const total = 37;
    for (let i = 0; i < 100 && n < total; i++) n = nextRevealCount(n, total);
    expect(n).toBe(total);
  });
});
