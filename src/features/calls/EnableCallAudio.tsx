import { View } from "react-native";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/Button";
import { useTheme } from "@/theme/ThemeProvider";
import { useBrowserAudio } from "./outgoing/application/useBrowserAudio";

export function EnableCallAudio() {
  const { t } = useTranslation();
  const theme = useTheme();
  const { blocked, enableAudio } = useBrowserAudio();
  if (!blocked) return null;
  return (
    <View style={{ padding: theme.spacing.md, width: "100%" }}>
      <Button label={t("live.enableAudio")} onPress={enableAudio} />
    </View>
  );
}
