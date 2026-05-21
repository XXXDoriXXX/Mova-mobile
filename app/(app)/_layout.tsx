import { View } from "react-native";
import { Tabs } from "expo-router";
import { useTranslation } from "react-i18next";

import { TabBar } from "@/components/TabBar";
import { CallProgressBanner } from "@/features/calls/live/CallProgressBanner";

/**
 * Hosts the three primary destinations (home / history / settings) plus
 * every route that is reachable by navigation but should not appear in
 * the tab bar (`href: null`). The bar itself is the floating dark pill
 * defined in `src/components/TabBar.tsx`.
 *
 * Above the tab bar we also render `CallProgressBanner` — a floating
 * lime pill that surfaces when the user wandered off /call/live mid
 * call so the active session is one tap away.
 */
export default function AppTabsLayout() {
  const { t } = useTranslation();

  return (
    <View style={{ flex: 1 }}>
      <Tabs
        screenOptions={{ headerShown: false }}
        tabBar={(props) => <TabBar {...props} />}
      >
        <Tabs.Screen name="home" options={{ title: t("tabs.home") }} />
        <Tabs.Screen name="history" options={{ title: t("tabs.history") }} />
        <Tabs.Screen name="settings" options={{ title: t("tabs.settings") }} />

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
