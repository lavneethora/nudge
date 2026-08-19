import { NextRequest, NextResponse, after } from "next/server";
import {
  exchangeCodeForTokens,
  storeTokens,
  consumeOAuthState,
} from "@/lib/gmail/oauth";
import { sendSMSToUser } from "@/lib/messaging";

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  const state = request.nextUrl.searchParams.get("state");
  const error = request.nextUrl.searchParams.get("error");

  if (error) {
    return NextResponse.redirect(
      new URL("/auth/gmail/success?status=error", request.url)
    );
  }

  if (!code || !state) {
    return NextResponse.redirect(
      new URL("/auth/gmail/success?status=error", request.url)
    );
  }

  // The state nonce is what identifies the user — it was minted server-side
  // for exactly this flow and is burned on use. A forged or replayed state
  // resolves to nothing, so tokens can never land on someone else's row.
  // Every failure path below returns the SAME response, so this endpoint
  // can't be used to probe which phone numbers are registered.
  const user = await consumeOAuthState(state);
  if (!user) {
    return NextResponse.redirect(
      new URL("/auth/gmail/success?status=error", request.url)
    );
  }
  const phone = user.phoneNumber;

  try {
    const tokens = await exchangeCodeForTokens(code);
    await storeTokens(user.id, tokens);

    await sendSMSToUser(
      user.id,
      phone,
      // No emoji on purpose: a single non-GSM char forces UCS-2 encoding and
      // halves the chars-per-segment, so plain text lets us name both
      // data-rights commands in ONE segment instead of two.
      // This is also the moment revocation first becomes meaningful, and
      // Google's OAuth review expects users to be told how to revoke.
      "all set! gmail is connected. scanning your inbox for active trials now. text DISCONNECT anytime to cut off access, or DELETE to erase everything."
    );

    // Trigger initial scan after the redirect response is sent
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    after(async () => {
      // Follow-up bubble so users know they can also text me trials directly —
      // some services (looking at you crunchyroll) don't email a confirmation,
      // in which case i'd never catch it from email alone.
      //
      // Deliberately spaced from the "all set" message above. Two texts handed
      // to the carrier in the same instant can be delivered out of order, and
      // this one reads as a non-sequitur if it lands first. The pause also
      // makes the pair feel like someone typing rather than a dump.
      await new Promise((r) => setTimeout(r, 3000));
      try {
        await sendSMSToUser(
          user.id,
          phone,
          "btw some services don't email a confirmation for trials. if that happens, just text me the trial name + end date and i've got you. like: add spotify aug 15"
        );
      } catch (err) {
        console.error("Follow-up SMS failed:", err);
      }

      try {
        // Secret goes in a header, never the query string — query params end
        // up in Vercel access logs and any proxy in between.
        const res = await fetch(
          `${appUrl}/api/cron/scan-emails?userId=${encodeURIComponent(user.id)}`,
          { headers: { authorization: `Bearer ${process.env.CRON_SECRET}` } }
        );
        if (!res.ok) {
          console.error(
            `Initial email scan trigger failed: ${res.status} ${await res.text()}`
          );
        }
      } catch (err) {
        console.error("Initial email scan trigger failed:", err);
      }
    });

    return NextResponse.redirect(
      new URL("/auth/gmail/success?status=success", request.url)
    );
  } catch (err) {
    console.error("OAuth callback error:", err);
    return NextResponse.redirect(
      new URL("/auth/gmail/success?status=error", request.url)
    );
  }
}
