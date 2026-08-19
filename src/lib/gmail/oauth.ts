import { google } from "googleapis";
import { randomBytes } from "node:crypto";
import { db } from "@/lib/db/client";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { encrypt, decrypt } from "./crypto";

const SCOPES = ["https://www.googleapis.com/auth/gmail.readonly"];

// The connect token is minted when we text someone their Gmail link, so
// possession of it proves possession of that phone. It is the ONLY thing
// authorizing a connect — a phone number alone must never be enough, or
// anyone who knows your number could bind their inbox to your account.
//
// It rides in an SMS, so it needs to outlive "I'll do this tonight"; 24h with
// single use is the balance. An expired one is cheap to replace: text nudge
// again and a fresh link comes back.
const STATE_TTL_MS = 24 * 60 * 60 * 1000;

function getOAuth2Client() {
  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  );
}

export function getAuthUrl(state: string): string {
  const client = getOAuth2Client();
  return client.generateAuthUrl({
    access_type: "offline",
    scope: SCOPES,
    state,
    prompt: "consent",
  });
}

export async function exchangeCodeForTokens(code: string) {
  const client = getOAuth2Client();
  const { tokens } = await client.getToken(code);
  return tokens;
}

/** Mint a single-use CSRF nonce for this user and stash it on their row.
 * The nonce is the ONLY thing that travels in the OAuth `state` param — the
 * phone number never leaves the server, so a forged state can't select which
 * account the returned tokens get written to. */
export async function createOAuthState(userId: string): Promise<string> {
  const nonce = randomBytes(32).toString("base64url");
  await db
    .update(users)
    .set({
      oauthStateToken: `${nonce}.${Date.now()}`,
      updatedAt: new Date().toISOString(),
    })
    .where(eq(users.id, userId));
  return nonce;
}

/** Look up the account a connect token belongs to without spending it.
 * Used when the user first opens the link — the token still has to survive
 * the round trip through Google before the callback burns it. */
export async function peekOAuthState(nonce: string) {
  if (!nonce || typeof nonce !== "string") return null;

  const rows = await db.select().from(users);
  const match = rows.find((u) => u.oauthStateToken?.split(".")[0] === nonce);
  if (!match?.oauthStateToken) return null;

  const issuedAt = Number(match.oauthStateToken.split(".")[1]);
  if (!Number.isFinite(issuedAt) || Date.now() - issuedAt > STATE_TTL_MS) {
    return null;
  }
  return match;
}

/** Resolve a callback's state nonce back to its user, then burn it. Returns
 * null for unknown, malformed, or expired nonces — callers must not
 * distinguish those cases to the client. */
export async function consumeOAuthState(nonce: string) {
  const match = await peekOAuthState(nonce);

  // Burn on any lookup that found a row, expired or not — a spent token is
  // never retryable. peek() already rejected expired ones, so clear by nonce.
  if (!match) {
    const rows = await db.select().from(users);
    const stale = rows.find((u) => u.oauthStateToken?.split(".")[0] === nonce);
    if (stale) {
      await db
        .update(users)
        .set({ oauthStateToken: null, updatedAt: new Date().toISOString() })
        .where(eq(users.id, stale.id));
    }
    return null;
  }

  await db
    .update(users)
    .set({ oauthStateToken: null, updatedAt: new Date().toISOString() })
    .where(eq(users.id, match.id));

  return match;
}

/** Tell Google to invalidate the tokens, then drop them from our side.
 * Best-effort on the remote call: if Google rejects it (already revoked,
 * network blip) we still clear our copy, since the user asked us to forget. */
export async function revokeTokens(userId: string) {
  const rows = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  const user = rows[0];

  if (user?.gmailRefreshToken) {
    try {
      const client = getOAuth2Client();
      await client.revokeToken(decrypt(user.gmailRefreshToken));
    } catch (err) {
      console.error("Google token revocation failed (clearing locally):", err);
    }
  }

  await db
    .update(users)
    .set({
      gmailAccessToken: null,
      gmailRefreshToken: null,
      gmailTokenExpiry: null,
      oauthConnected: false,
      updatedAt: new Date().toISOString(),
    })
    .where(eq(users.id, userId));
}

export async function storeTokens(
  userId: string,
  tokens: { access_token?: string | null; refresh_token?: string | null; expiry_date?: number | null }
) {
  await db
    .update(users)
    .set({
      gmailAccessToken: tokens.access_token ? encrypt(tokens.access_token) : null,
      gmailRefreshToken: tokens.refresh_token ? encrypt(tokens.refresh_token) : null,
      gmailTokenExpiry: tokens.expiry_date ?? null,
      oauthConnected: true,
      updatedAt: new Date().toISOString(),
    })
    .where(eq(users.id, userId));
}

export async function getAuthenticatedClient(user: {
  id: string;
  gmailAccessToken: string | null;
  gmailRefreshToken: string | null;
  gmailTokenExpiry: number | null;
}) {
  if (!user.gmailAccessToken || !user.gmailRefreshToken) {
    throw new Error("User has no Gmail tokens");
  }

  const client = getOAuth2Client();
  client.setCredentials({
    access_token: decrypt(user.gmailAccessToken),
    refresh_token: decrypt(user.gmailRefreshToken),
    expiry_date: user.gmailTokenExpiry,
  });

  // Refresh if expired
  const now = Date.now();
  if (user.gmailTokenExpiry && user.gmailTokenExpiry < now) {
    const { credentials } = await client.refreshAccessToken();
    await storeTokens(user.id, credentials);
    client.setCredentials(credentials);
  }

  return client;
}
