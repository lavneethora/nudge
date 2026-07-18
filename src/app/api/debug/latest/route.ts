import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db/client";
import { subscriptions, messages, users } from "@/lib/db/schema";
import { desc } from "drizzle-orm";
import { isCronAuthorized } from "@/lib/cron-auth";

// GET /api/debug/latest — CRON_SECRET-authed inspection endpoint for
// figuring out what the scanner just found without SSH-ing into Turso.
// Returns the most recent subs + outbound SMS. Not shown in the UI anywhere.
export async function GET(request: NextRequest) {
  if (!isCronAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [subs, msgs, allUsers] = await Promise.all([
    db.select().from(subscriptions).orderBy(desc(subscriptions.createdAt)).limit(10),
    db.select().from(messages).orderBy(desc(messages.createdAt)).limit(20),
    db.select().from(users).limit(50),
  ]);

  return NextResponse.json({ subs, msgs, users: allUsers });
}
