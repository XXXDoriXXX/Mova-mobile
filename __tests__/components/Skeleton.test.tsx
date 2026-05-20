import React from "react";
import { render } from "@testing-library/react-native";

import { Skeleton } from "@/components/Skeleton";

describe("Skeleton", () => {
  it("renders without crashing", () => {
    const { toJSON } = render(<Skeleton />);
    expect(toJSON()).toBeTruthy();
  });

  it("forwards explicit width/height into style", () => {
    const { toJSON } = render(<Skeleton width={100} height={50} radius={8} />);
    const tree = toJSON() as unknown as { props: { style: unknown } } | null;
    expect(tree).not.toBeNull();
    const style = tree!.props.style;
    const flat = Array.isArray(style)
      ? Object.assign({}, ...style.filter(Boolean))
      : (style as Record<string, unknown>);
    expect(flat).toMatchObject({ width: 100, height: 50 });
  });
});
