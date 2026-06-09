import { View } from "react-native";

import { Skeleton } from "@/components/Skeleton";
import { useTheme } from "@/theme/ThemeProvider";

export function HomeSkeleton() {
  const theme = useTheme();
  return (
    <View style={{ gap: theme.spacing.lg, paddingTop: 4 }}>
      <View style={{ flexDirection: "row", gap: 10, alignItems: "center" }}>
        <Skeleton width={42} height={42} radius={21} />
        <View style={{ flex: 1, gap: 4 }}>
          <Skeleton width={100} height={12} />
          <Skeleton width={160} height={18} />
        </View>
        <Skeleton width={42} height={42} radius={21} />
      </View>

      <Skeleton width={170} height={28} radius={999} />

      <View style={{ gap: 6 }}>
        <Skeleton width="80%" height={50} radius={6} />
        <Skeleton width="62%" height={50} radius={6} />
      </View>

      <Skeleton height={100} radius={theme.radii.xxl} />

      <View style={{ flexDirection: "row", gap: 12 }}>
        <Skeleton height={200} radius={theme.radii.xxl} style={{ flex: 1 }} />
        <Skeleton height={200} radius={theme.radii.xxl} style={{ flex: 1 }} />
      </View>

      <View style={{ gap: theme.spacing.sm }}>
        <Skeleton width={140} height={22} />
        {[0, 1, 2].map((i) => (
          <Skeleton key={i} height={66} radius={theme.radii.xl} />
        ))}
      </View>
    </View>
  );
}
