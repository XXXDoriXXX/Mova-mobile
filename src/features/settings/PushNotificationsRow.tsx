import { useState } from "react";
import { useTranslation } from "react-i18next";

import { Row } from "@/components/Row";
import { Spinner } from "@/components/Spinner";
import { toast } from "@/feedback/toast";
import { enablePushNotifications } from "./application/enablePush";

export function PushNotificationsRow() {
  const { t } = useTranslation();
  const [busy, setBusy] = useState(false);
  const [state, setState] = useState<"idle" | "granted" | "denied" | "unsupported">(
    "idle",
  );

  async function handlePress() {
    setBusy(true);
    try {
      const outcome = await enablePushNotifications();
      setState(outcome === "error" ? "idle" : outcome);
      if (outcome === "granted") {
        toast.success(t("settings.pushSuccessBody"), t("settings.pushSuccessTitle"));
      } else if (outcome === "denied") {
        toast.warning(t("settings.pushDeniedBody"), t("settings.pushDeniedTitle"));
      } else if (outcome === "error") {
        toast.error(t("common.errorGeneric"), t("common.error"));
      } else {
        toast.info(t("settings.pushUnsupportedBody"), t("settings.pushUnsupportedTitle"));
      }
    } finally {
      setBusy(false);
    }
  }

  const subtitle =
    state === "granted"
      ? t("settings.pushSubtitleGranted")
      : state === "denied"
        ? t("settings.pushSubtitleDenied")
        : t("settings.pushSubtitleIdle");

  return (
    <Row
      iconName="notifications-outline"
      title={t("settings.push")}
      subtitle={subtitle}
      onPress={busy ? undefined : handlePress}
      trailing={busy ? <Spinner size="small" /> : undefined}
    />
  );
}
