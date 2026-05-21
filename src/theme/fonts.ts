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

/**
 * Loads every typeface the design system references. `useFonts` returns
 * `[loaded, error]`; we expose only `loaded` since errors render the
 * system-font fallback gracefully — better than a black screen.
 *
 * Kept in one hook (not split per family) so the splash screen only hides
 * once everything is ready, eliminating a font-swap flash on first paint.
 */
export function useAppFonts(): boolean {
  const [loaded] = useOnest({
    Onest_400Regular,
    Onest_500Medium,
    Onest_600SemiBold,
    Onest_700Bold,
    JetBrainsMono_500Medium,
    JetBrainsMono_600SemiBold,
  });
  return loaded;
}
