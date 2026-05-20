import { useMemo, useState } from "react";
import { View } from "react-native";
import { useTranslation } from "react-i18next";

import { Card } from "@/components/Card";
import { Chip } from "@/components/Chip";
import { Row } from "@/components/Row";
import { Text } from "@/components/Text";
import { useTheme } from "@/theme/ThemeProvider";
import type { Template } from "@/types/api";

type Filter = "all" | "mine" | "system";

type Props = {
  items: Template[];
  onSelect: (template: Template) => void;
};

export function TemplatesList({ items, onSelect }: Props) {
  const { t } = useTranslation();
  const theme = useTheme();
  const [filter, setFilter] = useState<Filter>("all");

  const filtered = useMemo(() => {
    switch (filter) {
      case "mine":
        return items.filter((t) => !t.isSystem);
      case "system":
        return items.filter((t) => t.isSystem);
      default:
        return items;
    }
  }, [items, filter]);

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
          <Text variant="subtitle">{t("templates.emptyTitle")}</Text>
          <Text variant="caption" color="textMuted">
            {t("templates.emptyBody")}
          </Text>
        </Card>
      ) : (
        <View style={{ gap: theme.spacing.sm }}>
          {filtered.map((tpl) => {
            const badges: string[] = [];
            if (tpl.isSystem) badges.push(t("templates.badgeSystem"));
            if (tpl.isDefault) badges.push(t("templates.badgeDefault"));
            const subtitle = [
              ...badges,
              tpl.description.slice(0, 80),
            ]
              .filter(Boolean)
              .join(" · ");

            return (
              <Row
                key={tpl.id}
                title={tpl.name}
                subtitle={subtitle}
                onPress={() => onSelect(tpl)}
              />
            );
          })}
        </View>
      )}
    </View>
  );
}
