import type { useRouter } from "expo-router";

type AppRouter = ReturnType<typeof useRouter>;

/**
 * Leave a call screen safely.
 *
 * A call screen can BE the navigation root — an incoming call is opened straight
 * from a push / deep link, so there is nothing beneath it. Dispatching GO_BACK
 * (`router.back()`) there logs "The action 'GO_BACK' was not handled by any
 * navigator". Fall back to the home tab when the stack can't pop, so leaving is
 * always a valid navigation.
 *
 * Callers must still guard against invoking this more than once per screen (the
 * teardown path can run from both the hang-up handler and the server's status
 * echo) — otherwise a delayed second call would pop an unrelated screen.
 */
export function leaveCallScreen(router: AppRouter): void {
  if (router.canGoBack()) {
    router.back();
  } else {
    router.replace("/home");
  }
}
