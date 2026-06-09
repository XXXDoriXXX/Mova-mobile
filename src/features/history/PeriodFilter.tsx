import { ScrollView } from "react-native";
import { useTranslation } from "react-i18next";

import { Chip } from "@/components/Chip";

import type { PeriodKey } from "./application/period";

type Props = {
  value: PeriodKey;
  onChange: (next: PeriodKey) => void;
};

const PERIODS: ReadonlyArray<{ key: PeriodKey; i18n: string }> = [
  { key: "all", i18n: "history.search.periodAll" },
  { key: "today", i18n: "history.search.periodToday" },
  { key: "week", i18n: "history.search.periodWeek" },
  { key: "month", i18n: "history.search.periodMonth" },
];

export function PeriodFilter({ value, onChange }: Props) {
  const { t } = useTranslation();
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={{ flexGrow: 0 }}
      contentContainerStyle={{ gap: 8, paddingVertical: 4 }}
    >
      {PERIODS.map((p) => (
        <Chip
          key={p.key}
          label={t(p.i18n)}
          selected={value === p.key}
          onPress={() => onChange(p.key)}
        />
      ))}
    </ScrollView>
  );
}
