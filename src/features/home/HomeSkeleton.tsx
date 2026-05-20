import { View } from "react-native";

import { Card } from "@/components/Card";
import { Skeleton } from "@/components/Skeleton";
import { useTheme } from "@/theme/ThemeProvider";

/** Approximate layout of the Home screen while data loads. */
export function HomeSkeleton() {
  const theme = useTheme();
  return (
    <View style={{ gap: theme.spacing.lg }}>
      <View style={{ flexDirection: "row", gap: theme.spacing.md, alignItems: "center" }}>
        <Skeleton width={48} height={48} radius={24} />
        <View style={{ flex: 1, gap: theme.spacing.xs }}>
          <Skeleton width={120} height={12} />
          <Skeleton width={180} height={22} />
        </View>
      </View>

      <Card>
        <View style={{ gap: theme.spacing.sm }}>
          <Skeleton width={80} height={12} />
          <Skeleton width={140} height={32} />
          <Skeleton width={180} height={12} />
          <Skeleton height={8} radius={4} />
        </View>
      </Card>

      <Skeleton height={52} radius={theme.radii.md} />

      <View style={{ gap: theme.spacing.sm }}>
        <Skeleton width={120} height={18} />
        {[0, 1, 2].map((i) => (
          <Card key={i}>
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                gap: theme.spacing.sm,
              }}
            >
              <View style={{ flex: 1, gap: theme.spacing.xs }}>
                <Skeleton width="60%" height={18} />
                <Skeleton width="40%" height={12} />
              </View>
              <Skeleton width={36} height={36} radius={18} />
            </View>
          </Card>
        ))}
      </View>
    </View>
  );
}
