import { useState } from "react";
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
import type { ClientCommand } from "@/realtime/protocol";
import { useCallStore } from "./callStore";

type Props = {
  visible: boolean;
  onClose: () => void;
  send: (cmd: ClientCommand) => void;
};

// Voice + LLM presets the user can switch through during the call. They map
// 1:1 to backend provider strings; kept small here because the LiveKit
// agents need each to exist on the worker side.
const VOICE_OPTIONS = ["alloy", "echo", "fable", "onyx", "nova", "shimmer"] as const;

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
  const [chosenLlm, setChosenLlm] = useState<{ provider: string; model: string } | null>(null);
  const [customProvider, setCustomProvider] = useState<ProviderId>("gemini");
  const [customModel, setCustomModel] = useState("");

  const stylesQuery = useQuery({
    queryKey: ["styles"],
    queryFn: listStyles,
    enabled: visible,
  });

  function handleStyle(styleId: string) {
    send({ type: "user.change_style", data: { styleId } });
  }

  function handleVoice(voice: string) {
    send({ type: "user.change_voice", data: { voice } });
  }

  function handleLlm(provider: string, model: string) {
    setChosenLlm({ provider, model });
    send({
      type: "user.change_model",
      data: { providerType: "llm", provider, model },
    });
  }

  function applyCustom() {
    const model = customModel.trim();
    if (!model) return;
    handleLlm(customProvider, model);
  }

  return (
    <Modal visible={visible} onClose={onClose} title={t("liveSettings.title")}>
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

        {/* Voice — applies next call */}
        <View style={{ gap: theme.spacing.sm }}>
          <Text variant="label">{t("liveSettings.voice")}</Text>
          <Text variant="caption" color="textMuted">
            {t("liveSettings.voiceHint")}
          </Text>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: theme.spacing.sm }}>
            {VOICE_OPTIONS.map((v) => (
              <Chip
                key={v}
                label={v}
                selected={activeVoice === v}
                onPress={() => handleVoice(v)}
              />
            ))}
          </View>
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
                  style={{
                    padding: theme.spacing.md,
                    borderRadius: theme.radii.md,
                    borderWidth: 1,
                    borderColor: selected
                      ? theme.colors.primary
                      : theme.colors.border,
                    backgroundColor: theme.colors.surface,
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                >
                  <Text variant="body">{opt.label}</Text>
                  {selected ? (
                    <Ionicons
                      name="checkmark"
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
            disabled={!customModel.trim()}
            onPress={applyCustom}
          />
        </View>

        <Banner tone="info" message={t("liveSettings.nextCallNote")} />
      </ScrollView>
    </Modal>
  );
}
