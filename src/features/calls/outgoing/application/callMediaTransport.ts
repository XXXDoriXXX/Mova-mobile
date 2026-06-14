export type ConnectOptions = {
  url: string;
  token: string;
};

export interface CallMediaTransport {
  connect(opts: ConnectOptions): Promise<void>;
  disconnect(): Promise<void>;
  setMuted(muted: boolean): Promise<void>;
  setOnDisconnected(cb: (() => void) | null): void;
  isAvailable(): boolean;
}

type LiveKitModule = {
  Room: new () => LiveKitRoom;
  AudioSession: {
    startAudioSession: () => Promise<void>;
    stopAudioSession: () => Promise<void>;
  };
  registerGlobals: () => void;
};

type LiveKitRoom = {
  connect: (url: string, token: string) => Promise<void>;
  disconnect: () => Promise<void>;
  on: (event: string, cb: () => void) => void;
  localParticipant: {
    setMicrophoneEnabled: (enabled: boolean) => Promise<void>;
  };
};

function loadLiveKit(): LiveKitModule | null {
  try {

    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const mod = require("@livekit/react-native") as LiveKitModule;
    mod.registerGlobals();
    return mod;
  } catch {
    return null;
  }
}

class LiveKitTransport implements CallMediaTransport {
  private readonly lk: LiveKitModule | null;
  private room: LiveKitRoom | null = null;
  private onDisconnected: (() => void) | null = null;

  constructor() {
    this.lk = loadLiveKit();
  }

  isAvailable(): boolean {
    return this.lk !== null;
  }

  setOnDisconnected(cb: (() => void) | null): void {
    this.onDisconnected = cb;
  }

  async connect(opts: ConnectOptions): Promise<void> {
    if (!this.lk) throw new Error("Media transport unavailable in this build");
    await this.lk.AudioSession.startAudioSession();
    const room = new this.lk.Room();
    room.on("disconnected", () => {
      this.onDisconnected?.();
    });
    await room.connect(opts.url, opts.token);
    await room.localParticipant.setMicrophoneEnabled(true);
    this.room = room;
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
      await this.lk?.AudioSession.stopAudioSession().catch(() => undefined);
    }
  }
}

let singleton: CallMediaTransport | null = null;

export function getCallMediaTransport(): CallMediaTransport {
  if (!singleton) singleton = new LiveKitTransport();
  return singleton;
}
