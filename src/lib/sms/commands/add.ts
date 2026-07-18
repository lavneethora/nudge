import { db } from "@/lib/db/client";
import { subscriptions } from "@/lib/db/schema";
import type { CommandContext } from "../router";

export async function handleAdd(
  ctx: CommandContext,
  serviceName: string,
  dateStr: string
): Promise<string> {
  const parsed = new Date(dateStr);
  if (isNaN(parsed.getTime())) {
    return `couldn't parse "${dateStr}". try something like "add Netflix Jun 15" or "add Hulu July 1 2025".`;
  }

  // Year-less dates ("Jun 15") parse as 2001 — assume the next occurrence
  if (!/\d{4}/.test(dateStr)) {
    const now = new Date();
    parsed.setFullYear(now.getFullYear());
    if (parsed < now) {
      parsed.setFullYear(now.getFullYear() + 1);
    }
  }

  if (parsed < new Date()) {
    return `that date's in the past — give me a future trial end date.`;
  }

  await db.insert(subscriptions).values({
    userId: ctx.userId,
    vendorName: serviceName.trim(),
    trialEndDate: parsed.toISOString(),
    source: "manual_add",
    status: "active",
  });

  const formatted = parsed.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });

  return `got it! i'll ping you about your ${serviceName.trim()} trial before ${formatted}.`;
}
