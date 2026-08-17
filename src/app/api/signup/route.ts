import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json(
    { error: "This endpoint has been replaced by /api/otp/send and /api/otp/verify" },
    { status: 410 },
  );
}
