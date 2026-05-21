import { Pressable, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import type { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Text } from "./Text";
import { useTheme } from "@/theme/ThemeProvider";

/**
 * Custom bottom tab bar — a floating dark pill that hosts three icon-only
 * destinations. Replaces the default RN tab bar so the brand silhouette
 * survives across iOS/Android instead of inheriting platform chrome.
 *
 * The icon for each route is picked by route name; adding a new tabbed
 * route only needs an entry in `ICONS`. Hidden routes (registered with
 * `href: null` in the tabs layout) never reach this component.
 */
const ICONS: Record<string, [keyof typeof Ionicons.glyphMap, keyof typeof Ionicons.glyphMap]> = {
  home: ["home", "home-outline"],
  history: ["time", "time-outline"],
  settings: ["person", "person-outline"],
};

export function TabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();

  const visible = state.routes
    .map((route, index) => ({ route, index }))
    .filter(({ route }) => ICONS[route.name] !== undefined);

  return (
    <View
      pointerEvents="box-none"
      style={{
        position: "absolute",
        bottom: insets.bottom + 12,
        left: 0,
        right: 0,
        alignItems: "center",
      }}
    >
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          gap: 4,
          paddingHorizontal: 8,
          paddingVertical: 8,
          backgroundColor: theme.colors.primary,
          borderRadius: theme.radii.pill,
          shadowColor: theme.colors.text,
          shadowOpacity: 0.18,
          shadowOffset: { width: 0, height: 8 },
          shadowRadius: 18,
          elevation: 6,
        }}
      >
        {visible.map(({ route, index }) => {
          const focused = state.index === index;
          const [activeIcon, idleIcon] = ICONS[route.name]!;
          const label =
            (descriptors[route.key]?.options.title as string | undefined) ??
            route.name;

          return (
            <Pressable
              key={route.key}
              accessibilityRole="button"
              accessibilityState={focused ? { selected: true } : {}}
              accessibilityLabel={label}
              onPress={() => {
                const event = navigation.emit({
                  type: "tabPress",
                  target: route.key,
                  canPreventDefault: true,
                });
                if (!focused && !event.defaultPrevented) {
                  navigation.navigate(route.name, route.params);
                }
              }}
              style={({ pressed }) => ({
                flexDirection: "row",
                alignItems: "center",
                gap: 6,
                paddingHorizontal: focused ? 16 : 14,
                paddingVertical: 10,
                borderRadius: 999,
                backgroundColor: focused ? theme.colors.accent : "transparent",
                opacity: pressed ? 0.85 : 1,
              })}
            >
              <Ionicons
                name={focused ? activeIcon : idleIcon}
                size={18}
                color={focused ? theme.colors.accentText : theme.colors.primaryText}
              />
              {focused ? (
                <Text variant="button" style={{ color: theme.colors.accentText }}>
                  {label}
                </Text>
              ) : null}
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
