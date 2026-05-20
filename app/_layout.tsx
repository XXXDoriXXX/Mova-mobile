import { useEffect, useMemo } from "react";
import { View } from "react-native";
import { Stack } from "expo-router";
import { I18nextProvider } from "react-i18next";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { GestureHandlerRootView } from "react-native-gesture-handler";

import { AuthGate } from "@/auth/AuthGate";
import { useAuthStore } from "@/auth/store";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { OfflineBanner } from "@/components/OfflineBanner";
import { QueryProvider } from "@/net/QueryProvider";
import { ThemeProvider } from "@/theme/ThemeProvider";
import { initSentry, setUserContext } from "@/observability/sentry";
import { initI18n } from "@/i18n";

export default function RootLayout() {
  const i18n = useMemo(() => initI18n(), []);

  useEffect(() => {
    initSentry();
  }, []);

  // Mirror auth user into Sentry context so captured exceptions are attributed.
  useEffect(() => {
    const unsub = useAuthStore.subscribe((s) => {
      if (s.user) {
        setUserContext({ id: s.user.id, email: s.user.email });
      } else {
        setUserContext(null);
      }
    });
    return () => unsub();
  }, []);

  const handleSignOut = () => {
    void useAuthStore.getState().clear();
  };

  return (
    <ErrorBoundary onSignOut={handleSignOut}>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <SafeAreaProvider>
          <QueryProvider>
            <I18nextProvider i18n={i18n}>
              <ThemeProvider>
                <View style={{ flex: 1 }}>
                  <OfflineBanner />
                  <AuthGate>
                    <Stack screenOptions={{ headerShown: false }} />
                  </AuthGate>
                </View>
              </ThemeProvider>
            </I18nextProvider>
          </QueryProvider>
        </SafeAreaProvider>
      </GestureHandlerRootView>
    </ErrorBoundary>
  );
}
