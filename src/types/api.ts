
export type Language = "uk" | "en";
export type UserRole = "user" | "admin";

export type User = {
  id: string;
  email: string;
  emailVerified: boolean;
  name: string;
  username: string | null;
  role: UserRole;
  language: Language;
  preferredVoice: string | null;
  preferredVoiceGender: "female" | "male" | null;
  preferredLlmProvider: string | null;
  preferredLlmModel: string | null;
  preferredTtsProvider: string | null;
  preferredStyleId: string | null;
  isDeafMute: boolean;
  createdAt: string;
};

export type AuthTokens = {
  accessToken: string;
  refreshToken: string;
  refreshExpiresAt: string;
};

export type AuthResponse = {
  user: User;
  tokens: AuthTokens;
};

export type RefreshResponse = AuthTokens;

export type Template = {
  id: string;
  userId: string | null;
  name: string;
  description: string;
  systemPrompt: string;
  language: Language;
  defaultVoice?: string | null;
  defaultLlmProvider?: string | null;
  defaultLlmModel?: string | null;
  defaultTtsProvider?: string | null;
  defaultStyleId?: string | null;
  isDefault: boolean;
  isSystem: boolean;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
};

export type PlanCode = "free" | "paid" | "plus";

export type Plan = {
  id: string;
  code: PlanCode;
  name: string;
  pricePerSecondCents: number;
  monthlyPriceCents: number;
  premiumVoices: boolean;
  unlimitedPeerCalls: boolean;
  premiumModel: boolean;
  currency: "UAH";
  freeSecondsPerMonth: number;
  maxCallDurationSeconds: number;
  maxConcurrentCalls: number;
  isActive: boolean;
  createdAt: string;
};

export type BillingSummary = {
  plan: Plan;
  status: "active" | "suspended" | "cancelled";
  currentPeriodStart: string;
  currentPeriodEnd: string;
  freeSecondsUsed: number;
  freeSecondsRemaining: number;
  balanceCents: number;
  // True on a PLUS tier the user cancelled but still has until period end.
  cancelAtPeriodEnd: boolean;
};

export type ConversationStatus = "pending" | "active" | "ended" | "failed";

export type ConversationType = "sip_outbound" | "peer_inbound";

export type Conversation = {
  id: string;
  userId: string;
  templateId: string | null;
  callType: ConversationType;
  callerUserId: string | null;
  caller: { id: string; name: string } | null;
  targetPhone: string | null;
  livekitRoom: string;
  status: ConversationStatus;
  startedAt: string;
  connectedAt: string | null;
  endedAt: string | null;
  durationSeconds: number;
  endReason:
    | "user"
    | "interlocutor"
    | "balance"
    | "fatal_error"
    | "timeout"
    | "declined"
    | "admin"
    | null;
  errorCode: string | null;
  initialLlmProvider: string | null;
  initialTtsProvider: string | null;
  initialVoice: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
};

export type MessageRole = "interlocutor" | "ai" | "user_typed" | "system";

export type Message = {
  id: string;
  conversationId: string;
  role: MessageRole;
  content: string;
  ttsStatus: "completed" | "interrupted" | "failed" | null;
  source: "typed" | "suggestion" | null;
  llmProvider: string | null;
  llmModel: string | null;
  ttsProvider: string | null;
  ttsVoice: string | null;
  durationMs: number | null;
  createdAt: string;
};

export type Suggestion = {
  id: string;
  conversationId: string;
  parentMessageId: string;
  content: string;
  wasChosen: boolean;
  createdAt: string;
};

export type BuiltinStyleKey = "official" | "friendly" | "personal";

export type ConversationStyle =
  | {
      id: `builtin:${BuiltinStyleKey}`;
      kind: "builtin";
      key: BuiltinStyleKey;
      name: string;
      description: string;
      instructions: string | null;
    }
  | {
      id: `custom:${string}`;
      uuid: string;
      kind: "custom";
      name: string;
      instructions: string;
      createdAt: string;
      updatedAt: string;
    };

export type StylesResponse = {
  builtin: Extract<ConversationStyle, { kind: "builtin" }>[];
  custom: Extract<ConversationStyle, { kind: "custom" }>[];
};

export type UserStyleProfile = {
  summary: {
    sampleCount: number;
    totalChars: number;
    avgMessageLength: number;
    exemplars: { content: string; createdAt: string }[];
    lastUpdatedAt: string;
  } | null;
  policy: {
    minContentLength: number;
    exemplarCap: number;
    onlyTypedMessagesTrain: boolean;
  };
};

export type CursorPage<T> = {
  items: T[];
  nextCursor: string | null;
};

export type SearchMatch = {
  messageId: string;
  role: "interlocutor" | "ai" | "user_typed";
  snippet: string;
  createdAt: string;
};

export type SearchHit = {
  conversationId: string;
  status: ConversationStatus;
  startedAt: string;
  endedAt: string | null;
  durationSeconds: number;
  templateId: string | null;
  templateName: string | null;
  matches: SearchMatch[];
};

export type SearchResultPage = {
  items: SearchHit[];
  nextCursor: string | null;
};

export type CallStartResponse = {
  conversationId: string;
  roomName: string;
  participantId: string;
  maxCallDurationSeconds: number;
};

export type PeerCallStartResponse = {
  conversationId: string;
  roomName: string;
  livekitUrl: string;
  livekitToken: string;
};

export type PushPlatform = "ios" | "android";
export type PushTokenKind = "data" | "voip";

export type IncomingCall = {
  conversationId: string;
  roomName: string;
  caller: { id: string; name: string };
};

// A user as seen through the contacts surface (search result, accepted
// contact, or the sender of an incoming request).
export type ContactUser = {
  id: string;
  username: string | null;
  name: string;
  isDeafMute: boolean;
};

export type IncomingContactRequest = {
  requestId: string;
  from: ContactUser;
  createdAt: string;
};

export type ContactRequestStatus = "pending" | "accepted" | "declined";

export type TopupResponse = {
  paymentEventId: string;
  balanceCents: number;
  // Provider checkout URL the client opens; the balance is credited only after
  // the provider confirms (webhook / mock-pay page).
  paymentUrl: string;
  reused: boolean;
};

export type UsageRecord = {
  id: string;
  userId: string;
  conversationId: string;
  secondsBilled: number;
  costCents: number;
  source: "free" | "paid";
  recordedAt: string;
};

export type PaymentEvent = {
  id: string;
  userId: string;
  externalId: string;
  idempotencyKey: string | null;
  amountCents: number;
  currency: "UAH";
  status: "success" | "failed" | "refunded" | "pending";
  processedAt: string | null;
  createdAt: string;
};

export type ApiErrorPayload = {
  statusCode: number;
  message: string | string[];
  error?: string;
  // Domain error discriminator set by some endpoints (e.g. EMAIL_NOT_VERIFIED,
  // NOT_A_CONTACT). Present alongside `message` when the server throws a
  // structured error object.
  code?: string;
  secondsNeeded?: number;
  balanceCents?: number;
  secondsRemaining?: number;
  reasons?: string[];
};
