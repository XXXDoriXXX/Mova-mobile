import { View } from "react-native";
import { useTranslation } from "react-i18next";

import { Chip } from "@/components/Chip";
import { Text } from "@/components/Text";
import { useTheme } from "@/theme/ThemeProvider";
import type { StylesResponse } from "@/types/api";

type Props = {
  styles: StylesResponse;
  selectedId: string | null;
  onChange: (id: string | null) => void;
};

export function StylePicker({ styles, selectedId, onChange }: Props) {
  const { t } = useTranslation();
  const theme = useTheme();

  return (
    <View style={{ gap: theme.spacing.sm }}>
      <Text variant="label">{t("preCall.styleLabel")}</Text>
      <View
        style={{
          flexDirection: "row",
          flexWrap: "wrap",
          gap: theme.spacing.sm,
        }}
      >
        {styles.builtin.map((s) => (
          <Chip
            key={s.id}
            label={s.name}
            selected={selectedId === s.id}
            onPress={() => onChange(s.id)}
          />
        ))}
        {styles.custom.map((s) => (
          <Chip
            key={s.id}
            label={s.name}
            selected={selectedId === s.id}
            onPress={() => onChange(s.id)}
          />
        ))}
      </View>
    </View>
  );
}
