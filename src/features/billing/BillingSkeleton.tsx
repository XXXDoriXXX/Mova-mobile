import { View } from "react-native";

import { Skeleton } from "@/components/Skeleton";
import { useTheme } from "@/theme/ThemeProvider";

/**
 * Placeholders for the Billing → Overview tab. Two stacked surfaces: a
 * forest balance card and a white plan card. Matches the real layout so
 * the screen doesn't jump when data resolves.
 */
export function BillingOverviewSkeleton() {
  const theme = useTheme();
  return (
    <View style={{ gap: theme.spacing.md }}>
      <Skeleton height={110} radius={theme.radii.xxl} />
      <Skeleton height={90} radius={theme.radii.xxl} />
    </View>
  );
}
