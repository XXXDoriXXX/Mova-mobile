import { useCallback, useRef } from "react";

import { triggerHaptic } from "@/utils/haptics";

/**
 * Wraps a refetch / refresh callback so the first invocation of a
 * pull-to-refresh gesture fires a light haptic — the same tick iOS
 * uses for its native refresh control. Subsequent calls fire the
 * haptic only after the previous refresh has completed, so a
 * stuttering scroll doesn't buzz the wrist on every frame.
 */
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
