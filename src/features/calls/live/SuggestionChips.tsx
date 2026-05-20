import { View } from "react-native";

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
    <View
      style={{
        flexDirection: "row",
        gap: theme.spacing.sm,
        flexWrap: "wrap",
        padding: theme.spacing.sm,
      }}
    >
      {items.map((s) => (
        <Chip key={s.id} label={s.content} onPress={() => onPick(s)} />
      ))}
    </View>
  );
}
