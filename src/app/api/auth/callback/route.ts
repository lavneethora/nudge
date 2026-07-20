import { NextRequest, NextResponse, after } from "next/server";
import { exchangeCodeForTokens, storeTokens } from "@/lib/gmail/oauth";
import { getUserByPhone } from "@/lib/db/queries";
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
    return NextResponse.json(
      { error: "Missing code or state" },
      { status: 400 }
    );
  }

  let phone: string;
  try {
    const decoded = JSON.parse(
      Buffer.from(state, "base64url").toString("utf-8")
    );
    phone = decoded.phone;
  } catch {
    return NextResponse.json({ error: "Invalid state" }, { status: 400 });
  }

  const user = await getUserByPhone(phone);
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  try {
    const tokens = await exchangeCodeForTokens(code);
    await storeTokens(user.id, tokens);

    await sendSMSToUser(
      user.id,
      phone,
      "all set ✅ gmail is connected — scanning your inbox for active trials now..."
    );

    // Follow-up bubble so users know they can also text me trials directly —
    // some services (looking at you crunchyroll) don't email a confirmation,
    // in which case i'd never catch it from email alone.
    await sendSMSToUser(
      user.id,
      phone,
      "btw — some services don't email a confirmation for trials. if that happens, just text me the trial name + end date and i've got you. like: add spotify aug 15"
    );

    // Trigger initial scan after the redirect response is sent
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    after(async () => {
      try {
        const res = await fetch(
          `${appUrl}/api/cron/scan-emails?userId=${user.id}&secret=${process.env.CRON_SECRET}`
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
