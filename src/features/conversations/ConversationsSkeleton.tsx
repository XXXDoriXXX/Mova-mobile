import { View } from "react-native";

import { Skeleton } from "@/components/Skeleton";
import { useTheme } from "@/theme/ThemeProvider";

type Props = { count?: number };

export function ConversationsSkeleton({ count = 6 }: Props) {
  const theme = useTheme();
  return (
    <View style={{ gap: theme.spacing.sm }}>
      {Array.from({ length: count }).map((_, i) => (
        <View
          key={i}
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 12,
            paddingHorizontal: 14,
            paddingVertical: 12,
            backgroundColor: theme.colors.surface,
            borderRadius: theme.radii.xl,
            borderWidth: 1,
            borderColor: theme.colors.border,
          }}
        >
          <Skeleton width={42} height={42} radius={21} />
          <View style={{ flex: 1, gap: 6 }}>
            <Skeleton width="55%" height={18} />
            <Skeleton width="35%" height={12} />
          </View>
          <Skeleton width={38} height={38} radius={19} />
        </View>
      ))}
    </View>
  );
}
