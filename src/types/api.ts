// Domain types mirror docs/03-domain-model.md from the MOVA backend.
// Optional / nullable shapes reflect what the REST API actually returns.

export type Language = "uk" | "en";
export type UserRole = "user" | "admin";

export type User = {
  id: string;
  email: string;
  name: string;
  phoneNumber?: string | null;
  role: UserRole;
  isBlocked: boolean;
  blockedReason?: string | null;
  language: Language;
  preferredVoice?: string | null;
  preferredLlmProvider?: string | null;
  preferredLlmModel?: string | null;
  preferredTtsProvider?: string | null;
  preferredStyleId?: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
};

export type AuthTokens = {
  accessToken: string;
  refreshToken: string;
};

export type AuthResponse = AuthTokens & { user: User };

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

export type PlanCode = "free" | "paid";

export type Plan = {
  id: string;
  code: PlanCode;
  name: string;
  pricePerSecondCents: number;
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
};

export type ConversationStatus = "pending" | "active" | "ended" | "failed";

export type Conversation = {
  id: string;
  userId: string;
  templateId: string | null;
  targetPhone: string;
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

export type CallStartResponse = {
  conversationId: string;
  roomName: string;
  participantId: string;
  maxCallDurationSeconds: number;
};

export type TopupResponse = {
  paymentEventId: string;
  balanceCents: number;
  paymentUrl: string | null;
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
  // Bespoke fields on specific business errors
  secondsNeeded?: number;
  balanceCents?: number;
  secondsRemaining?: number;
  reasons?: string[];
};
