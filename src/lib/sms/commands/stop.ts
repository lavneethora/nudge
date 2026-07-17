import { db } from "@/lib/db/client";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import type { CommandContext } from "../router";

export async function handleStop(
  ctx: CommandContext,
  action: "pause" | "resume"
): Promise<string> {
  if (action === "pause") {
    await db
      .update(users)
      .set({ status: "paused", updatedAt: new Date().toISOString() })
      .where(eq(users.id, ctx.userId));
    return "Nudge: You have been unsubscribed and will not receive any more messages from Nudge. Reply START to resubscribe.";
  }

  await db
    .update(users)
    .set({ status: "active", updatedAt: new Date().toISOString() })
    .where(eq(users.id, ctx.userId));
  return "Nudge: You're resubscribed to trial reminders. Msg frequency varies. Msg&data rates may apply. Reply HELP for help, STOP to opt out.";
}
