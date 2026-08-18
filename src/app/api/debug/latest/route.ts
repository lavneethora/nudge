import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db/client";
import { subscriptions, messages, users, remindersSent } from "@/lib/db/schema";
import { desc, eq } from "drizzle-orm";
import { isCronAuthorized } from "@/lib/cron-auth";

// GET /api/debug/latest — local inspection endpoint for figuring out what the
// scanner just found without SSH-ing into Turso.
//
// Disabled in production: it returns every column of up to 50 user rows plus
// raw SMS bodies, which is a full PII dump behind a single shared secret.
// Use the Turso shell against prod instead.
function isDisabled() {
  return process.env.NODE_ENV === "production";
}

export async function GET(request: NextRequest) {
  if (isDisabled()) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
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

// DELETE /api/debug/latest?subId=<uuid> — nuke a bogus subscription
// (and its reminder-sent rows) so it stops showing up in `list` /
// re-triggering reminders. CRON_SECRET-authed.
export async function DELETE(request: NextRequest) {
  if (isDisabled()) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (!isCronAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const subId = request.nextUrl.searchParams.get("subId");
  if (!subId) {
    return NextResponse.json({ error: "Missing subId" }, { status: 400 });
  }
  await db.delete(remindersSent).where(eq(remindersSent.subscriptionId, subId));
  const rows = await db
    .delete(subscriptions)
    .where(eq(subscriptions.id, subId))
    .returning();
  return NextResponse.json({ deleted: rows.length, subId });
}
