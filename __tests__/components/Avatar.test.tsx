import React from "react";
import { render } from "@testing-library/react-native";

import { Avatar } from "@/components/Avatar";

describe("Avatar", () => {
  it("renders two-letter initials from a two-word name", () => {
    const { getByText } = render(<Avatar name="Іван Петренко" />);
    expect(getByText("ІП")).toBeTruthy();
  });

  it("renders first-two-letters for single-word names", () => {
    const { getByText } = render(<Avatar name="Alexandra" />);
    expect(getByText("AL")).toBeTruthy();
  });

  it("falls back to ? for null", () => {
    const { getByText } = render(<Avatar name={null} />);
    expect(getByText("?")).toBeTruthy();
  });

  it("falls back to ? for empty string", () => {
    const { getByText } = render(<Avatar name="" />);
    expect(getByText("?")).toBeTruthy();
  });

  it("trims whitespace before computing initials", () => {
    const { getByText } = render(<Avatar name="  Іван   Петренко  " />);
    expect(getByText("ІП")).toBeTruthy();
  });

  it("uppercases initials", () => {
    const { getByText } = render(<Avatar name="ivan petrov" />);
    expect(getByText("IP")).toBeTruthy();
  });
});
