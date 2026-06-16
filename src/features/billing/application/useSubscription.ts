import { useState } from "react";
import * as WebBrowser from "expo-web-browser";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { cancelSubscription, startSubscriptionCheckout } from "@/api/billing";
import { triggerHaptic } from "@/utils/haptics";

// Opens the MOVA Plus checkout in an in-app browser; the subscription activates
// server-side once the provider confirms, so we refetch the summary on return.
export function useStartSubscription() {
  const [submitting, setSubmitting] = useState(false);
  const [failed, setFailed] = useState(false);
  const queryClient = useQueryClient();

  async function start(): Promise<{ ok: boolean }> {
    setSubmitting(true);
    setFailed(false);
    try {
      const { checkoutUrl } = await startSubscriptionCheckout();
      await WebBrowser.openBrowserAsync(checkoutUrl);
      await queryClient.invalidateQueries({ queryKey: ["billing", "me"] });
      triggerHaptic("success");
      return { ok: true };
    } catch {
      triggerHaptic("error");
      setFailed(true);
      return { ok: false };
    } finally {
      setSubmitting(false);
    }
  }

  return { start, submitting, failed };
}

export function useCancelSubscription() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: cancelSubscription,
    onSuccess: (summary) => {
      queryClient.setQueryData(["billing", "me"], summary);
    },
  });
}
