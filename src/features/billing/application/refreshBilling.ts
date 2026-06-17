import type { QueryClient } from "@tanstack/react-query";

import type { BillingSummary } from "@/types/api";

export const BILLING_ME_KEY = ["billing", "me"] as const;

// Settlement (the provider webhook / mock-pay page) updates the server
// asynchronously, so a single refetch right after the checkout closes can race
// ahead of it and read the OLD state. Re-fetch a few times until the summary
// reflects the change (or we give up) — keeping the UI truthful.
export async function refreshBillingUntil(
  queryClient: QueryClient,
  isFresh: (summary: BillingSummary) => boolean,
  { attempts = 6, delayMs = 1200 }: { attempts?: number; delayMs?: number } = {},
): Promise<boolean> {
  for (let i = 0; i < attempts; i++) {
    await queryClient.invalidateQueries({ queryKey: BILLING_ME_KEY });
    const data = queryClient.getQueryData<BillingSummary>(BILLING_ME_KEY);
    if (data && isFresh(data)) return true;
    if (i < attempts - 1) {
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }
  return false;
}
