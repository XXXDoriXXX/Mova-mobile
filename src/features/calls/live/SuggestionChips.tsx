import { ScrollView } from "react-native";
import Animated, { FadeIn, FadeOut } from "react-native-reanimated";

import { Chip } from "@/components/Chip";
import { useTheme } from "@/theme/ThemeProvider";

import type { CallSuggestion } from "./callStore";

type Props = {
  items: CallSuggestion[];
  onPick: (s: CallSuggestion) => void;
};

export function SuggestionChips({ items, onPick }: Props) {
  const theme = useTheme();
  if (items.length === 0) return null;
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      // Keep the row at intrinsic chip height — otherwise the
      // horizontal scroller stretches vertically and the chips fill
      // it (alignItems: stretch defaults).
      style={{ flexGrow: 0 }}
      contentContainerStyle={{
        gap: 8,
        paddingHorizontal: theme.spacing.page,
        paddingVertical: 8,
      }}
    >
      {items.map((s, idx) => (
        <Animated.View
          key={s.id}
          // Stagger each chip so the row "ripples" in rather than popping
          // all three at once. 60ms apart matches a comfortable cadence.
          entering={FadeIn.duration(160).delay(idx * 60)}
          exiting={FadeOut.duration(120)}
        >
          <Chip label={s.content} onPress={() => onPick(s)} />
        </Animated.View>
      ))}
    </ScrollView>
  );
}
