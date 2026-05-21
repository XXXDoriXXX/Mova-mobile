import { View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/Button";
import { Pill } from "@/components/Pill";
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

/**
 * Plan cards. The active plan paints itself ink-dark with the brand
 * "Поточний" pill; the other plan stays white with a single chip-sized
 * CTA. We deliberately don't render a full-width button per card —
 * that would make every card look like a tap target rather than a
 * comparison row.
 */
export function PlanPicker({ plans, currentCode, onPick, picking }: Props) {
  const { t } = useTranslation();
  const theme = useTheme();

  return (
    <View style={{ gap: theme.spacing.md }}>
      {plans.map((p) => {
        const isCurrent = p.code === currentCode;
        const price =
          p.code === "free"
            ? `${p.freeSecondsPerMonth} сек / міс`
            : `₴ ${formatCentsAsUah(p.pricePerSecondCents * 100)} / сек`;

        return (
          <View
            key={p.id}
            style={{
              backgroundColor: isCurrent
                ? theme.colors.surfaceInverse
                : theme.colors.surface,
              borderRadius: theme.radii.xxl,
              padding: theme.spacing.lg,
              borderWidth: isCurrent ? 0 : 1,
              borderColor: theme.colors.border,
              gap: 6,
            }}
          >
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 8,
              }}
            >
              <Text
                variant="subtitle"
                color={isCurrent ? "textOnInverse" : "text"}
              >
                {p.name}
              </Text>
              {isCurrent ? (
                <Pill label={t("billing.currentPlanBadge")} tone="accent" />
              ) : null}
            </View>
            <Text
              variant="caption"
              color={isCurrent ? "textOnInverse" : "textMuted"}
              style={isCurrent ? { opacity: 0.7 } : undefined}
            >
              {price}
            </Text>

            {!isCurrent ? (
              <View style={{ marginTop: 12, alignItems: "flex-start" }}>
                <Button
                  label={t("billing.switchPlan")}
                  variant="primary"
                  size="md"
                  fullWidth={false}
                  loading={picking === p.code}
                  leading={
                    <Ionicons
                      name="arrow-forward"
                      size={14}
                      color={theme.colors.primaryText}
                    />
                  }
                  onPress={() => onPick(p)}
                />
              </View>
            ) : null}
          </View>
        );
      })}
    </View>
  );
}
