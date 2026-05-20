import { useState } from "react";
import { Pressable, ScrollView, View } from "react-native";
import { useQuery } from "@tanstack/react-query";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";

import { Banner } from "@/components/Banner";
import { Chip } from "@/components/Chip";
import { Modal } from "@/components/Modal";
import { Spinner } from "@/components/Spinner";
import { Text } from "@/components/Text";
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

const LLM_OPTIONS = [
  { provider: "openai", model: "gpt-4o-mini", label: "OpenAI · 4o-mini" },
  { provider: "openai", model: "gpt-4o", label: "OpenAI · 4o" },
  { provider: "anthropic", model: "claude-3-5-sonnet", label: "Anthropic · Sonnet" },
  { provider: "groq", model: "llama-3.1-70b-versatile", label: "Groq · Llama-70B" },
] as const;

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

  return (
    <Modal visible={visible} onClose={onClose} title={t("liveSettings.title")}>
      <ScrollView style={{ maxHeight: 480 }} contentContainerStyle={{ gap: theme.spacing.lg }}>
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

        <Banner tone="info" message={t("liveSettings.nextCallNote")} />
      </ScrollView>
    </Modal>
  );
}
