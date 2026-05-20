import { View } from "react-native";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { Text } from "@/components/Text";
import { useTheme } from "@/theme/ThemeProvider";
import { formatCentsAsUah } from "@/utils/format";
import type { Plan } from "@/types/api";

type Props = {
  plans: Plan[];
  currentCode: Plan["code"];
  onPick: (plan: Plan) => void;
  picking?: Plan["code"] | null;
};

export function PlanPicker({ plans, currentCode, onPick, picking }: Props) {
  const { t } = useTranslation();
  const theme = useTheme();

  return (
    <View style={{ gap: theme.spacing.md }}>
      {plans.map((p) => {
        const isCurrent = p.code === currentCode;
        return (
          <Card key={p.id}>
            <Text variant="subtitle">{p.name}</Text>
            <Text
              variant="caption"
              color="textMuted"
              style={{ marginTop: theme.spacing.xs }}
            >
              {p.code === "free"
                ? `${p.freeSecondsPerMonth} sec / month`
                : `₴ ${formatCentsAsUah(p.pricePerSecondCents * 100)} / sec`}
            </Text>
            <View style={{ marginTop: theme.spacing.md }}>
              <Button
                label={t("billing.switchPlan")}
                variant={isCurrent ? "ghost" : "primary"}
                disabled={isCurrent}
                loading={picking === p.code}
                onPress={() => onPick(p)}
              />
            </View>
          </Card>
        );
      })}
    </View>
  );
}
