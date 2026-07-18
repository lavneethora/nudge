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
    return `couldn't find a trial matching "${serviceName}". text "list" to see your active ones.`;
  }

  if (target.cancelUrl) {
    await db
      .update(subscriptions)
      .set({ status: "cancelled", updatedAt: new Date().toISOString() })
      .where(eq(subscriptions.id, target.id));

    return `here's your ${target.vendorName} cancel link:\n${target.cancelUrl}\n\nmarked as cancelled ✅`;
  }

  return `no cancel link on file for ${target.vendorName}. try googling "${target.vendorName} cancel subscription" or check their site directly.`;
}
