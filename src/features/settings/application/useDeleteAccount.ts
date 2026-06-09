import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";

import { deleteAccount } from "@/api/auth";
import { extractErrorPayload } from "@/api/client";
import { useAuthStore } from "@/auth/store";
import { toast } from "@/feedback/toast";

export type DeleteAccountResult =
  | { ok: true }
  | { ok: false; kind: "wrongPassword" | "generic" };

export function useDeleteAccount() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const clear = useAuthStore((s) => s.clear);

  const mutation = useMutation({
    mutationFn: (password: string) => deleteAccount(password),
  });

  async function execute(password: string): Promise<DeleteAccountResult> {
    try {
      await mutation.mutateAsync(password);
      toast.success(t("settings.deleteAccountSuccess"));
      queryClient.clear();
      await clear();
      return { ok: true };
    } catch (err) {
      const payload = extractErrorPayload(err);
      const kind = payload?.statusCode === 401 ? "wrongPassword" : "generic";
      return { ok: false, kind };
    }
  }

  return { submitting: mutation.isPending, execute };
}
