import { NextRequest, NextResponse } from "next/server";
import { getAuthUrl } from "@/lib/gmail/oauth";

export async function GET(request: NextRequest) {
  const phone = request.nextUrl.searchParams.get("phone");
  if (!phone) {
    return NextResponse.json({ error: "Missing phone" }, { status: 400 });
  }

  // Use phone as the OAuth state for simplicity in MVP
  // In production, use a signed JWT
  const state = Buffer.from(JSON.stringify({ phone })).toString("base64url");
  const url = getAuthUrl(state);

  return NextResponse.redirect(url);
}
