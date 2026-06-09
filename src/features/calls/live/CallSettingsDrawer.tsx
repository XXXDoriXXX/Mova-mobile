import { useEffect, useMemo, useState } from "react";
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
import { listVoices, type VoiceOption, type VoiceProvider } from "@/api/voices";
import { patchMe } from "@/api/auth";
import { useAuthStore } from "@/auth/store";
import { toast } from "@/feedback/toast";
import { useCallStore } from "./callStore";
import type { CallControls } from "./application/useCallControls";

type Props = {
  visible: boolean;
  onClose: () => void;
  controls: CallControls;
};

export function CallSettingsDrawer({ visible, onClose, controls }: Props) {
  const { t } = useTranslation();
  const theme = useTheme();
  const activeStyleId = useCallStore((s) => s.activeStyleId);
  const activeVoice = useCallStore((s) => s.activeVoice);
  const activeTtsProvider = useCallStore((s) => s.activeTtsProvider);
  const autoMode = useCallStore((s) => s.autoMode);
  const setAutoModeStore = useCallStore((s) => s.setAutoMode);
  const userPreferredTtsProvider = useAuthStore(
    (s) => s.user?.preferredTtsProvider ?? null,
  );

  function handleToggleAuto(next: boolean) {
    setAutoModeStore(next);
    controls.setAutoMode(next);
  }

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
  // Group voices by provider so we can render labelled blocks. Within
  // each provider we sort by language so the UA voices float to the
  // top — this app is UA-first; multilingual voices come second
  // (still useful for UA), English-only voices last. Stable secondary
  // sort by label keeps the order predictable when prices/quality
  // are equivalent within a language bucket.
  const voicesByProvider = useMemo(() => {
    const rank: Record<string, number> = { "uk-UA": 0, multi: 1, "en-US": 2 };
    const map = new Map<VoiceProvider, VoiceOption[]>();
    for (const v of voicesQuery.data ?? []) {
      const arr = map.get(v.provider) ?? [];
      arr.push(v);
      map.set(v.provider, arr);
    }
    for (const list of map.values()) {
      list.sort((a, b) => {
        const ra = rank[a.language] ?? 99;
        const rb = rank[b.language] ?? 99;
        if (ra !== rb) return ra - rb;
        return a.label.localeCompare(b.label);
      });
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
    controls.changeStyle(styleId);
  }

  async function handleVoice(voice: VoiceOption) {
    controls.changeVoice(voice.id);
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

  return (
    <Modal
      visible={visible}
      onClose={onClose}
      title={t("liveSettings.title")}
      scrollable={false}
    >
      <ScrollView style={{ maxHeight: 540 }} contentContainerStyle={{ gap: theme.spacing.lg }}>
        {/* Auto-mode — single most important control on this screen.
            Flipping it OFF turns the call into "tap to speak" mode:
            every AI reply waits for the user's explicit Send tap. */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 12,
            padding: 12,
            borderRadius: theme.radii.xl,
            borderWidth: 1,
            borderColor: autoMode ? theme.colors.accent : theme.colors.border,
            backgroundColor: autoMode
              ? theme.colors.surface
              : theme.colors.surfaceMuted,
          }}
        >
          <View style={{ flex: 1, gap: 2 }}>
            <Text variant="label" weight="bold">
              {t("liveSettings.autoModeLabel")}
            </Text>
            <Text variant="caption" color="textMuted">
              {autoMode
                ? t("liveSettings.autoModeOnHint")
                : t("liveSettings.autoModeOffHint")}
            </Text>
          </View>
          <Pressable
            onPress={() => handleToggleAuto(!autoMode)}
            accessibilityRole="switch"
            accessibilityState={{ checked: autoMode }}
            hitSlop={8}
            style={{
              width: 48,
              height: 28,
              borderRadius: 14,
              backgroundColor: autoMode
                ? theme.colors.accent
                : theme.colors.surfaceMuted,
              borderWidth: autoMode ? 0 : 1,
              borderColor: theme.colors.border,
              padding: 3,
              justifyContent: "center",
              alignItems: autoMode ? "flex-end" : "flex-start",
            }}
          >
            <View
              style={{
                width: 22,
                height: 22,
                borderRadius: 11,
                backgroundColor: autoMode ? theme.colors.accentText : "#fff",
              }}
            />
          </Pressable>
        </View>

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
                  <VoiceChip
                    key={v.id}
                    voice={v}
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

        {/* LLM model + custom model pickers intentionally removed —
            agent-worker's ProviderRegistry now auto-picks the best
            healthy LLM per turn (Phase-9 health-based selection).
            Surfacing a manual override on the drawer was a footgun:
            users picked a model, the upstream went degraded, registry
            silently fell back to the next-best, and the drawer's
            "selected" indicator stayed wrong. Backend WS controls
            `user.change_model` are still wired for future hot-swap
            but mobile doesn't expose them. */}

        <Banner tone="info" message={t("liveSettings.nextCallNote")} />
      </ScrollView>
    </Modal>
  );
}

function VoiceChip({
  voice,
  selected,
  onPress,
}: {
  voice: VoiceOption;
  selected: boolean;
  onPress: () => void;
}) {
  const theme = useTheme();
  const iconName: keyof typeof Ionicons.glyphMap =
    voice.gender === 'female'
      ? 'person'
      : voice.gender === 'male'
        ? 'man'
        : 'mic-circle-outline';
  // When selected the chip flips to ink+light text; pick contrasting
  // icon / pill colours so they read against either background.
  const iconColor = selected ? theme.colors.primaryText : theme.colors.textMuted;
  const pillBg = selected ? 'rgba(255,255,255,0.18)' : theme.colors.surfaceMuted;
  const pillFg = selected ? theme.colors.primaryText : theme.colors.textMuted;
  const showLangPill = voice.language === 'uk-UA' || voice.language === 'en-US';
  const langLabel = voice.language === 'uk-UA' ? 'UA' : 'EN';
  return (
    <Chip
      label={voice.label}
      selected={selected}
      onPress={onPress}
      leading={<Ionicons name={iconName} size={14} color={iconColor} />}
      trailing={
        showLangPill ? (
          <View
            style={{
              paddingHorizontal: 6,
              paddingVertical: 1,
              borderRadius: 999,
              backgroundColor: pillBg,
            }}
          >
            <Text
              variant="label"
              style={{
                color: pillFg,
                fontSize: 9,
                letterSpacing: 0.6,
              }}
            >
              {langLabel}
            </Text>
          </View>
        ) : undefined
      }
    />
  );
}
