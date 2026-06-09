import { selectRecentCallStatus } from "@/features/home/application/selectRecentCallStatus";

describe("selectRecentCallStatus", () => {
  it("pending → muted dot", () => {
    expect(selectRecentCallStatus("pending")).toEqual({
      iconName: "ellipse-outline",
      tone: "muted",
    });
  });

  it("active → success radio", () => {
    expect(selectRecentCallStatus("active")).toEqual({
      iconName: "radio",
      tone: "success",
    });
  });

  it("ended → muted check", () => {
    expect(selectRecentCallStatus("ended")).toEqual({
      iconName: "checkmark-circle",
      tone: "muted",
    });
  });

  it("failed → danger alert", () => {
    expect(selectRecentCallStatus("failed")).toEqual({
      iconName: "alert-circle",
      tone: "danger",
    });
  });
});
