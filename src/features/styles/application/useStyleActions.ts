import { useState } from "react";
import { useRouter } from "expo-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";

import { createStyle, deleteStyle, updateStyle } from "@/api/styles";
import { confirm } from "@/feedback/dialogStore";
import { toast } from "@/feedback/toast";

import type { StyleFormValues } from "../schemas";

type Args = {
  styleId: string | null;
};

export function useStyleActions({ styleId }: Args) {
  const { t } = useTranslation();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [deleting, setDeleting] = useState(false);

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

  async function save(values: StyleFormValues) {
    try {
      if (!styleId) {
        await createMut.mutateAsync(values);
      } else {
        await updateMut.mutateAsync({ id: styleId, values });
      }
    } catch {
      // toast already fired by mutation onError
    }
  }

  async function remove() {
    if (!styleId) return;
    const ok = await confirm({
      title: t("styles.form.deleteConfirm"),
      confirmLabel: t("common.delete"),
      destructive: true,
      icon: "trash-outline",
    });
    if (!ok) return;
    setDeleting(true);
    try {
      await deleteStyle(styleId);
      invalidate();
      toast.success(t("styles.form.deleted"));
      router.back();
    } catch {
      toast.error(t("styles.form.saveError"));
    } finally {
      setDeleting(false);
    }
  }

  return {
    deleting,
    submitting: createMut.isPending || updateMut.isPending,
    save,
    remove,
  };
}
