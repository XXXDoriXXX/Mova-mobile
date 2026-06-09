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
 * runs on the same machine on the standard ports. Tunnels (`exp+…`,
 * `*.exp.direct`) don't give us a usable LAN IP — we surface that loudly
 * in the dev console so the developer can switch back to LAN mode.
 */
function inferDevLanHost(): { host: string; raw: string } | { host: null; raw: string | null } {
  const hostUri =
    Constants.expoConfig?.hostUri ??
    (Constants as unknown as { expoGoConfig?: { debuggerHost?: string } })
      .expoGoConfig?.debuggerHost ??
    null;
  if (!hostUri || typeof hostUri !== "string") return { host: null, raw: hostUri };
  const host = hostUri.split(":")[0]?.trim();
  if (!host || !/^[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+$/.test(host)) {
    return { host: null, raw: hostUri };
  }
  if (host === "127.0.0.1" || host === "0.0.0.0" || host.startsWith("169.254.")) {
    return { host: null, raw: hostUri };
  }
  return { host, raw: hostUri };
}

/**
 * Returns the configured URL as-is when the developer has explicitly set
 * a non-localhost URL via `EXPO_PUBLIC_API_URL`. Otherwise, in dev, swaps
 * `localhost` for the Metro host IP so Expo Go on a real device reaches
 * the right machine. Production builds keep whatever is configured.
 */
function resolveDevUrl(envValue: string | undefined, fallback: string): string {
  const value = envValue ?? fallback;
  const usesLocalhost =
    value.includes("//localhost") || value.includes("//127.0.0.1");
  if (!usesLocalhost) return value;
  if (!__DEV__) return value;
  const { host } = inferDevLanHost();
  if (!host) return value;
  return value
    .replace("//localhost", `//${host}`)
    .replace("//127.0.0.1", `//${host}`);
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

// ─── Dev-only visibility ──────────────────────────────────────────────────
// Surface the resolved URLs + Metro hostUri once on boot so it's obvious
// which machine the bundle is targeting. Massively cuts "Server unreachable"
// debugging time: if you see `localhost` here, Metro served the bundle in
// tunnel mode and the auto-detect couldn't extract a LAN IP — restart
// `expo start` without --tunnel.
if (__DEV__) {
  const probe = inferDevLanHost();
  const usingLocalhost = API_BASE_URL.includes("localhost") || API_BASE_URL.includes("127.0.0.1");
  const looksUnreachable =
    usingLocalhost ||
    (probe.raw?.startsWith("127.0.0.1") ?? false) ||
    (probe.raw?.startsWith("0.0.0.0") ?? false);

  console.log(
    "[mova/env] resolved URLs:",
    JSON.stringify(
      {
        API_BASE_URL,
        WS_URL,
        metroHostUri: probe.raw,
        detectedLanIp: probe.host,
        usingLocalhost,
      },
      null,
      2,
    ),
  );

  if (looksUnreachable) {
    console.warn(
      [
        "",
        "⚠️  [mova/env] API_BASE_URL points at loopback — requests from a real device will hang.",
        `   metroHostUri = ${probe.raw}`,
        "   Pick one:",
        "     a) Restart Metro on LAN:  `npx expo start --lan -c`",
        "     b) USB-tethered Android:  `adb reverse tcp:3000 tcp:3000 && adb reverse tcp:3002 tcp:3002`",
        "     c) Anywhere:              `npx expo start --tunnel`",
        "",
      ].join("\n"),
    );
  }
}
