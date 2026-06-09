import { View } from "react-native";

import { Skeleton } from "@/components/Skeleton";
import { useTheme } from "@/theme/ThemeProvider";

export function BillingOverviewSkeleton() {
  const theme = useTheme();
  return (
    <View style={{ gap: theme.spacing.md }}>
      <Skeleton height={110} radius={theme.radii.xxl} />
      <Skeleton height={90} radius={theme.radii.xxl} />
    </View>
  );
}
