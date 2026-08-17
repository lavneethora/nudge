import { NextRequest, NextResponse } from "next/server";
import { normalizeToE164 } from "@/lib/phone";
import { verifyOtp } from "@/lib/otp";
import { getUserByPhone, createUser } from "@/lib/db/queries";

export async function POST(request: NextRequest) {
  const { phoneNumber, code } = await request.json();

  if (!phoneNumber || !code) {
    return NextResponse.json(
      { error: "Phone and code are required" },
      { status: 400 },
    );
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

  return NextResponse.json({
    success: true,
    phone: norm.e164,
    smsNumber: process.env.TELNYX_PHONE_NUMBER,
  });
}
