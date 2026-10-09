import { Room, RoomEvent, Track } from "livekit-client";

import type { CallMediaTransport, ConnectOptions } from "./callMediaTransport";

class BrowserCallMediaTransport implements CallMediaTransport {
  private room: Room | null = null;
  private audioElements = new Set<HTMLMediaElement>();
  private onDisconnected: (() => void) | null = null;
  private audioBlocked = false;
  private audioListeners = new Set<() => void>();

  getAudioBlocked = (): boolean => this.audioBlocked;

  subscribeAudioBlocked = (listener: () => void): (() => void) => {
    this.audioListeners.add(listener);
    return () => this.audioListeners.delete(listener);
  };

  private setAudioBlocked(blocked: boolean): void {
    if (this.audioBlocked === blocked) return;
    this.audioBlocked = blocked;
    for (const listener of this.audioListeners) listener();
  }

  async enableAudio(): Promise<void> {
    const room = this.room;
    if (!room) return;
    try {
      // Invoke immediately so a button tap retains browser user activation.
      await room.startAudio();
      if (this.room === room) this.setAudioBlocked(false);
    } catch {
      if (this.room === room) this.setAudioBlocked(true);
    }
  }

  isAvailable(): boolean {
    return typeof navigator !== "undefined" &&
      typeof navigator.mediaDevices?.getUserMedia === "function";
  }

  setOnDisconnected(cb: (() => void) | null): void {
    this.onDisconnected = cb;
  }

  async connect(opts: ConnectOptions): Promise<void> {
    if (!this.isAvailable()) throw new Error("Media transport unavailable in this browser");
    const room = new Room();
    this.room = room;
    room.on(RoomEvent.AudioPlaybackStatusChanged, (playing) => {
      if (this.room === room) this.setAudioBlocked(!playing);
    });
    room.on(RoomEvent.Disconnected, () => this.onDisconnected?.());
    room.on(RoomEvent.TrackSubscribed, (track) => {
      if (track.kind !== Track.Kind.Audio) return;
      const element = track.attach();
      document.body.appendChild(element);
      this.audioElements.add(element);
    });
    room.on(RoomEvent.TrackUnsubscribed, (track) => {
      for (const element of track.detach()) {
        element.remove();
        this.audioElements.delete(element);
      }
    });
    try {
      await room.connect(opts.url, opts.token);
      await room.localParticipant.setMicrophoneEnabled(true);
    } catch (error) {
      await this.disconnect();
      throw error;
    }
    await this.enableAudio();
  }

  async setMuted(muted: boolean): Promise<void> {
    await this.room?.localParticipant.setMicrophoneEnabled(!muted);
  }

  async disconnect(): Promise<void> {
    this.onDisconnected = null;
    try {
      await this.room?.disconnect();
    } finally {
      this.room = null;
      this.setAudioBlocked(false);
      for (const element of this.audioElements) element.remove();
      this.audioElements.clear();
    }
  }
}

let singleton: CallMediaTransport | null = null;

export function getCallMediaTransport(): CallMediaTransport {
  if (!singleton) singleton = new BrowserCallMediaTransport();
  return singleton;
}
