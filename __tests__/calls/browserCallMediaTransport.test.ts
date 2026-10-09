import { Room, RoomEvent, Track } from "livekit-client";

import { getCallMediaTransport } from "@/features/calls/outgoing/application/callMediaTransport.web";

jest.mock("livekit-client", () => ({
  Room: jest.fn(),
  RoomEvent: {
    Disconnected: "disconnected",
    TrackSubscribed: "trackSubscribed",
    TrackUnsubscribed: "trackUnsubscribed",
    AudioPlaybackStatusChanged: "audioPlaybackStatusChanged",
  },
  Track: { Kind: { Audio: "audio" } },
}));

const transport = getCallMediaTransport();
const handlers = new Map<string, (...args: unknown[]) => void>();
const room = {
  on: jest.fn((event: string, callback: (...args: unknown[]) => void) => {
    handlers.set(event, callback);
  }),
  connect: jest.fn().mockResolvedValue(undefined),
  startAudio: jest.fn().mockResolvedValue(undefined),
  disconnect: jest.fn().mockResolvedValue(undefined),
  localParticipant: { setMicrophoneEnabled: jest.fn().mockResolvedValue(undefined) },
};
const originalNavigator = Object.getOwnPropertyDescriptor(globalThis, "navigator");
const originalDocument = Object.getOwnPropertyDescriptor(globalThis, "document");

beforeEach(() => {
  jest.clearAllMocks();
  handlers.clear();
  jest.mocked(Room).mockImplementation(() => room as unknown as Room);
  Object.defineProperty(globalThis, "navigator", {
    configurable: true,
    value: { mediaDevices: { getUserMedia: jest.fn() } },
  });
  Object.defineProperty(globalThis, "document", {
    configurable: true,
    value: { body: { appendChild: jest.fn() } },
  });
});

afterEach(async () => {
  await transport.disconnect();
  for (const [key, descriptor] of [
    ["navigator", originalNavigator],
    ["document", originalDocument],
  ] as const) {
    if (descriptor) Object.defineProperty(globalThis, key, descriptor);
    else Reflect.deleteProperty(globalThis, key);
  }
});

it("connects browser media, enables the microphone and plays remote audio", async () => {
  await transport.connect({ url: "wss://media.example.test", token: "test-token" });
  expect(room.connect).toHaveBeenCalledWith("wss://media.example.test", "test-token");
  expect(room.startAudio).toHaveBeenCalled();
  expect(room.localParticipant.setMicrophoneEnabled).toHaveBeenCalledWith(true);

  const element = { remove: jest.fn() };
  const track = { kind: Track.Kind.Audio, attach: jest.fn(() => element), detach: () => [element] };
  handlers.get(RoomEvent.TrackSubscribed)?.(track);
  expect(document.body.appendChild).toHaveBeenCalledWith(element);
  handlers.get(RoomEvent.TrackUnsubscribed)?.(track);
  expect(element.remove).toHaveBeenCalled();
});

it("mutes and removes attached audio when disconnecting", async () => {
  await transport.connect({ url: "wss://media.example.test", token: "test-token" });
  const element = { remove: jest.fn() };
  handlers.get(RoomEvent.TrackSubscribed)?.({ kind: Track.Kind.Audio, attach: () => element });
  await transport.setMuted(true);
  expect(room.localParticipant.setMicrophoneEnabled).toHaveBeenLastCalledWith(false);
  await transport.disconnect();
  expect(room.disconnect).toHaveBeenCalled();
  expect(element.remove).toHaveBeenCalled();
});

it("reports a remote disconnect", async () => {
  const callback = jest.fn();
  transport.setOnDisconnected(callback);
  await transport.connect({ url: "wss://media.example.test", token: "test-token" });
  handlers.get(RoomEvent.Disconnected)?.();
  expect(callback).toHaveBeenCalled();
});

it("cleans up a failed connection", async () => {
  room.connect.mockRejectedValueOnce(new Error("connection failed"));
  await expect(transport.connect({ url: "wss://media.example.test", token: "test-token" })).rejects.toThrow("connection failed");
  expect(room.disconnect).toHaveBeenCalled();
});

it("keeps the room joined when autoplay fails and retries sound without reconnecting", async () => {
  room.startAudio.mockRejectedValueOnce(new Error("NotAllowedError"));
  const listener = jest.fn();
  const unsubscribe = transport.subscribeAudioBlocked?.(listener);
  await transport.connect({ url: "wss://media.example.test", token: "test-token" });
  expect(transport.getAudioBlocked?.()).toBe(true);
  expect(listener).toHaveBeenCalled();
  expect(room.disconnect).not.toHaveBeenCalled();
  const retry = transport.enableAudio?.();
  expect(room.startAudio).toHaveBeenCalledTimes(2);
  await retry;
  expect(transport.getAudioBlocked?.()).toBe(false);
  expect(room.connect).toHaveBeenCalledTimes(1);
  unsubscribe?.();
});

it("updates blocked audio from LiveKit events and resets it on disconnect", async () => {
  await transport.connect({ url: "wss://media.example.test", token: "test-token" });
  handlers.get(RoomEvent.AudioPlaybackStatusChanged)?.(false);
  expect(transport.getAudioBlocked?.()).toBe(true);
  handlers.get(RoomEvent.AudioPlaybackStatusChanged)?.(true);
  expect(transport.getAudioBlocked?.()).toBe(false);
  handlers.get(RoomEvent.AudioPlaybackStatusChanged)?.(false);
  await transport.disconnect();
  expect(transport.getAudioBlocked?.()).toBe(false);
});

it("is unavailable when the browser cannot request a microphone", async () => {
  Object.defineProperty(globalThis, "navigator", { configurable: true, value: {} });
  expect(transport.isAvailable()).toBe(false);
  await expect(transport.connect({ url: "wss://media.example.test", token: "test-token" })).rejects.toThrow("unavailable");
  expect(Room).not.toHaveBeenCalled();
});
