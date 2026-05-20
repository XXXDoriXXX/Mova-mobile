import { useState } from "react";
import { Alert, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/Button";
import { KeyboardScreen } from "@/components/KeyboardScreen";
import { Spinner } from "@/components/Spinner";
import { Text } from "@/components/Text";
import { useTheme } from "@/theme/ThemeProvider";
import { createStyle, deleteStyle, listStyles, updateStyle } from "@/api/styles";
import { StyleForm } from "@/features/styles/StyleForm";
import type { StyleFormValues } from "@/features/styles/schemas";

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
      router.back();
    },
  });

  const updateMut = useMutation({
    mutationFn: (vars: { id: string; values: StyleFormValues }) =>
      updateStyle(vars.id, vars.values),
    onSuccess: () => {
      invalidate();
      router.back();
    },
  });

  const [deleting, setDeleting] = useState(false);

  async function onSubmit(values: StyleFormValues) {
    if (isNew) {
      await createMut.mutateAsync(values);
    } else {
      await updateMut.mutateAsync({ id: id as string, values });
    }
  }

  function onDelete() {
    if (!initial) return;
    Alert.alert(t("styles.form.deleteConfirm"), undefined, [
      { text: t("common.cancel"), style: "cancel" },
      {
        text: t("common.delete"),
        style: "destructive",
        onPress: async () => {
          setDeleting(true);
          try {
            await deleteStyle(initial.id);
            invalidate();
            router.back();
          } finally {
            setDeleting(false);
          }
        },
      },
    ]);
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
      <Text variant="title">
        {isNew ? t("styles.newCta") : (initial?.name ?? "")}
      </Text>

      <StyleForm initial={initial} onSubmit={onSubmit} />

      {!isNew && initial ? (
        <View style={{ marginTop: theme.spacing.lg }}>
          <Button
            label={t("common.delete")}
            variant="danger"
            loading={deleting}
            onPress={onDelete}
          />
        </View>
      ) : null}
    </KeyboardScreen>
  );
}
