import React from "react";
import { Text } from "react-native";
import { render } from "@testing-library/react-native";

import { ErrorBoundary } from "@/components/ErrorBoundary";

const realError = console.error;
beforeAll(() => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (console as any).error = jest.fn();
});
afterAll(() => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (console as any).error = realError;
});

function Boom(): React.ReactElement {
  throw new Error("kaboom");
}

describe("ErrorBoundary", () => {
  it("renders children when they don't throw", () => {
    const { getByText } = render(
      <ErrorBoundary>
        <Text>hello</Text>
      </ErrorBoundary>,
    );
    expect(getByText("hello")).toBeTruthy();
  });

  it("renders the fallback when a child throws", () => {
    const { getByText } = render(
      <ErrorBoundary>
        <Boom />
      </ErrorBoundary>,
    );
    expect(getByText("Something went wrong")).toBeTruthy();
    expect(getByText("kaboom")).toBeTruthy();
    expect(getByText("Reload")).toBeTruthy();
  });

  it("exposes a Sign out button when onSignOut is provided", () => {
    const onSignOut = jest.fn();
    const { getByText } = render(
      <ErrorBoundary onSignOut={onSignOut}>
        <Boom />
      </ErrorBoundary>,
    );
    expect(getByText("Sign out")).toBeTruthy();
  });
});
