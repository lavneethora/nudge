import { NextRequest, NextResponse } from "next/server";
import { normalizeToE164 } from "@/lib/phone";
import { createAndSendOtp } from "@/lib/otp";
import { getProvider } from "@/lib/messaging";

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const { phoneNumber, smsConsent } = (body ?? {}) as Record<string, unknown>;

  if (typeof phoneNumber !== "string" || phoneNumber.length > 20) {
    return NextResponse.json(
      { error: "Phone number is required" },
      { status: 400 },
    );
  }

  // Must be a real boolean true — not just any truthy value, since this is
  // the consent artifact we record and would rely on in a TCPA dispute.
  if (smsConsent !== true) {
    return NextResponse.json(
      { error: "SMS consent is required" },
      { status: 400 },
    );
  }

  const norm = normalizeToE164(phoneNumber);
  if (!norm.ok) {
    return NextResponse.json({ error: norm.error }, { status: 400 });
  }

  const requestIp =
    request.headers.get("x-forwarded-for")?.split(",")[0].trim() ||
    request.headers.get("x-real-ip") ||
    null;

  const result = await createAndSendOtp(
    norm.e164,
    async (phone, code) => {
      await getProvider().send(
        phone,
        `hey! here's your code to get started with nudge: ${code}`,
      );
    },
    requestIp,
  );

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
