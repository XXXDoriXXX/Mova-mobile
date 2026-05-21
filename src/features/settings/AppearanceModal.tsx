import { View } from "react-native";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/Button";
import { Chip } from "@/components/Chip";
import { Modal } from "@/components/Modal";
import { Text } from "@/components/Text";
import { useTheme, useThemePreferences } from "@/theme/ThemeProvider";
import type { FontScale } from "@/theme/preferences";

type Props = { visible: boolean; onClose: () => void };

const SCALES: { value: FontScale; label: string }[] = [
  { value: 0.9, label: "A−" },
  { value: 1, label: "A" },
  { value: 1.15, label: "A+" },
  { value: 1.3, label: "A++" },
];

/**
 * Appearance sheet — used to be a theme-mode + font-scale picker. The mode
 * picker was removed when the app went single-light-theme; only the size
 * controls remain.
 */
export function AppearanceModal({ visible, onClose }: Props) {
  const { t } = useTranslation();
  const theme = useTheme();
  const { fontScale, setFontScale } = useThemePreferences();

  return (
    <Modal
      visible={visible}
      onClose={onClose}
      title={t("settings.appearance")}
    >
      <View style={{ gap: theme.spacing.lg }}>
        <View style={{ gap: theme.spacing.sm }}>
          <Text variant="label" color="textMuted">
            {t("settings.appearanceFontScale")}
          </Text>
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
