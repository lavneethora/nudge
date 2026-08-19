// Anything an LLM hands back here originated as untrusted text — an email
// body written by whoever emailed the user, or an inbound SMS. It then gets
// stored and texted to the user under Nudge's name, so it has to be bounded
// and shape-checked before it can become a message.

const MAX_VENDOR_LEN = 60;
const MAX_LINK_LEN = 200;

/** A cancel link is delivered to the user as an authoritative "cancel here"
 * URL, so a hostile one is a phishing payload wearing our credibility.
 * Accept only something shaped like a bare domain/path, or a plain-text
 * instruction (which contains spaces and therefore isn't clickable). */
export function sanitizeCancelLink(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const v = value.trim();
  if (!v || v.length > MAX_LINK_LEN) return null;
  // Newlines would let injected text pose as a separate message
  if (/[\r\n]/.test(v)) return null;

  // Plain-text instructions ("cancel via Settings > Subscriptions") are safe:
  // they contain spaces, so no client renders them as a link.
  if (/\s/.test(v)) return v;

  const withoutScheme = v.replace(/^https?:\/\//i, "");
  // Reject non-http schemes outright (javascript:, data:, sms:, tel:)
  if (/^[a-z][a-z0-9+.-]*:/i.test(v) && !/^https?:\/\//i.test(v)) return null;
  if (!/^[a-z0-9.-]+\.[a-z]{2,}(\/[^\s]*)?$/i.test(withoutScheme)) return null;
  // Bare IPs are never a legitimate vendor cancel page
  if (/^\d+\.\d+\.\d+\.\d+/.test(withoutScheme)) return null;
  // Credentials in the URL are a classic spoof ("netflix.com@evil.test")
  if (withoutScheme.includes("@")) return null;

  return v;
}

/** Vendor names are interpolated into reminder texts. Left unbounded, an
 * attacker-authored email could smuggle a whole instruction — a fake support
 * number, a second "message" after a newline — into a text the user trusts. */
export function sanitizeVendorName(value: unknown): string | null {
  if (typeof value !== "string") return null;

  let v = value
    // Collapse newlines/tabs so injected text can't pose as a second line
    .replace(/\s+/g, " ")
    // Strip anything phone-number-shaped. A real vendor name never contains
    // one, but "Netflix — call 1-800-555-0100 to keep your account" texted
    // from a number the user trusts is a ready-made vishing script.
    .replace(/\+?\d[\d\s().-]{6,}\d/g, "")
    .replace(/\s+/g, " ")
    .trim();

  if (!v) return null;
  if (v.length > MAX_VENDOR_LEN) v = v.slice(0, MAX_VENDOR_LEN).trim();
  return v || null;
}

/** Billing amounts render as "$X" in reminders. Reject nonsense so a bogus
 * figure can't be used to alarm someone. */
export function sanitizeBillingAmount(value: unknown): number | null {
  const n = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(n) || n <= 0 || n > 10_000) return null;
  return Math.round(n * 100) / 100;
}
