import { reportError } from "./telemetry";
import { captureException } from "./sentry";

type ErrorUtilsLike = {
  getGlobalHandler?: () => (error: unknown, isFatal?: boolean) => void;
  setGlobalHandler: (
    handler: (error: unknown, isFatal?: boolean) => void,
  ) => void;
};

let installed = false;

export function installGlobalErrorHandlers(): void {
  if (installed) return;
  installed = true;

  const errorUtils = (
    globalThis as unknown as { ErrorUtils?: ErrorUtilsLike }
  ).ErrorUtils;
  if (errorUtils) {
    const previous = errorUtils.getGlobalHandler?.();
    errorUtils.setGlobalHandler((error: unknown, isFatal?: boolean) => {
      reportError(error, { fatal: Boolean(isFatal), context: { source: "global" } });
      captureException(error, { fatal: Boolean(isFatal), source: "global" });
      previous?.(error, isFatal);
    });
  }

  enableUnhandledRejectionTracking();
}

function enableUnhandledRejectionTracking(): void {
  try {
    const tracking =
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      require("promise/setimmediate/rejection-tracking") as {
        enable: (opts: {
          allRejections: boolean;
          onUnhandled: (id: number, error: unknown) => void;
          onHandled: () => void;
        }) => void;
      };
    tracking.enable({
      allRejections: true,
      onUnhandled: (_id, error) => {
        reportError(error, { context: { source: "unhandledRejection" } });
        captureException(error, { source: "unhandledRejection" });
      },
      onHandled: () => undefined,
    });
  } catch {
  }
}
