type JwtPayload = {
  exp?: number;
  iat?: number;
  sub?: string;
};

function base64UrlDecode(input: string): string {
  const padded = input.replace(/-/g, "+").replace(/_/g, "/");
  const pad = padded.length % 4;
  const normalized = pad === 0 ? padded : padded + "=".repeat(4 - pad);
  // React Native ships with global atob via core-js polyfills on Hermes.
  // Fallback to Buffer-style decode if unavailable.
  if (typeof globalThis.atob === "function") {
    return globalThis.atob(normalized);
  }
  throw new Error("atob is not available on this runtime");
}

export function decodeJwt(token: string): JwtPayload | null {
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  try {
    const payload = parts[1];
    if (!payload) return null;
    const json = base64UrlDecode(payload);
    return JSON.parse(json) as JwtPayload;
  } catch {
    return null;
  }
}

export function getAccessTokenExpiry(token: string): number | null {
  const payload = decodeJwt(token);
  if (!payload?.exp) return null;
  return payload.exp * 1000;
}

export function isExpiredSoon(token: string, leewayMs = 30_000): boolean {
  const expiry = getAccessTokenExpiry(token);
  if (expiry === null) return false;
  return Date.now() + leewayMs >= expiry;
}
