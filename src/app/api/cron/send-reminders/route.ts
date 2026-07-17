import { NextRequest, NextResponse } from "next/server";
import { processReminders } from "@/lib/reminders/scheduler";
import { isCronAuthorized } from "@/lib/cron-auth";

export async function GET(request: NextRequest) {
  if (!isCronAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const sent = await processReminders();

  return NextResponse.json({ remindersSent: sent });
}
