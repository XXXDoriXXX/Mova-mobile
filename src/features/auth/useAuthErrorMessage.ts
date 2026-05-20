import { useTranslation } from "react-i18next";

import type { ApiErrorPayload } from "@/types/api";
import { extractErrorPayload } from "@/api/client";

export type AuthErrorMapping = {
  emailError?: string;
  passwordError?: string;
  banner?: string;
};

function flattenMessage(message: string | string[] | undefined): string {
  if (!message) return "";
  return Array.isArray(message) ? message.join(" ") : message;
}

export function useAuthErrorMapper() {
  const { t } = useTranslation();

  return (error: unknown): AuthErrorMapping => {
    const payload: ApiErrorPayload | undefined = extractErrorPayload(error);

    if (!payload) {
      return { banner: t("common.offline") };
    }

    const code = payload.error;
    const status = payload.statusCode;

    if (status === 409) {
      return { emailError: t("auth.errorEmailTaken") };
    }
    if (status === 401) {
      return { banner: t("auth.errorInvalidCredentials") };
    }
    if (status === 403) {
      const reasonText = flattenMessage(payload.message);
      return {
        banner: reasonText
          ? `${t("auth.errorBlocked")}: ${reasonText}`
          : t("auth.errorBlocked"),
      };
    }
    if (status === 400 && (code === "WEAK_PASSWORD" || flattenMessage(payload.message).includes("Password"))) {
      return { passwordError: t("auth.errorWeakPassword") };
    }
    return { banner: t("auth.errorGeneric") };
  };
}
