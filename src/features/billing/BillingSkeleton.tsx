import { View } from "react-native";

import { Card } from "@/components/Card";
import { Skeleton } from "@/components/Skeleton";
import { useTheme } from "@/theme/ThemeProvider";

export function BillingOverviewSkeleton() {
  const theme = useTheme();
  return (
    <View style={{ gap: theme.spacing.md }}>
      <Card>
        <View style={{ gap: theme.spacing.sm }}>
          <Skeleton width={80} height={12} />
          <Skeleton width={140} height={32} />
          <Skeleton width={180} height={12} />
        </View>
      </Card>
      <Card>
        <View style={{ gap: theme.spacing.xs }}>
          <Skeleton width={120} height={14} />
          <Skeleton width="80%" height={12} />
        </View>
      </Card>
    </View>
  );
}
