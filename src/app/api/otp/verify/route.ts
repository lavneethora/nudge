import { NextRequest, NextResponse } from "next/server";
import { normalizeToE164 } from "@/lib/phone";
import { verifyOtp } from "@/lib/otp";
import {
  getUserByPhone,
  createUser,
  recordSmsConsent,
} from "@/lib/db/queries";

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const { phoneNumber, code } = (body ?? {}) as Record<string, unknown>;

  // Both must be strings — a number here would blow up createHash downstream
  if (typeof phoneNumber !== "string" || typeof code !== "string") {
    return NextResponse.json(
      { error: "Phone and code are required" },
      { status: 400 },
    );
  }

  if (phoneNumber.length > 20 || !/^\d{6}$/.test(code)) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const norm = normalizeToE164(phoneNumber);
  if (!norm.ok) {
    return NextResponse.json({ error: norm.error }, { status: 400 });
  }

  const result = await verifyOtp(norm.e164, code);

  if (!result.ok) {
    const statusMap = {
      not_found: { status: 404, msg: "No pending code found. Request a new one." },
      expired: { status: 410, msg: "Code expired. Request a new one." },
      max_attempts: { status: 429, msg: "Too many incorrect attempts. Request a new code." },
      invalid: {
        status: 400,
        msg: `Incorrect code. ${result.attemptsRemaining} attempt${result.attemptsRemaining === 1 ? "" : "s"} remaining.`,
      },
    } as const;
    const { status, msg } = statusMap[result.error];
    return NextResponse.json(
      { error: msg, code: result.error, attemptsRemaining: result.attemptsRemaining },
      { status },
    );
  }

  let user = await getUserByPhone(norm.e164);
  if (!user) {
    user = await createUser(norm.e164);
  }

  // Consent was asserted on the form and is only now provable — the code that
  // reached this phone confirms the person opting in controls the number.
  await recordSmsConsent(user.id);

  return NextResponse.json({
    success: true,
    phone: norm.e164,
    smsNumber: process.env.TELNYX_PHONE_NUMBER,
  });
}
