import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";

import { changePassword } from "@/api/auth";
import { toast } from "@/feedback/toast";

import {
  mapChangePasswordError,
  type ChangePasswordErrorKind,
} from "./mapChangePasswordError";

export type ChangePasswordResult =
  | { ok: true }
  | { ok: false; kind: ChangePasswordErrorKind };

export function useChangePassword() {
  const { t } = useTranslation();
  const [done, setDone] = useState(false);

  const mutation = useMutation({
    mutationFn: (vars: { current: string; next: string }) =>
      changePassword({
        currentPassword: vars.current,
        newPassword: vars.next,
      }),
  });

  async function execute(current: string, next: string): Promise<ChangePasswordResult> {
    try {
      await mutation.mutateAsync({ current, next });
      setDone(true);
      toast.success(t("settings.changePasswordSuccess"));
      return { ok: true };
    } catch (err) {
      return { ok: false, kind: mapChangePasswordError(err) };
    }
  }

  function reset() {
    setDone(false);
  }

  return { submitting: mutation.isPending, done, execute, reset };
}
