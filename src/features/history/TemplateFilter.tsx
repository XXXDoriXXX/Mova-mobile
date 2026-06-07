import { ScrollView } from "react-native";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";

import { Chip } from "@/components/Chip";
import { listTemplates } from "@/api/templates";

type Props = {
  value: string | null;
  onChange: (next: string | null) => void;
};

export function TemplateFilter({ value, onChange }: Props) {
  const { t } = useTranslation();
  const templates = useQuery({
    queryKey: ["templates"],
    queryFn: listTemplates,
    staleTime: 5 * 60_000,
  });

  const items = templates.data ?? [];
  if (items.length === 0) return null;

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={{ flexGrow: 0 }}
      contentContainerStyle={{ gap: 8, paddingVertical: 4 }}
    >
      <Chip
        label={t("history.search.templateAny")}
        selected={value === null}
        onPress={() => onChange(null)}
      />
      {items.map((tpl) => (
        <Chip
          key={tpl.id}
          label={tpl.name}
          selected={value === tpl.id}
          onPress={() => onChange(value === tpl.id ? null : tpl.id)}
        />
      ))}
    </ScrollView>
  );
}
