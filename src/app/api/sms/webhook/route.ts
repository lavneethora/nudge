import { NextRequest, NextResponse } from "next/server";
import {
  getUserByPhone,
  createUser,
  logMessage,
  getMessageByProviderId,
} from "@/lib/db/queries";
import { routeMessage } from "@/lib/sms/router";
import { sendSMSToUser, getProvider } from "@/lib/messaging";
import { verifyTelnyxSignature } from "@/lib/messaging/telnyx-verify";

type TelnyxWebhookEvent = {
  data?: {
    event_type?: string;
    payload?: {
      id?: string;
      text?: string;
      from?: { phone_number?: string };
    };
  };
};

export async function POST(request: NextRequest) {
  // Raw body must be read before parsing — the signature covers the exact bytes
  const rawBody = await request.text();

  if (getProvider().name === "telnyx") {
    const signature = request.headers.get("telnyx-signature-ed25519");
    const timestamp = request.headers.get("telnyx-timestamp");
    if (
      !signature ||
      !timestamp ||
      !verifyTelnyxSignature(rawBody, signature, timestamp)
    ) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }
  }

  let event: TelnyxWebhookEvent;
  try {
    event = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  // Ignore delivery receipts (message.sent, message.finalized, etc.)
  if (event.data?.event_type !== "message.received") {
    return NextResponse.json({ ok: true });
  }

  const payload = event.data.payload;
  const from = payload?.from?.phone_number;
  const text = payload?.text;
  const inboundId = payload?.id;

  if (!from || !text) {
    return NextResponse.json({ ok: true });
  }

  // Telnyx retries webhooks that don't get a 2xx within 2 seconds —
  // skip payloads we've already processed so retries never double-reply
  if (inboundId && (await getMessageByProviderId(inboundId))) {
    return NextResponse.json({ ok: true, duplicate: true });
  }

  let user = await getUserByPhone(from);
  if (!user) {
    user = await createUser(from);
  }

  await logMessage(user.id, "inbound", text, inboundId);

  const response = await routeMessage({
    userId: user.id,
    phoneNumber: from,
    body: text,
    oauthConnected: user.oauthConnected ?? false,
    onboardingState: (user.onboardingState ?? null) as
      | "awaiting_connect"
      | null,
    awaitingDateForSubId: user.awaitingDateForSubId ?? null,
    lastRemindedSubId: user.lastRemindedSubId ?? null,
  });

  await sendSMSToUser(user.id, from, response);

  return NextResponse.json({ ok: true });
}
