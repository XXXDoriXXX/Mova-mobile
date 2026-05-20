import { View } from "react-native";
import { useTranslation } from "react-i18next";

import { Chip } from "@/components/Chip";
import { Text } from "@/components/Text";
import { useTheme } from "@/theme/ThemeProvider";
import type { Template } from "@/types/api";

type Props = {
  templates: Template[];
  selectedId: string | null;
  onChange: (id: string | null) => void;
};

export function TemplatePicker({ templates, selectedId, onChange }: Props) {
  const { t } = useTranslation();
  const theme = useTheme();

  return (
    <View style={{ gap: theme.spacing.sm }}>
      <Text variant="label">{t("preCall.templateLabel")}</Text>
      <View
        style={{
          flexDirection: "row",
          flexWrap: "wrap",
          gap: theme.spacing.sm,
        }}
      >
        <Chip
          label={t("preCall.noTemplate")}
          selected={selectedId === null}
          onPress={() => onChange(null)}
        />
        {templates.map((tpl) => (
          <Chip
            key={tpl.id}
            label={tpl.name}
            selected={selectedId === tpl.id}
            onPress={() => onChange(tpl.id)}
          />
        ))}
      </View>
    </View>
  );
}
