import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";

import { useTheme } from "@/theme/ThemeProvider";

export default function AppTabsLayout() {
  const theme = useTheme();
  const { t } = useTranslation();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.textMuted,
        tabBarStyle: {
          backgroundColor: theme.colors.background,
          borderTopColor: theme.colors.border,
        },
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: t("tabs.home"),
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home-outline" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          title: t("tabs.history"),
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="time-outline" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: t("tabs.settings"),
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person-outline" color={color} size={size} />
          ),
        }}
      />
      {/* Routes accessible via navigation but hidden from the tab bar */}
      <Tabs.Screen name="billing" options={{ href: null }} />
      <Tabs.Screen name="templates" options={{ href: null }} />
      <Tabs.Screen name="template/[id]" options={{ href: null }} />
      <Tabs.Screen name="styles" options={{ href: null }} />
      <Tabs.Screen name="style/[id]" options={{ href: null }} />
      <Tabs.Screen name="conversation/[id]" options={{ href: null }} />
      <Tabs.Screen name="call/pre" options={{ href: null }} />
      <Tabs.Screen name="call/live" options={{ href: null }} />
      <Tabs.Screen name="settings/style-profile" options={{ href: null }} />
    </Tabs>
  );
}
