import { useEffect, useState } from "react";
import {
  useFonts as useOnest,
  Onest_400Regular,
  Onest_500Medium,
  Onest_600SemiBold,
  Onest_700Bold,
} from "@expo-google-fonts/onest";
import {
  JetBrainsMono_500Medium,
  JetBrainsMono_600SemiBold,
} from "@expo-google-fonts/jetbrains-mono";

const FONT_LOAD_TIMEOUT_MS = 3_000;

export function useAppFonts(): boolean {
  const [loaded, error] = useOnest({
    Onest_400Regular,
    Onest_500Medium,
    Onest_600SemiBold,
    Onest_700Bold,
    JetBrainsMono_500Medium,
    JetBrainsMono_600SemiBold,
  });
  const [timedOut, setTimedOut] = useState(false);

  useEffect(() => {
    const id = setTimeout(() => setTimedOut(true), FONT_LOAD_TIMEOUT_MS);
    return () => clearTimeout(id);
  }, []);

  const ready = loaded || error !== null || timedOut;

  useEffect(() => {
    if (!__DEV__) return;
    if (loaded) console.log("[mova/fonts] loaded");
    else if (error) console.warn("[mova/fonts] failed → system font:", error);
    else if (timedOut) console.warn("[mova/fonts] timed out → system font");
  }, [loaded, error, timedOut]);

  return ready;
}
