const E164 = /^\+[1-9]\d{6,14}$/;

export function isE164(value: string): boolean {
  return E164.test(value.trim());
}

export function formatPhoneForDisplay(value: string): string {
  const trimmed = value.trim();
  if (!isE164(trimmed)) return trimmed;
  // Light-touch grouping for UA-style numbers; pure cosmetic.
  if (trimmed.startsWith("+380") && trimmed.length === 13) {
    return `+380 ${trimmed.slice(4, 6)} ${trimmed.slice(6, 9)} ${trimmed.slice(9, 11)} ${trimmed.slice(11)}`;
  }
  return trimmed;
}
