import { getActiveSubscriptions } from "@/lib/db/queries";
import { db } from "@/lib/db/client";
import { subscriptions } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import type { CommandContext } from "../router";

export async function handleSnooze(
  ctx: CommandContext,
  serviceName: string
): Promise<string> {
  const subs = await getActiveSubscriptions(ctx.userId);
  const target = subs.find(
    (s) => s.vendorName.toLowerCase().includes(serviceName.trim().toLowerCase())
  );

  if (!target) {
    return `couldn't find a trial matching "${serviceName}". text "list" to see your active ones.`;
  }

  const snoozeUntil = new Date();
  snoozeUntil.setDate(snoozeUntil.getDate() + 1);

  await db
    .update(subscriptions)
    .set({
      snoozeUntil: snoozeUntil.toISOString(),
      updatedAt: new Date().toISOString(),
    })
    .where(eq(subscriptions.id, target.id));

  return `snoozed ${target.vendorName} reminders for 24 hours 💤`;
}
