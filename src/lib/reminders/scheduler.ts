import { db } from "@/lib/db/client";
import { subscriptions, users } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import {
  hasReminderBeenSent,
  recordReminder,
  setLastRemindedSub,
} from "@/lib/db/queries";
import { sendSMSToUser } from "@/lib/messaging";

type ReminderThreshold = {
  days: number;
  type: "5_day" | "2_day" | "final";
  urgency: string;
};

// Ordered most-urgent-first: a subscription gets exactly one reminder —
// the most urgent threshold its daysLeft falls under
const THRESHOLDS: ReminderThreshold[] = [
  { days: 0, type: "final", urgency: "Last chance" },
  { days: 2, type: "2_day", urgency: "2 days left" },
  { days: 5, type: "5_day", urgency: "Reminder" },
];

export async function processReminders() {
  const activeSubs = await db
    .select({
      subscription: subscriptions,
      user: users,
    })
    .from(subscriptions)
    .innerJoin(users, eq(subscriptions.userId, users.id))
    .where(
      and(
        eq(subscriptions.status, "active"),
        eq(users.status, "active")
      )
    );

  let sent = 0;

  for (const { subscription, user } of activeSubs) {
    if (!subscription.trialEndDate) continue;

    // Skip snoozed
    if (
      subscription.snoozeUntil &&
      new Date(subscription.snoozeUntil) > new Date()
    ) {
      continue;
    }

    const endDate = new Date(subscription.trialEndDate);
    const now = new Date();
    const diffMs = endDate.getTime() - now.getTime();
    const daysLeft = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

    // Trial already ended — nothing useful to remind about
    if (daysLeft < 0) continue;

    const threshold = THRESHOLDS.find((t) => daysLeft <= t.days);
    if (!threshold) continue;

    const alreadySent = await hasReminderBeenSent(
      subscription.id,
      threshold.type
    );
    if (alreadySent) continue;

    const amount = subscription.billingAmount
      ? `$${subscription.billingAmount}/mo`
      : "recurring charges";

    const dateStr = endDate.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });

    let msg: string;
    if (threshold.type === "final") {
      msg = `last chance! your ${subscription.vendorName} trial ends TODAY. cancel before midnight or you'll get charged ${amount}.`;
    } else if (threshold.type === "2_day") {
      msg = `2 days left on your ${subscription.vendorName} trial (ends ${dateStr}). cancel now to avoid ${amount}.`;
    } else {
      msg = `heads up, your ${subscription.vendorName} trial ends in ${daysLeft} days (${dateStr}). you'll get charged ${amount} if you don't cancel.`;
    }

    // Never invite a bare "cancel" reply — that's a carrier-mandated opt-out
    // keyword, so it would unsubscribe them from Nudge entirely while they
    // think they're cancelling the trial.
    if (subscription.cancelUrl) {
      msg += `\n\ncancel here: ${subscription.cancelUrl}`;
    } else {
      msg += `\n\ntext "cancel ${subscription.vendorName.toLowerCase()}" and i'll help.`;
    }

    await sendSMSToUser(user.id, user.phoneNumber, msg);
    await recordReminder(subscription.id, threshold.type);
    // remember the sub we just reminded about so a bare "cancel it" /
    // "cancelling now" / "thanks" reply can resolve to it
    await setLastRemindedSub(user.id, subscription.id);
    sent++;
  }

  return sent;
}
