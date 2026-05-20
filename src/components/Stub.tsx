import { View } from "react-native";
import { useTranslation } from "react-i18next";

import { Screen } from "./Screen";
import { Text } from "./Text";
import { useTheme } from "@/theme/ThemeProvider";

type Props = {
  titleKey: string;
};

export function StubScreen({ titleKey }: Props) {
  const { t } = useTranslation();
  const theme = useTheme();
  return (
    <Screen>
      <View style={{ gap: theme.spacing.md, marginTop: theme.spacing.xl }}>
        <Text variant="title">{t(titleKey)}</Text>
        <Text variant="subtitle" color="textMuted">
          {t("stub.comingSoon")}
        </Text>
        <Text variant="body" color="textMuted">
          {t("stub.stubBody")}
        </Text>
      </View>
    </Screen>
  );
}
