import { useState } from "react";
import { useRouter } from "expo-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";

import {
  createTemplate,
  deleteTemplate,
  duplicateTemplate,
  setDefaultTemplate,
  updateTemplate,
} from "@/api/templates";
import { confirm } from "@/feedback/dialogStore";
import { toast } from "@/feedback/toast";

import type { TemplateFormValues } from "../schemas";
import { mapTemplateFormError } from "./mapTemplateFormError";

export type TemplateBusyAction = "duplicate" | "default" | "delete" | null;

type Args = {
  templateId: string | null;
};

export function useTemplateActions({ templateId }: Args) {
  const { t } = useTranslation();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [busy, setBusy] = useState<TemplateBusyAction>(null);

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: ["templates"] });

  const createMut = useMutation({
    mutationFn: createTemplate,
    onSuccess: () => {
      invalidate();
      toast.success(t("templates.form.created"));
      router.back();
    },
  });

  const updateMut = useMutation({
    mutationFn: (vars: { id: string; values: TemplateFormValues }) =>
      updateTemplate(vars.id, vars.values),
    onSuccess: () => {
      invalidate();
      toast.success(t("templates.form.updated"));
      router.back();
    },
  });

  async function save(values: TemplateFormValues) {
    try {
      if (!templateId) {
        await createMut.mutateAsync(values);
      } else {
        await updateMut.mutateAsync({ id: templateId, values });
      }
      return { ok: true as const };
    } catch (err) {
      const mapped = mapTemplateFormError(err);
      if (mapped.kind === "banner") toast.error(t("templates.form.saveError"));
      return { ok: false as const, error: mapped };
    }
  }

  async function duplicate() {
    if (!templateId) return;
    setBusy("duplicate");
    try {
      const dup = await duplicateTemplate(templateId);
      invalidate();
      toast.success(t("templates.form.duplicated"));
      router.replace(`/template/${dup.id}`);
    } catch {
      toast.error(t("templates.form.saveError"));
    } finally {
      setBusy(null);
    }
  }

  async function setAsDefault() {
    if (!templateId) return;
    setBusy("default");
    try {
      await setDefaultTemplate(templateId);
      invalidate();
      toast.success(t("templates.form.defaultSet"));
    } catch {
      toast.error(t("templates.form.saveError"));
    } finally {
      setBusy(null);
    }
  }

  async function remove() {
    if (!templateId) return;
    const ok = await confirm({
      title: t("templates.form.deleteConfirm"),
      confirmLabel: t("common.delete"),
      destructive: true,
      icon: "trash-outline",
    });
    if (!ok) return;
    setBusy("delete");
    try {
      await deleteTemplate(templateId);
      invalidate();
      toast.success(t("templates.form.deleted"));
      router.back();
    } finally {
      setBusy(null);
    }
  }

  return {
    busy,
    submitting: createMut.isPending || updateMut.isPending,
    save,
    duplicate,
    setAsDefault,
    remove,
  };
}
