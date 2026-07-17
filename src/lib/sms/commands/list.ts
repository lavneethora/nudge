import { getActiveSubscriptions } from "@/lib/db/queries";
import type { CommandContext } from "../router";

export async function handleList(ctx: CommandContext): Promise<string> {
  const subs = await getActiveSubscriptions(ctx.userId);

  if (subs.length === 0) {
    return "You don't have any active trials being tracked. I'll text you when I find one in your email!";
  }

  const lines = subs.map((s, i) => {
    const amount = s.billingAmount ? ` ($${s.billingAmount}/mo)` : "";
    const date = s.trialEndDate
      ? ` - Ends ${new Date(s.trialEndDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}`
      : "";
    return `${i + 1}. ${s.vendorName}${date}${amount}`;
  });

  return `Your active trials:\n\n${lines.join("\n")}`;
}
