import { apiClient } from "./client";

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
