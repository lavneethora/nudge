import { NextRequest, NextResponse } from "next/server";
import { getUserByPhone, createUser } from "@/lib/db/queries";

export async function POST(request: NextRequest) {
  const { phoneNumber } = await request.json();

  if (!phoneNumber || typeof phoneNumber !== "string") {
    return NextResponse.json(
      { error: "Phone number is required" },
      { status: 400 }
    );
  }

  // Consent is granted by submitting a phone number after reading the on-form
  // disclosure ("By providing your phone number, you agree to receive SMS…").
  // The checkbox is an additional, optional affirmation per Telnyx 10DLC guide.

  // Normalize to E.164
  const normalized = phoneNumber.replace(/\D/g, "");
  const e164 = normalized.startsWith("1")
    ? `+${normalized}`
    : `+1${normalized}`;

  if (e164.length < 11 || e164.length > 15) {
    return NextResponse.json(
      { error: "Invalid phone number" },
      { status: 400 }
    );
  }

  // Just create the user — no welcome SMS from here. The frontend redirects
  // the user to Messages with a pre-filled "so, what is nudge anyway??" text;
  // Nudge's first message will be the REPLY to that inbound (see sms/router).
  let user = await getUserByPhone(e164);
  if (!user) {
    user = await createUser(e164);
  }

  return NextResponse.json({
    success: true,
    phone: e164,
    smsNumber: process.env.TELNYX_PHONE_NUMBER,
  });
}
