import { getActiveSubscriptions } from "@/lib/db/queries";
import { db } from "@/lib/db/client";
import { subscriptions } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import type { CommandContext } from "../router";

export async function handleCancel(
  ctx: CommandContext,
  serviceName: string
): Promise<string> {
  const subs = await getActiveSubscriptions(ctx.userId);
  const target = subs.find(
    (s) => s.vendorName.toLowerCase().includes(serviceName.trim().toLowerCase())
  );

  if (!target) {
    return `I couldn't find a trial matching "${serviceName}". Text "list" to see your active trials.`;
  }

  if (target.cancelUrl) {
    await db
      .update(subscriptions)
      .set({ status: "cancelled", updatedAt: new Date().toISOString() })
      .where(eq(subscriptions.id, target.id));

    return `Here's your ${target.vendorName} cancellation link:\n${target.cancelUrl}\n\nI've marked it as cancelled.`;
  }

  return `I don't have a cancellation link for ${target.vendorName}. Try searching "${target.vendorName} cancel subscription" or check their website directly.`;
}
