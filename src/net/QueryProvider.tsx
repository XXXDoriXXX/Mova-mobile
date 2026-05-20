import { useEffect, useMemo, type ReactNode } from "react";
import NetInfo from "@react-native-community/netinfo";
import {
  QueryClient,
  QueryClientProvider,
  onlineManager,
} from "@tanstack/react-query";

/**
 * Wraps `QueryClientProvider` with a NetInfo bridge so TanStack pauses queries
 * while offline and refetches on reconnect. Centralized here so app/_layout
 * doesn't grow into a config farm.
 */
export function QueryProvider({ children }: { children: ReactNode }) {
  const queryClient = useMemo(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            retry: (count, err) => {
              // Don't keep retrying when the user is offline — let the
              // onReconnect refetch do its job once we're back online.
              if (!onlineManager.isOnline()) return false;
              return count < 2;
            },
            staleTime: 30_000,
            refetchOnWindowFocus: false,
            refetchOnReconnect: true,
            networkMode: "online",
          },
          mutations: { retry: 0, networkMode: "online" },
        },
      }),
    [],
  );

  useEffect(() => {
    return onlineManager.setEventListener((setOnline) => {
      const unsubscribe = NetInfo.addEventListener((ns) => {
        const connected = ns.isConnected;
        const reachable = ns.isInternetReachable;
        const online =
          reachable === null
            ? connected !== false
            : reachable && connected !== false;
        setOnline(online);
      });
      return () => unsubscribe();
    });
  }, []);

  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}
