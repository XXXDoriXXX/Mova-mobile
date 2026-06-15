import { useEffect, useMemo } from "react";
import { View } from "react-native";
import { Stack, usePathname } from "expo-router";
import { I18nextProvider } from "react-i18next";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import * as SplashScreen from "expo-splash-screen";

import { AuthGate } from "@/auth/AuthGate";
import { useAuthStore } from "@/auth/store";
import "@/auth/refreshScheduler";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { OfflineBanner } from "@/components/OfflineBanner";
import { DialogHost } from "@/feedback/DialogHost";
import { ToastHost } from "@/feedback/toast";
import { QueryProvider } from "@/net/QueryProvider";
import { ThemeProvider } from "@/theme/ThemeProvider";
import { useAppFonts } from "@/theme/fonts";
import { initSentry, setUserContext } from "@/observability/sentry";
import { initTelemetry, setCurrentScreen } from "@/observability/telemetry";
import { installGlobalErrorHandlers } from "@/observability/errorHandlers";
import { ensureIncomingCallChannel } from "@/notifications/callChannel";
import { installNotificationHandler } from "@/notifications/notificationHandler";
import { registerBackgroundCallTask } from "@/notifications/backgroundCallTask";
import i18n, { initI18n } from "@/i18n";

SplashScreen.preventAutoHideAsync().catch(() => undefined);

export default function RootLayout() {
  const i18n = useMemo(() => initI18n(), []);
  const fontsLoaded = useAppFonts();
  const pathname = usePathname();

  useEffect(() => {
    initSentry();
    initTelemetry();
    installGlobalErrorHandlers();
    installNotificationHandler();
    void ensureIncomingCallChannel();
    void registerBackgroundCallTask();
  }, []);

  useEffect(() => {
    setCurrentScreen(pathname);
  }, [pathname]);

  useEffect(() => {
    if (fontsLoaded) {
      if (__DEV__) console.log("[mova/boot] tree mounted, hiding splash");
      SplashScreen.hideAsync().catch(() => undefined);
    }
  }, [fontsLoaded]);

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

  useEffect(() => {
    const apply = (lang: string | null | undefined) => {
      if (!lang) return;
      if (i18n.language === lang) return;
      void i18n.changeLanguage(lang);
    };
    apply(useAuthStore.getState().user?.language);
    const unsub = useAuthStore.subscribe((s) => apply(s.user?.language));
    return () => unsub();
  }, []);

  const handleSignOut = () => {
    void useAuthStore.getState().clear();
  };

  if (!fontsLoaded) return null;

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
                  <DialogHost />
                  <ToastHost />
                </View>
              </ThemeProvider>
            </I18nextProvider>
          </QueryProvider>
        </SafeAreaProvider>
      </GestureHandlerRootView>
    </ErrorBoundary>
  );
}
