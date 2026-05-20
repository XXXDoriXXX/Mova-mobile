import type { ReactNode } from "react";
import { View, type ViewProps } from "react-native";

import { useTheme } from "@/theme/ThemeProvider";

type CardProps = ViewProps & {
  children: ReactNode;
  padded?: boolean;
};

export function Card({ children, padded = true, style, ...rest }: CardProps) {
  const theme = useTheme();
  return (
    <View
      {...rest}
      style={[
        {
          backgroundColor: theme.colors.surface,
          borderRadius: theme.radii.lg,
          padding: padded ? theme.spacing.lg : 0,
          borderWidth: 1,
          borderColor: theme.colors.border,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}
