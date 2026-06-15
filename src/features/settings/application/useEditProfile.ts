import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";

import { patchMe } from "@/api/auth";
import { extractErrorPayload } from "@/api/client";
import { useAuthStore } from "@/auth/store";
import { toast } from "@/feedback/toast";
import type { Language } from "@/types/api";

export type EditProfileInput = {
  name: string;
  language: Language;
  isDeafMute: boolean;
};

export type EditProfileResult =
  | { ok: true }
  | { ok: false; message: string };

export function useEditProfile() {
  const { t, i18n } = useTranslation();
  const queryClient = useQueryClient();
  const setUser = useAuthStore((s) => s.setUser);

  const mutation = useMutation({
    mutationFn: (input: EditProfileInput) =>
      patchMe({
        name: input.name,
        language: input.language,
        isDeafMute: input.isDeafMute,
      }),
  });

  async function execute(input: EditProfileInput): Promise<EditProfileResult> {
    try {
      const updated = await mutation.mutateAsync(input);
      setUser(updated);
      queryClient.invalidateQueries({ queryKey: ["me"] });
      if (updated.language !== i18n.language) {
        void i18n.changeLanguage(updated.language);
      }
      toast.success(t("settings.profileSaved"));
      return { ok: true };
    } catch (err) {
      const payload = extractErrorPayload(err);
      const message = Array.isArray(payload?.message)
        ? payload?.message.join(" ")
        : payload?.message;
      return { ok: false, message: message ?? t("auth.errorGeneric") };
    }
  }

  return { submitting: mutation.isPending, execute };
}
