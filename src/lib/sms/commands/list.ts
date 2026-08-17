import { getActiveSubscriptions } from "@/lib/db/queries";
import type { CommandContext } from "../router";

export async function handleList(ctx: CommandContext): Promise<string> {
  const subs = await getActiveSubscriptions(ctx.userId);

  if (subs.length === 0) {
    return "no active trials right now! i'll text you as soon as i spot one in your inbox.";
  }

  const lines = subs.map((s, i) => {
    const amount = s.billingAmount ? ` ($${s.billingAmount}/mo)` : "";
    const date = s.trialEndDate
      ? `, ends ${new Date(s.trialEndDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}`
      : "";
    return `${i + 1}. ${s.vendorName}${date}${amount}`;
  });

  return `your active trials:\n\n${lines.join("\n")}`;
}
