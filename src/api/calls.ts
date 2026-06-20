import { apiClient } from "./client";
import type { CallStartResponse, PeerCallStartResponse } from "@/types/api";

export type StartCallInput = {
  targetPhone: string;
  templateId?: string;
  // Free-text purpose of the call. The agent voices it at the start of the call
  // ("Телефоную ось чому: …") and keeps it in its system prompt. Backend caps
  // it at 500 chars (start-call.dto.ts).
  callReason?: string;
  // Whether the agent voices its opening greeting (deaf+assistant disclosure).
  // Default true; set false for people who already know the caller (family).
  announceGreeting?: boolean;
  // Voice-quality tier: 'eco' (cheap standard, default) | 'real' | 'ultra'
  // (premium ElevenLabs, subscriber-only, billed at a higher seconds multiplier).
  voiceTier?: "eco" | "real" | "ultra";
};

export async function startCall(
  input: StartCallInput,
): Promise<CallStartResponse> {
  const { data } = await apiClient.post<CallStartResponse>(
    "/calls/start",
    input,
  );
  return data;
}

export type StartPeerCallInput = {
  calleeUserId: string;
  templateId?: string;
};

export async function startPeerCall(
  input: StartPeerCallInput,
): Promise<PeerCallStartResponse> {
  const { data } = await apiClient.post<PeerCallStartResponse>(
    "/calls/peer/start",
    input,
  );
  return data;
}

export async function answerPeerCall(conversationId: string): Promise<void> {
  await apiClient.post(`/calls/peer/${conversationId}/answer`);
}

export async function declinePeerCall(conversationId: string): Promise<void> {
  await apiClient.post(`/calls/peer/${conversationId}/decline`);
}

export async function cancelPeerCall(conversationId: string): Promise<void> {
  await apiClient.post(`/calls/peer/${conversationId}/cancel`);
}
