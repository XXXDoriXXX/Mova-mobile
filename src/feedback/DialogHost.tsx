import { View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/Button";
import { Modal } from "@/components/Modal";
import { PressableScale } from "@/components/PressableScale";
import { Text } from "@/components/Text";
import { useTheme } from "@/theme/ThemeProvider";

import {
  useDialogStore,
  type ActionItem,
} from "./dialogStore";

export function DialogHost() {
  return (
    <>
      <ConfirmHost />
      <SheetHost />
    </>
  );
}

function ConfirmHost() {
  const { t } = useTranslation();
  const theme = useTheme();
  const req = useDialogStore((s) => s.confirm);
  const resolve = useDialogStore((s) => s.resolveConfirm);

  return (
    <Modal
      visible={!!req}
      onClose={() => resolve(false)}
      title={req?.title}
    >
      {req?.icon ? (
        <View
          style={{
            alignSelf: "center",
            width: 56,
            height: 56,
            borderRadius: 28,
            backgroundColor: req.destructive
              ? theme.colors.dangerSoft
              : theme.colors.surfaceMuted,
            alignItems: "center",
            justifyContent: "center",
            marginBottom: 4,
          }}
        >
          <Ionicons
            name={req.icon as keyof typeof Ionicons.glyphMap}
            size={26}
            color={req.destructive ? theme.colors.danger : theme.colors.text}
          />
        </View>
      ) : null}
      {req?.body ? (
        <Text variant="body" color="textMuted">
          {req.body}
        </Text>
      ) : null}
      <View style={{ flexDirection: "row", gap: theme.spacing.sm, marginTop: 8 }}>
        <View style={{ flex: 1 }}>
          <Button
            label={req?.cancelLabel ?? t("common.cancel")}
            variant="secondary"
            size="md"
            haptic="light"
            onPress={() => resolve(false)}
          />
        </View>
        <View style={{ flex: 1 }}>
          <Button
            label={req?.confirmLabel ?? t("common.save")}
            variant={req?.destructive ? "danger" : "primary"}
            size="md"
            onPress={() => resolve(true)}
          />
        </View>
      </View>
    </Modal>
  );
}

function SheetHost() {
  const { t } = useTranslation();
  const req = useDialogStore((s) => s.sheet);
  const resolve = useDialogStore((s) => s.resolveSheet);

  return (
    <Modal
      visible={!!req}
      onClose={() => resolve(null)}
      title={req?.title}
    >
      {req?.body ? (
        <Text variant="body" color="textMuted">
          {req.body}
        </Text>
      ) : null}
      <View style={{ gap: 8, marginTop: 4 }}>
        {(req?.actions ?? []).map((action) => (
          <ActionRow
            key={action.id}
            action={action}
            onPress={() => resolve(action.id)}
          />
        ))}
      </View>
      <View style={{ marginTop: 6 }}>
        <Button
          label={t("common.cancel")}
          variant="ghost"
          size="md"
          haptic="light"
          onPress={() => resolve(null)}
        />
      </View>
    </Modal>
  );
}

function ActionRow({
  action,
  onPress,
}: {
  action: ActionItem;
  onPress: () => void;
}) {
  const theme = useTheme();
  const tint = action.destructive ? theme.colors.danger : theme.colors.text;

  return (
    <PressableScale
      onPress={onPress}
      haptic={action.destructive ? "warning" : "light"}
      scaleTo={0.98}
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
        backgroundColor: theme.colors.surface,
        borderRadius: theme.radii.xl,
        borderWidth: 1,
        borderColor: theme.colors.border,
        paddingHorizontal: 16,
        paddingVertical: 14,
      }}
    >
      {action.icon ? (
        <View
          style={{
            width: 36,
            height: 36,
            borderRadius: 12,
            backgroundColor: action.destructive
              ? theme.colors.dangerSoft
              : theme.colors.surfaceMuted,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Ionicons
            name={action.icon as keyof typeof Ionicons.glyphMap}
            size={18}
            color={tint}
          />
        </View>
      ) : null}
      <Text variant="bodyLarge" weight="bold" style={{ flex: 1, color: tint }}>
        {action.label}
      </Text>
    </PressableScale>
  );
}
