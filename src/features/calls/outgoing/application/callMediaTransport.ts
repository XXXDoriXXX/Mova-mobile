export type ConnectOptions = {
  url: string;
  token: string;
};

export interface CallMediaTransport {
  connect(opts: ConnectOptions): Promise<void>;
  disconnect(): Promise<void>;
  setMuted(muted: boolean): Promise<void>;
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
  localParticipant: {
    setMicrophoneEnabled: (enabled: boolean) => Promise<void>;
  };
};

function loadLiveKit(): LiveKitModule | null {
  try {
    // Optional native dependency, present only in a custom dev/standalone
    // build (`npx expo install @livekit/react-native @livekit/react-native-webrtc`).

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

  constructor() {
    this.lk = loadLiveKit();
  }

  isAvailable(): boolean {
    return this.lk !== null;
  }

  async connect(opts: ConnectOptions): Promise<void> {
    if (!this.lk) throw new Error("Media transport unavailable in this build");
    await this.lk.AudioSession.startAudioSession();
    const room = new this.lk.Room();
    await room.connect(opts.url, opts.token);
    await room.localParticipant.setMicrophoneEnabled(true);
    this.room = room;
  }

  async setMuted(muted: boolean): Promise<void> {
    await this.room?.localParticipant.setMicrophoneEnabled(!muted);
  }

  async disconnect(): Promise<void> {
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
