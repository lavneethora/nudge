import { google, gmail_v1 } from "googleapis";
import type { OAuth2Client } from "google-auth-library";

const SEARCH_QUERY =
  "subject:(trial OR subscription OR free trial OR billing OR renewal) newer_than:7d";
const MAX_EMAILS = 50;

export type RawEmail = {
  messageId: string;
  subject: string;
  from: string;
  body: string;
  date: string;
};

const SKIP_DOMAINS = [
  "noreply@medium.com",
  "newsletter@",
  "digest@",
  "weekly@",
  "news@",
];

function shouldSkip(from: string): boolean {
  return SKIP_DOMAINS.some((d) => from.toLowerCase().includes(d));
}

function extractText(
  payload: gmail_v1.Schema$MessagePart | undefined
): string {
  if (!payload) return "";

  if (payload.body?.data) {
    return Buffer.from(payload.body.data, "base64url").toString("utf-8");
  }

  if (payload.parts) {
    for (const part of payload.parts) {
      if (part.mimeType === "text/plain" && part.body?.data) {
        return Buffer.from(part.body.data, "base64url").toString("utf-8");
      }
    }
    for (const part of payload.parts) {
      const nested = extractText(part);
      if (nested) return nested;
    }
  }

  return "";
}

export async function scanEmails(
  auth: OAuth2Client,
  existingMessageIds: Set<string>
): Promise<RawEmail[]> {
  const gmail = google.gmail({ version: "v1", auth });

  const listResponse = await gmail.users.messages.list({
    userId: "me",
    q: SEARCH_QUERY,
    maxResults: MAX_EMAILS,
  });

  const messageIds = listResponse.data.messages ?? [];
  const emails: RawEmail[] = [];

  for (const msg of messageIds) {
    if (!msg.id || existingMessageIds.has(msg.id)) continue;

    const detail = await gmail.users.messages.get({
      userId: "me",
      id: msg.id,
      format: "full",
    });

    const headers = detail.data.payload?.headers ?? [];
    const subject =
      headers.find((h) => h.name?.toLowerCase() === "subject")?.value ?? "";
    const from =
      headers.find((h) => h.name?.toLowerCase() === "from")?.value ?? "";
    const date =
      headers.find((h) => h.name?.toLowerCase() === "date")?.value ?? "";

    if (shouldSkip(from)) continue;

    const body = extractText(detail.data.payload);
    if (!body) continue;

    emails.push({
      messageId: msg.id,
      subject,
      from,
      body: body.slice(0, 3000),
      date,
    });
  }

  return emails;
}
