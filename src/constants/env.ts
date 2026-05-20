import Constants from "expo-constants";

type AppExtra = {
  apiUrl: string;
  wsUrl: string;
  sentryDsn?: string;
};

const extra = (Constants.expoConfig?.extra ?? {}) as Partial<AppExtra>;

/**
 * Try to pull the LAN IP of the dev machine from Metro's `hostUri`.
 *
 * In Expo Go on a real device, `localhost` resolves to the *phone*, not to
 * the developer's laptop. Metro tells the bundle which machine served it
 * via `expoConfig.hostUri` (newer) / `expoGoConfig.debuggerHost` (older) —
 * typically `192.168.X.Y:8081`. We take that IP and assume the backend
 * runs on the same machine on the standard ports. Tunnels (`exp+...`)
 * give us nothing usable, so we fall back to the env value.
 */
function inferDevLanHost(): string | null {
  const hostUri =
    Constants.expoConfig?.hostUri ??
    (Constants as unknown as { expoGoConfig?: { debuggerHost?: string } })
      .expoGoConfig?.debuggerHost ??
    null;
  if (!hostUri || typeof hostUri !== "string") return null;
  const host = hostUri.split(":")[0]?.trim();
  if (!host) return null;
  // Only accept a plain IPv4 — tunnel hosts (`exp+slug`, `*.exp.direct`)
  // wouldn't reach a localhost-bound backend either way.
  if (!/^[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+$/.test(host)) return null;
  return host;
}

/**
 * Returns the configured URL as-is when the developer has explicitly set
 * a non-localhost URL via `EXPO_PUBLIC_API_URL`. Otherwise, in dev, swaps
 * `localhost` for the Metro host IP so Expo Go on a real device reaches
 * the right machine. Production builds keep whatever is configured.
 */
function resolveDevUrl(
  envValue: string | undefined,
  fallback: string,
): string {
  const value = envValue ?? fallback;
  // Only rewrite the dev defaults — if the developer pinned a real domain
  // (e.g. https://api.mova.app/v1) we never touch it.
  const usesLocalhost =
    value.includes("//localhost") || value.includes("//127.0.0.1");
  if (!usesLocalhost) return value;
  if (!__DEV__) return value;
  const lan = inferDevLanHost();
  if (!lan) return value;
  return value
    .replace("//localhost", `//${lan}`)
    .replace("//127.0.0.1", `//${lan}`);
}

export const API_BASE_URL: string = resolveDevUrl(
  extra.apiUrl,
  "http://localhost:3000/v1",
);

export const WS_URL: string = resolveDevUrl(
  extra.wsUrl,
  "ws://localhost:3002",
);

export const SENTRY_DSN: string | undefined =
  extra.sentryDsn && extra.sentryDsn.length > 0 ? extra.sentryDsn : undefined;
