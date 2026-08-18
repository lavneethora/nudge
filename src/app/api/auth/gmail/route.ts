import { NextRequest, NextResponse } from "next/server";
import { getAuthUrl, createOAuthState } from "@/lib/gmail/oauth";
import { getUserByPhone } from "@/lib/db/queries";
import { normalizeToE164 } from "@/lib/phone";

export async function GET(request: NextRequest) {
  const phone = request.nextUrl.searchParams.get("phone");
  if (!phone) {
    return NextResponse.json({ error: "Missing phone" }, { status: 400 });
  }

  const norm = normalizeToE164(phone);
  if (!norm.ok) {
    return NextResponse.json({ error: "Invalid phone" }, { status: 400 });
  }

  const user = await getUserByPhone(norm.e164);

  // Deliberately identical response whether or not the number is registered —
  // this endpoint is reachable by anyone, so it must not confirm who has an
  // account. Unknown numbers get the same generic failure page as a stale link.
  if (!user) {
    return NextResponse.redirect(
      new URL("/auth/gmail/success?status=error", request.url)
    );
  }

  // The state carries a single-use nonce only; the phone stays server-side.
  const state = await createOAuthState(user.id);
  return NextResponse.redirect(getAuthUrl(state));
}
