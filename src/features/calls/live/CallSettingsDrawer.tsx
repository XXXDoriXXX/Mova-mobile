import { useEffect, useMemo, useState } from "react";
import { Pressable, ScrollView, View } from "react-native";
import { useQuery } from "@tanstack/react-query";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";

import { Banner } from "@/components/Banner";
import { Button } from "@/components/Button";
import { Chip } from "@/components/Chip";
import { Modal } from "@/components/Modal";
import { Spinner } from "@/components/Spinner";
import { Text } from "@/components/Text";
import { TextField } from "@/components/TextField";
import { useTheme } from "@/theme/ThemeProvider";
import { listStyles } from "@/api/styles";
import { listVoices, type VoiceOption, type VoiceProvider } from "@/api/voices";
import { patchMe } from "@/api/auth";
import { useAuthStore } from "@/auth/store";
import { toast } from "@/feedback/toast";
import type { ClientCommand } from "@/realtime/protocol";
import { useCallStore } from "./callStore";

type Props = {
  visible: boolean;
  onClose: () => void;
  send: (cmd: ClientCommand) => void;
};

type LlmOption = { provider: string; model: string; label: string };

// Gemini ids tracked here are what's stable as of early 2026; the @ai-sdk/google
// client passes the model id straight through, so anything Google publishes
// later (e.g. a `gemini-3.x-…`) just works via the "Custom model" input below.
const LLM_OPTIONS: readonly LlmOption[] = [
  { provider: "openai", model: "gpt-4o-mini", label: "OpenAI · 4o-mini" },
  { provider: "openai", model: "gpt-4o", label: "OpenAI · 4o" },
  { provider: "gemini", model: "gemini-2.5-flash-lite", label: "Gemini · 2.5 Flash-Lite" },
  { provider: "gemini", model: "gemini-2.5-flash", label: "Gemini · 2.5 Flash" },
  { provider: "gemini", model: "gemini-2.5-pro", label: "Gemini · 2.5 Pro" },
  { provider: "anthropic", model: "claude-3-5-sonnet", label: "Anthropic · Sonnet" },
  { provider: "groq", model: "llama-3.1-70b-versatile", label: "Groq · Llama-70B" },
] as const;

const PROVIDERS_FOR_CUSTOM = ["openai", "gemini", "anthropic", "groq"] as const;
type ProviderId = (typeof PROVIDERS_FOR_CUSTOM)[number];

/**
 * Mid-call settings drawer. Exposes the three WS commands the backend
 * supports during an active call:
 *   - user.change_style   (immediate; next suggestion turn picks it up)
 *   - user.change_voice   (effective on next call — server enforces)
 *   - user.change_model   (effective on next call — same caveat)
 *
 * The UI surfaces this distinction so users don't expect instant voice swap
 * mid-sentence.
 */
export function CallSettingsDrawer({ visible, onClose, send }: Props) {
  const { t } = useTranslation();
  const theme = useTheme();
  const activeStyleId = useCallStore((s) => s.activeStyleId);
  const activeVoice = useCallStore((s) => s.activeVoice);
  const activeTtsProvider = useCallStore((s) => s.activeTtsProvider);
  const userPreferredTtsProvider = useAuthStore(
    (s) => s.user?.preferredTtsProvider ?? null,
  );
  const [chosenLlm, setChosenLlm] = useState<{ provider: string; model: string } | null>(null);
  const [customProvider, setCustomProvider] = useState<ProviderId>("gemini");
  const [customModel, setCustomModel] = useState("");

  const stylesQuery = useQuery({
    queryKey: ["styles"],
    queryFn: listStyles,
    enabled: visible,
  });

  // Voice catalogue is server-curated (/v1/voices) so adding a Wavenet
  // variant or rotating an ElevenLabs id doesn't require a mobile ship.
  // 24h stale window is fine — the list changes infrequently.
  const voicesQuery = useQuery({
    queryKey: ["voices"],
    queryFn: listVoices,
    enabled: visible,
    staleTime: 24 * 60 * 60 * 1000,
  });
  // Group voices by provider so we can render labelled blocks. The
  // tab that opens first defaults to whichever provider the user
  // currently uses; falling back to the live-call provider, then
  // "google" as the cheap-and-good baseline.
  const voicesByProvider = useMemo(() => {
    const map = new Map<VoiceProvider, VoiceOption[]>();
    for (const v of voicesQuery.data ?? []) {
      const arr = map.get(v.provider) ?? [];
      arr.push(v);
      map.set(v.provider, arr);
    }
    return map;
  }, [voicesQuery.data]);
  const initialProvider: VoiceProvider =
    (userPreferredTtsProvider as VoiceProvider | null) ??
    (activeTtsProvider as VoiceProvider | null) ??
    "google";
  const [voiceProviderTab, setVoiceProviderTab] = useState<VoiceProvider>(initialProvider);
  // Sync the tab when the drawer reopens against a different active
  // provider (e.g. the agent fell back to OpenAI mid-call). Without
  // this the user opens the drawer and sees the previous tab's chips
  // selected as "the current voice" — confusing.
  useEffect(() => {
    if (visible) setVoiceProviderTab(initialProvider);
  }, [visible, initialProvider]);

  function handleStyle(styleId: string) {
    // Style is the one setting that takes effect mid-call — it only feeds
    // the suggestions generator, which picks it up on the next turn.
    send({ type: "user.change_style", data: { styleId } });
  }

  // Voice + LLM model bind at LiveKit AgentSession creation; mid-call
  // swap would tear down audio. We persist BOTH the voice id AND its
  // provider in one PATCH so the next call boots on a consistent
  // (provider, voice) pair — picking a Wavenet voice without also
  // setting preferredTtsProvider=google would resolve to the env
  // default's provider with an unsupported voice id and fail.
  async function handleVoice(voice: VoiceOption) {
    send({ type: "user.change_voice", data: { voice: voice.id } });
    try {
      const updated = await patchMe({
        preferredVoice: voice.id,
        preferredTtsProvider: voice.provider,
      });
      useAuthStore.getState().setUser(updated);
      toast.success(t("liveSettings.savedForNextCall"));
    } catch {
      toast.error(t("liveSettings.saveFailed"));
    }
  }

  async function handleLlm(provider: string, model: string) {
    setChosenLlm({ provider, model });
    send({
      type: "user.change_model",
      data: { providerType: "llm", provider, model },
    });
    try {
      const updated = await patchMe({
        preferredLlmProvider: provider,
        preferredLlmModel: model,
      });
      useAuthStore.getState().setUser(updated);
      toast.success(t("liveSettings.savedForNextCall"));
    } catch {
      toast.error(t("liveSettings.saveFailed"));
    }
  }

  function applyCustom() {
    const model = customModel.trim();
    if (!model) return;
    handleLlm(customProvider, model);
  }

  return (
    <Modal
      visible={visible}
      onClose={onClose}
      title={t("liveSettings.title")}
      scrollable={false}
    >
      <ScrollView style={{ maxHeight: 540 }} contentContainerStyle={{ gap: theme.spacing.lg }}>
        {/* Style — applies immediately */}
        <View style={{ gap: theme.spacing.sm }}>
          <Text variant="label">{t("liveSettings.style")}</Text>
          <Text variant="caption" color="textMuted">
            {t("liveSettings.styleHint")}
          </Text>
          {stylesQuery.isLoading || !stylesQuery.data ? (
            <Spinner size="small" />
          ) : (
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: theme.spacing.sm }}>
              {stylesQuery.data.builtin.map((s) => (
                <Chip
                  key={s.id}
                  label={s.name}
                  selected={activeStyleId === s.id}
                  onPress={() => handleStyle(s.id)}
                />
              ))}
              {stylesQuery.data.custom.map((s) => (
                <Chip
                  key={s.id}
                  label={s.name}
                  selected={activeStyleId === s.id}
                  onPress={() => handleStyle(s.id)}
                />
              ))}
            </View>
          )}
        </View>

        {/* Voice — applies next call.
            Two-tier picker: a row of provider tabs at the top
            (which TTS engine), then the chip grid of that engine's
            curated voices below. Tapping a chip persists both
            preferredVoice AND preferredTtsProvider in one PATCH. */}
        <View style={{ gap: theme.spacing.sm }}>
          <Text variant="label">{t("liveSettings.voice")}</Text>
          <Text variant="caption" color="textMuted">
            {t("liveSettings.voiceHint")}
          </Text>
          {voicesQuery.isLoading || !voicesQuery.data ? (
            <Spinner size="small" />
          ) : voicesByProvider.size === 0 ? (
            <Text variant="caption" color="textMuted">
              {t("liveSettings.voicesEmpty")}
            </Text>
          ) : (
            <>
              {/* Provider tabs. Only show providers that actually
                  returned at least one curated voice. */}
              <View
                style={{
                  flexDirection: "row",
                  flexWrap: "wrap",
                  gap: theme.spacing.xs,
                }}
              >
                {[...voicesByProvider.keys()].map((p) => (
                  <Chip
                    key={p}
                    label={p}
                    selected={voiceProviderTab === p}
                    onPress={() => setVoiceProviderTab(p)}
                  />
                ))}
              </View>
              <View
                style={{
                  flexDirection: "row",
                  flexWrap: "wrap",
                  gap: theme.spacing.sm,
                }}
              >
                {(voicesByProvider.get(voiceProviderTab) ?? []).map((v) => (
                  <Chip
                    key={v.id}
                    label={v.label}
                    selected={
                      activeVoice === v.id && activeTtsProvider === v.provider
                    }
                    onPress={() => handleVoice(v)}
                  />
                ))}
              </View>
            </>
          )}
        </View>

        {/* LLM model — applies next call */}
        <View style={{ gap: theme.spacing.sm }}>
          <Text variant="label">{t("liveSettings.model")}</Text>
          <Text variant="caption" color="textMuted">
            {t("liveSettings.modelHint")}
          </Text>
          <View style={{ gap: theme.spacing.xs }}>
            {LLM_OPTIONS.map((opt) => {
              const selected =
                chosenLlm?.provider === opt.provider &&
                chosenLlm?.model === opt.model;
              return (
                <Pressable
                  key={`${opt.provider}-${opt.model}`}
                  onPress={() => handleLlm(opt.provider, opt.model)}
                  style={({ pressed }) => ({
                    paddingHorizontal: 14,
                    paddingVertical: 12,
                    borderRadius: theme.radii.lg,
                    borderWidth: 1,
                    borderColor: selected
                      ? theme.colors.primary
                      : theme.colors.border,
                    backgroundColor: selected
                      ? theme.colors.surfaceMuted
                      : theme.colors.surface,
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "space-between",
                    opacity: pressed ? 0.85 : 1,
                  })}
                >
                  <Text variant="bodyLarge" weight={selected ? "bold" : "medium"}>
                    {opt.label}
                  </Text>
                  {selected ? (
                    <Ionicons
                      name="checkmark-circle"
                      size={20}
                      color={theme.colors.primary}
                    />
                  ) : null}
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* Custom model — pin any model id the backend accepts. Useful when
            a provider releases a new generation that doesn't have a preset
            in the list above. The string goes straight through to the
            provider SDK on the worker side. */}
        <View style={{ gap: theme.spacing.sm }}>
          <Text variant="label">{t("liveSettings.customModel")}</Text>
          <Text variant="caption" color="textMuted">
            {t("liveSettings.customModelHint")}
          </Text>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: theme.spacing.xs }}>
            {PROVIDERS_FOR_CUSTOM.map((p) => (
              <Chip
                key={p}
                label={p}
                selected={customProvider === p}
                onPress={() => setCustomProvider(p)}
              />
            ))}
          </View>
          <TextField
            placeholder={t("liveSettings.customModelPlaceholder")}
            value={customModel}
            onChangeText={setCustomModel}
            autoCapitalize="none"
            autoCorrect={false}
          />
          <Button
            label={t("liveSettings.customModelApply")}
            variant="secondary"
            size="md"
            disabled={!customModel.trim()}
            onPress={applyCustom}
          />
        </View>

        <Banner tone="info" message={t("liveSettings.nextCallNote")} />
      </ScrollView>
    </Modal>
  );
}
