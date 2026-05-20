import { View } from "react-native";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/Button";
import { Chip } from "@/components/Chip";
import { Modal } from "@/components/Modal";
import { Text } from "@/components/Text";
import { useTheme, useThemePreferences } from "@/theme/ThemeProvider";
import type { FontScale, ThemeMode } from "@/theme/preferences";

type Props = { visible: boolean; onClose: () => void };

const MODES: { value: ThemeMode; key: string }[] = [
  { value: "system", key: "settings.appearanceModeSystem" },
  { value: "light", key: "settings.appearanceModeLight" },
  { value: "dark", key: "settings.appearanceModeDark" },
];

const SCALES: { value: FontScale; label: string }[] = [
  { value: 0.9, label: "A−" },
  { value: 1, label: "A" },
  { value: 1.15, label: "A+" },
  { value: 1.3, label: "A++" },
];

export function AppearanceModal({ visible, onClose }: Props) {
  const { t } = useTranslation();
  const theme = useTheme();
  const { mode, fontScale, setMode, setFontScale } = useThemePreferences();

  return (
    <Modal
      visible={visible}
      onClose={onClose}
      title={t("settings.appearance")}
    >
      <View style={{ gap: theme.spacing.lg }}>
        <View style={{ gap: theme.spacing.sm }}>
          <Text variant="label">{t("settings.appearanceMode")}</Text>
          <View style={{ flexDirection: "row", gap: theme.spacing.sm, flexWrap: "wrap" }}>
            {MODES.map((m) => (
              <Chip
                key={m.value}
                label={t(m.key)}
                selected={mode === m.value}
                onPress={() => setMode(m.value)}
              />
            ))}
          </View>
        </View>

        <View style={{ gap: theme.spacing.sm }}>
          <Text variant="label">{t("settings.appearanceFontScale")}</Text>
          <Text variant="caption" color="textMuted">
            {t("settings.appearanceFontScaleHint")}
          </Text>
          <View style={{ flexDirection: "row", gap: theme.spacing.sm }}>
            {SCALES.map((s) => (
              <Chip
                key={s.value}
                label={s.label}
                selected={fontScale === s.value}
                onPress={() => setFontScale(s.value)}
              />
            ))}
          </View>
        </View>

        <Button label={t("common.save")} onPress={onClose} />
      </View>
    </Modal>
  );
}
