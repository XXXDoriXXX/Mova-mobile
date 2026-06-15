import { View } from "react-native";
import { Tabs } from "expo-router";
import { useTranslation } from "react-i18next";

import { TabBar } from "@/components/TabBar";
import { CallProgressBanner, useCallSignaling } from "@/features/calls";

export default function AppTabsLayout() {
  const { t } = useTranslation();
  useCallSignaling();

  return (
    <View style={{ flex: 1 }}>
      <Tabs
        screenOptions={{ headerShown: false }}
        tabBar={(props) => <TabBar {...props} />}
      >
        <Tabs.Screen name="home" options={{ title: t("tabs.home") }} />
        <Tabs.Screen name="history" options={{ title: t("tabs.history") }} />
        <Tabs.Screen name="contacts" options={{ title: t("tabs.contacts") }} />
        <Tabs.Screen name="settings" options={{ title: t("tabs.settings") }} />

        <Tabs.Screen name="billing" options={{ href: null }} />
        <Tabs.Screen name="templates" options={{ href: null }} />
        <Tabs.Screen name="template/[id]" options={{ href: null }} />
        <Tabs.Screen name="styles" options={{ href: null }} />
        <Tabs.Screen name="style/[id]" options={{ href: null }} />
        <Tabs.Screen name="conversation/[id]" options={{ href: null }} />
        <Tabs.Screen
          name="call/pre"
          options={{ href: null, tabBarStyle: { display: "none" } }}
        />
        <Tabs.Screen
          name="call/live"
          options={{ href: null, tabBarStyle: { display: "none" } }}
        />
        <Tabs.Screen
          name="call/incoming"
          options={{ href: null, tabBarStyle: { display: "none" } }}
        />
        <Tabs.Screen
          name="call/outgoing"
          options={{ href: null, tabBarStyle: { display: "none" } }}
        />
        <Tabs.Screen name="settings/style-profile" options={{ href: null }} />
        <Tabs.Screen name="settings/about" options={{ href: null }} />
        <Tabs.Screen
          name="onboarding"
          options={{ href: null, tabBarStyle: { display: "none" } }}
        />
      </Tabs>
      <CallProgressBanner />
    </View>
  );
}
