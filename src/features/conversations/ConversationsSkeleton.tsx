import { View } from "react-native";

import { Card } from "@/components/Card";
import { Skeleton } from "@/components/Skeleton";
import { useTheme } from "@/theme/ThemeProvider";

type Props = { count?: number };

/** Card-shaped placeholders matching the real ConversationsList rows. */
export function ConversationsSkeleton({ count = 6 }: Props) {
  const theme = useTheme();
  return (
    <View style={{ gap: theme.spacing.sm }}>
      {Array.from({ length: count }).map((_, i) => (
        <Card key={i} style={{ paddingVertical: theme.spacing.md }}>
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: theme.spacing.sm,
            }}
          >
            <View style={{ flex: 1, gap: theme.spacing.xs }}>
              <Skeleton width="55%" height={18} />
              <Skeleton width="35%" height={12} />
            </View>
            <Skeleton width={36} height={36} radius={18} />
            <Skeleton width={16} height={16} radius={8} />
          </View>
        </Card>
      ))}
    </View>
  );
}
