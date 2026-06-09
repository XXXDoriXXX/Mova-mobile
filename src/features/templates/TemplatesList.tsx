import { useMemo, useState } from "react";
import { View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";

import { Card } from "@/components/Card";
import { Chip } from "@/components/Chip";
import { Row } from "@/components/Row";
import { Text } from "@/components/Text";
import { useTheme } from "@/theme/ThemeProvider";
import type { Template } from "@/types/api";

import {
  describeTemplateSubtitle,
  filterTemplates,
  type TemplateFilter,
} from "./application/filterTemplates";

type Props = {
  items: Template[];
  onSelect: (template: Template) => void;
};

export function TemplatesList({ items, onSelect }: Props) {
  const { t } = useTranslation();
  const theme = useTheme();
  const [filter, setFilter] = useState<TemplateFilter>("all");

  const filtered = useMemo(() => filterTemplates(items, filter), [items, filter]);

  return (
    <View style={{ gap: theme.spacing.md }}>
      <View style={{ flexDirection: "row", gap: theme.spacing.sm }}>
        <Chip
          label={t("templates.filterAll")}
          selected={filter === "all"}
          onPress={() => setFilter("all")}
        />
        <Chip
          label={t("templates.filterMine")}
          selected={filter === "mine"}
          onPress={() => setFilter("mine")}
        />
        <Chip
          label={t("templates.filterSystem")}
          selected={filter === "system"}
          onPress={() => setFilter("system")}
        />
      </View>

      {filtered.length === 0 ? (
        <Card>
          <View
            style={{
              alignItems: "center",
              gap: theme.spacing.sm,
              paddingVertical: theme.spacing.md,
            }}
          >
            <Ionicons
              name="document-text-outline"
              size={36}
              color={theme.colors.textMuted}
            />
            <Text variant="subtitle" align="center">
              {t("templates.emptyTitle")}
            </Text>
            <Text variant="caption" color="textMuted" align="center">
              {t("templates.emptyBody")}
            </Text>
          </View>
        </Card>
      ) : (
        <View style={{ gap: theme.spacing.sm }}>
          {filtered.map((tpl) => (
            <Row
              key={tpl.id}
              title={tpl.name}
              subtitle={describeTemplateSubtitle(tpl, {
                system: t("templates.badgeSystem"),
                default: t("templates.badgeDefault"),
              })}
              onPress={() => onSelect(tpl)}
            />
          ))}
        </View>
      )}
    </View>
  );
}
