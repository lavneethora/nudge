import { NextRequest, NextResponse } from "next/server";
import { normalizeToE164 } from "@/lib/phone";
import { createAndSendOtp } from "@/lib/otp";
import { getProvider } from "@/lib/messaging";

export async function POST(request: NextRequest) {
  const { phoneNumber, smsConsent } = await request.json();

  if (!phoneNumber || typeof phoneNumber !== "string") {
    return NextResponse.json(
      { error: "Phone number is required" },
      { status: 400 },
    );
  }

  if (!smsConsent) {
    return NextResponse.json(
      { error: "SMS consent is required" },
      { status: 400 },
    );
  }

  const norm = normalizeToE164(phoneNumber);
  if (!norm.ok) {
    return NextResponse.json({ error: norm.error }, { status: 400 });
  }

  const result = await createAndSendOtp(norm.e164, async (phone, code) => {
    await getProvider().send(
      phone,
      `hey! here's your code to get started with nudge: ${code}`,
    );
  });

  if (!result.ok) {
    if (result.error === "rate_limited") {
      return NextResponse.json(
        { error: "Too many attempts. Try again shortly.", retryAfter: result.retryAfterSeconds },
        { status: 429 },
      );
    }
    return NextResponse.json(
      { error: "Failed to send code" },
      { status: 500 },
    );
  }

  return NextResponse.json({ success: true, expiresAt: result.expiresAt });
}
