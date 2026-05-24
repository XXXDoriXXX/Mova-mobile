import { apiClient } from "./client";

/**
 * Server-curated TTS voice catalogue. The mobile drawer reads this on
 * open and filters by the user's currently-saved `preferredTtsProvider`,
 * so the picker only ever shows voices that actually work on the
 * user's selected provider. Switching to a voice from a different
 * provider auto-updates `preferredTtsProvider` too (PATCH /auth/me
 * sets both in one body).
 *
 * Why fetched, not hard-coded:
 *   - When backend adds a new Wavenet voice or rotates an ElevenLabs
 *     id we don't need to ship a mobile update.
 *   - Keeps a single source of truth for "what's playable" between
 *     the in-call drawer and any future profile-page voice picker.
 */
export type VoiceProvider = "openai" | "gemini" | "google" | "elevenlabs";
export type VoiceLanguage = "uk-UA" | "en-US" | "multi";
export type VoiceGender = "female" | "male" | "neutral";

export interface VoiceOption {
  id: string;
  provider: VoiceProvider;
  label: string;
  language: VoiceLanguage;
  gender?: VoiceGender;
}

export async function listVoices(): Promise<VoiceOption[]> {
  const { data } = await apiClient.get<{ items: VoiceOption[] }>("/voices");
  return data.items;
}
