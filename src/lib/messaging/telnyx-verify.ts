import { createPublicKey, verify } from "node:crypto";

// Telnyx publishes a raw 32-byte Ed25519 public key (base64). node:crypto
// needs it wrapped in a DER SPKI header to construct a KeyObject.
const ED25519_SPKI_PREFIX = Buffer.from("302a300506032b6570032100", "hex");

const MAX_TIMESTAMP_SKEW_SECONDS = 300;

export function verifyTelnyxSignature(
  rawBody: string,
  signatureBase64: string,
  timestamp: string
): boolean {
  const publicKeyBase64 = process.env.TELNYX_PUBLIC_KEY;
  if (!publicKeyBase64) return false;

  const ts = Number(timestamp);
  if (
    !Number.isFinite(ts) ||
    Math.abs(Date.now() / 1000 - ts) > MAX_TIMESTAMP_SKEW_SECONDS
  ) {
    return false;
  }

  try {
    const key = createPublicKey({
      key: Buffer.concat([
        ED25519_SPKI_PREFIX,
        Buffer.from(publicKeyBase64, "base64"),
      ]),
      format: "der",
      type: "spki",
    });
    return verify(
      null,
      Buffer.from(`${timestamp}|${rawBody}`),
      key,
      Buffer.from(signatureBase64, "base64")
    );
  } catch {
    return false;
  }
}
