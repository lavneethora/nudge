import { NextRequest, NextResponse } from "next/server";
import {
  getUserByPhone,
  createUser,
  logMessage,
  getMessageByProviderId,
  countRecentInbound,
} from "@/lib/db/queries";
import { routeMessage } from "@/lib/sms/router";
import { sendSMSToUser, getProvider } from "@/lib/messaging";
import { verifyTelnyxSignature } from "@/lib/messaging/telnyx-verify";

// A real person having a conversation sends nowhere near this many texts in
// ten minutes; anything past it is a loop, a bot, or someone griefing.
const MAX_INBOUND_PER_WINDOW = 15;
const INBOUND_WINDOW_MINUTES = 10;

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

  // Anyone can text our number, and every reply costs a message fee. Past a
  // sane conversational rate we keep logging inbound but stop replying, so a
  // flood can't run up the bill. Going quiet is the whole point — sending a
  // "slow down" notice would just be one more billable message to farm.
  //
  // STOP/START and HELP are exempt and ALWAYS answered: carriers mandate that
  // those keywords work every time, and throttling them would break 10DLC
  // compliance for the sake of a fraction of a cent.
  const isMandatoryKeyword =
    /^(stop|pause|quit|unsubscribe|cancel|end|start|resume|go|unstop|help|\?)$/i.test(
      text.trim()
    );

  if (!isMandatoryKeyword) {
    const windowStart = new Date(
      Date.now() - INBOUND_WINDOW_MINUTES * 60_000
    ).toISOString();
    const recent = await countRecentInbound(user.id, windowStart);
    if (recent > MAX_INBOUND_PER_WINDOW) {
      console.warn(
        `Throttled ${from}: ${recent} inbound in ${INBOUND_WINDOW_MINUTES}m`
      );
      return NextResponse.json({ ok: true, throttled: true });
    }
  }

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
