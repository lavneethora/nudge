export type NormalizeResult =
  | { ok: true; e164: string }
  | { ok: false; error: string };

export function normalizeToE164(phoneNumber: string): NormalizeResult {
  const digits = phoneNumber.replace(/\D/g, "");
  const e164 = digits.startsWith("1") ? `+${digits}` : `+1${digits}`;
  if (e164.length < 12 || e164.length > 16) {
    return { ok: false, error: "Invalid phone number" };
  }
  return { ok: true, e164 };
}
