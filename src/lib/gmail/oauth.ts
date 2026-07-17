import { google } from "googleapis";
import { db } from "@/lib/db/client";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { encrypt, decrypt } from "./crypto";

const SCOPES = ["https://www.googleapis.com/auth/gmail.readonly"];

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
