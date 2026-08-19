import { NextRequest, NextResponse } from "next/server";
import { getAuthUrl, peekOAuthState } from "@/lib/gmail/oauth";

// Starts the Gmail OAuth flow. The ONLY accepted input is the single-use
// token we texted to the account holder — deliberately not a phone number.
// A phone number is public knowledge, so accepting one here would let anyone
// begin a connect flow for someone else's account and end up with the wrong
// person's inbox bound to it.
export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("t");

  const user = token ? await peekOAuthState(token) : null;
  if (!user) {
    // Same response for missing, unknown, expired, and already-used tokens —
    // this endpoint must not reveal whether a token or account exists.
    return NextResponse.redirect(
      new URL("/auth/gmail/success?status=expired", request.url)
    );
  }

  // The token doubles as the OAuth state param: it's random, single-use, and
  // already bound server-side to exactly one account.
  return NextResponse.redirect(getAuthUrl(token as string));
}
