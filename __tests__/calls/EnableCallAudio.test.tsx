import React from "react";
import { Platform } from "react-native";
import { act, fireEvent, render } from "@testing-library/react-native";

import { EnableCallAudio } from "@/features/calls/EnableCallAudio";
import { getCallMediaTransport } from "@/features/calls/outgoing/application/callMediaTransport";

jest.mock("@/features/calls/outgoing/application/callMediaTransport", () => ({
  getCallMediaTransport: jest.fn(),
}));

const originalOs = Platform.OS;
let blocked = false;
const listeners = new Set<() => void>();
const enableAudio = jest.fn().mockResolvedValue(undefined);

beforeEach(() => {
  Object.defineProperty(Platform, "OS", { configurable: true, value: "web" });
  blocked = false;
  listeners.clear();
  jest.clearAllMocks();
  jest.mocked(getCallMediaTransport).mockReturnValue({
    connect: jest.fn(), disconnect: jest.fn(), setMuted: jest.fn(),
    setOnDisconnected: jest.fn(), isAvailable: () => true, enableAudio,
    getAudioBlocked: () => blocked,
    subscribeAudioBlocked: (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  });
});

afterEach(() => {
  Object.defineProperty(Platform, "OS", { configurable: true, value: originalOs });
});

it("shows a translated sound button only while blocked and retries directly from the tap", () => {
  const screen = render(<EnableCallAudio />);
  expect(screen.queryByRole("button")).toBeNull();
  act(() => {
    blocked = true;
    for (const listener of listeners) listener();
  });
  const button = screen.getByRole("button");
  expect(screen.getByText("Натисни, щоб чути дзвінок")).toBeTruthy();
  fireEvent.press(button);
  expect(enableAudio).toHaveBeenCalledTimes(1);
  act(() => {
    blocked = false;
    for (const listener of listeners) listener();
  });
  expect(screen.queryByRole("button")).toBeNull();
  screen.unmount();
  expect(listeners.size).toBe(0);
});

it("does not initialize the media transport on native screens", () => {
  Object.defineProperty(Platform, "OS", { configurable: true, value: "android" });
  expect(render(<EnableCallAudio />).queryByRole("button")).toBeNull();
  expect(getCallMediaTransport).not.toHaveBeenCalled();
});
