import { useState } from "react";
import { View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";

import { Chip } from "@/components/Chip";
import { IconButton } from "@/components/IconButton";
import { KeyboardScreen } from "@/components/KeyboardScreen";
import { Spinner } from "@/components/Spinner";
import { Text } from "@/components/Text";
import { confirm } from "@/feedback/dialogStore";
import { toast } from "@/feedback/toast";
import { useTheme } from "@/theme/ThemeProvider";
import { createStyle, deleteStyle, listStyles, updateStyle } from "@/api/styles";
import { StyleForm } from "@/features/styles/StyleForm";
import type { StyleFormValues } from "@/features/styles/schemas";

/**
 * Style editor. Mirrors the template editor: header with a back arrow,
 * page title, form below, and a ghost "delete" affordance pinned at
 * the bottom for existing custom styles.
 */
export default function StyleEditScreen() {
  const { t } = useTranslation();
  const theme = useTheme();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { id } = useLocalSearchParams<{ id: string }>();
  const isNew = !id || id === "new";

  const stylesQuery = useQuery({
    queryKey: ["styles"],
    queryFn: listStyles,
    enabled: !isNew,
  });

  const initial = !isNew
    ? stylesQuery.data?.custom.find((s) => s.id === id)
    : undefined;

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: ["styles"] });

  const createMut = useMutation({
    mutationFn: createStyle,
    onSuccess: () => {
      invalidate();
      toast.success(t("styles.form.created"));
      router.back();
    },
    onError: () => toast.error(t("styles.form.saveError")),
  });

  const updateMut = useMutation({
    mutationFn: (vars: { id: string; values: StyleFormValues }) =>
      updateStyle(vars.id, vars.values),
    onSuccess: () => {
      invalidate();
      toast.success(t("styles.form.updated"));
      router.back();
    },
    onError: () => toast.error(t("styles.form.saveError")),
  });

  const [deleting, setDeleting] = useState(false);

  async function onSubmit(values: StyleFormValues) {
    if (isNew) {
      await createMut.mutateAsync(values);
    } else {
      await updateMut.mutateAsync({ id: id as string, values });
    }
  }

  async function onDelete() {
    if (!initial) return;
    const ok = await confirm({
      title: t("styles.form.deleteConfirm"),
      confirmLabel: t("common.delete"),
      destructive: true,
      icon: "trash-outline",
    });
    if (!ok) return;
    setDeleting(true);
    try {
      await deleteStyle(initial.id);
      invalidate();
      toast.success(t("styles.form.deleted"));
      router.back();
    } catch {
      toast.error(t("styles.form.saveError"));
    } finally {
      setDeleting(false);
    }
  }

  if (!isNew && stylesQuery.isLoading) {
    return (
      <KeyboardScreen>
        <Spinner />
      </KeyboardScreen>
    );
  }

  return (
    <KeyboardScreen>
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <IconButton onPress={() => router.back()} accessibilityLabel={t("common.back")}>
          <Ionicons name="chevron-back" size={20} color={theme.colors.text} />
        </IconButton>
      </View>

      <View style={{ gap: 4 }}>
        <Text variant="label" color="textMuted">
          {t("styles.title")}
        </Text>
        <Text variant="title">
          {isNew ? t("styles.newCta") : (initial?.name ?? "")}
        </Text>
      </View>

      <StyleForm initial={initial} onSubmit={onSubmit} />

      {!isNew && initial ? (
        <View
          style={{
            flexDirection: "row",
            marginTop: theme.spacing.md,
          }}
        >
          <Chip
            label={t("common.delete")}
            leading={
              <Ionicons name="trash-outline" size={14} color={theme.colors.danger} />
            }
            disabled={deleting}
            onPress={onDelete}
          />
        </View>
      ) : null}
    </KeyboardScreen>
  );
}
