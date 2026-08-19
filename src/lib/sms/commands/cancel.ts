import {
  getActiveSubscriptions,
  markSubscriptionCancelled,
  setSubscriptionCancelUrl,
  getVendorCancelInfo,
  addVendorCancelInfo,
} from "@/lib/db/queries";
import { findCancelLink } from "@/lib/llm/find-cancel-link";
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

  const name = target.vendorName.toLowerCase();

  // 1. already has a link captured from the trial email
  if (target.cancelUrl) {
    await markSubscriptionCancelled(target.id, ctx.userId);
    return `here's your ${name} cancel link:\n${target.cancelUrl}\n\nmarked as cancelled.`;
  }

  // 2. static/cached vendor table
  const known = await getVendorCancelInfo(target.vendorName);
  if (known) {
    await setSubscriptionCancelUrl(target.id, ctx.userId, known.cancelLink);
    await markSubscriptionCancelled(target.id, ctx.userId);
    return `here's your ${name} cancel link:\n${known.cancelLink}\n\nmarked as cancelled.`;
  }

  // 3. ask Claude, and cache a hit so we never look this vendor up twice
  const found = await findCancelLink(target.vendorName);
  if (found) {
    await addVendorCancelInfo(target.vendorName, found.cancelLink, found.method);
    await setSubscriptionCancelUrl(target.id, ctx.userId, found.cancelLink);
    await markSubscriptionCancelled(target.id, ctx.userId);
    return `here's your ${name} cancel link:\n${found.cancelLink}\n\nmarked as cancelled.`;
  }

  // 4. nothing found anywhere
  return `no cancel link on file for ${name}. try googling "${name} cancel subscription" or check their site directly.`;
}
