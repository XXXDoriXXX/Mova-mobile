import { useCallback, useRef } from "react";

import { triggerHaptic } from "@/utils/haptics";

export function useRefreshHandler<T>(
  refetch: () => Promise<T>,
): () => Promise<T> {
  const inFlight = useRef(false);
  return useCallback(async () => {
    if (!inFlight.current) {
      triggerHaptic("light");
    }
    inFlight.current = true;
    try {
      return await refetch();
    } finally {
      inFlight.current = false;
    }
  }, [refetch]);
}
