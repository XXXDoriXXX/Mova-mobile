import { useEffect, useMemo, type ReactNode } from "react";
import NetInfo from "@react-native-community/netinfo";
import {
  QueryClient,
  QueryClientProvider,
  onlineManager,
} from "@tanstack/react-query";

export function QueryProvider({ children }: { children: ReactNode }) {
  const queryClient = useMemo(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            retry: (count, err) => {
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
