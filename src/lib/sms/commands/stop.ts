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
    // brand + no-further-messages required by MNO — kept intact, just lowercased
    return "nudge: you're unsubscribed and won't get any more messages from nudge. text START if you change your mind.";
  }

  await db
    .update(users)
    .set({ status: "active", updatedAt: new Date().toISOString() })
    .where(eq(users.id, ctx.userId));
  return "nudge: you're back on! msg frequency varies, msg & data rates may apply. text HELP anytime or STOP to opt out.";
}
