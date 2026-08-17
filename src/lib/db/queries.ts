import { eq, and } from "drizzle-orm";
import { db } from "./client";
import {
  users,
  subscriptions,
  messages,
  remindersSent,
  vendorCancelInfo,
} from "./schema";

export async function getUserByPhone(phoneNumber: string) {
  const result = await db
    .select()
    .from(users)
    .where(eq(users.phoneNumber, phoneNumber))
    .limit(1);
  return result[0] ?? null;
}

export async function getUserById(id: string) {
  const result = await db
    .select()
    .from(users)
    .where(eq(users.id, id))
    .limit(1);
  return result[0] ?? null;
}

export async function createUser(phoneNumber: string) {
  const result = await db
    .insert(users)
    .values({ phoneNumber })
    .returning();
  return result[0];
}

export async function setOnboardingState(
  userId: string,
  state: "awaiting_connect" | null
) {
  await db
    .update(users)
    .set({ onboardingState: state, updatedAt: new Date().toISOString() })
    .where(eq(users.id, userId));
}

export async function setAwaitingDateForSub(
  userId: string,
  subId: string | null
) {
  await db
    .update(users)
    .set({
      awaitingDateForSubId: subId,
      updatedAt: new Date().toISOString(),
    })
    .where(eq(users.id, userId));
}

export async function getSubscriptionById(subId: string) {
  const result = await db
    .select()
    .from(subscriptions)
    .where(eq(subscriptions.id, subId))
    .limit(1);
  return result[0] ?? null;
}

export async function updateSubscriptionTrialEnd(
  subId: string,
  trialEndDate: string
) {
  await db
    .update(subscriptions)
    .set({
      trialEndDate,
      updatedAt: new Date().toISOString(),
    })
    .where(eq(subscriptions.id, subId));
}

export async function deleteSubscription(subId: string) {
  await db.delete(subscriptions).where(eq(subscriptions.id, subId));
}

export async function markSubscriptionCancelled(subId: string) {
  await db
    .update(subscriptions)
    .set({
      status: "cancelled",
      updatedAt: new Date().toISOString(),
    })
    .where(eq(subscriptions.id, subId));
}

export async function setLastRemindedSub(userId: string, subId: string | null) {
  await db
    .update(users)
    .set({
      lastRemindedSubId: subId,
      updatedAt: new Date().toISOString(),
    })
    .where(eq(users.id, userId));
}

export async function getActiveSubscriptions(userId: string) {
  return db
    .select()
    .from(subscriptions)
    .where(
      and(eq(subscriptions.userId, userId), eq(subscriptions.status, "active"))
    );
}

export async function getSubscriptionByVendor(
  userId: string,
  vendorName: string
) {
  const result = await db
    .select()
    .from(subscriptions)
    .where(
      and(
        eq(subscriptions.userId, userId),
        eq(subscriptions.vendorName, vendorName)
      )
    )
    .limit(1);
  return result[0] ?? null;
}

export async function logMessage(
  userId: string,
  direction: "inbound" | "outbound",
  body: string,
  providerMessageId?: string
) {
  await db
    .insert(messages)
    .values({ userId, direction, body, providerMessageId });
}

export async function getMessageByProviderId(providerMessageId: string) {
  const result = await db
    .select()
    .from(messages)
    .where(eq(messages.providerMessageId, providerMessageId))
    .limit(1);
  return result[0] ?? null;
}

export async function hasReminderBeenSent(
  subscriptionId: string,
  reminderType: "5_day" | "2_day" | "final"
) {
  const result = await db
    .select()
    .from(remindersSent)
    .where(
      and(
        eq(remindersSent.subscriptionId, subscriptionId),
        eq(remindersSent.reminderType, reminderType)
      )
    )
    .limit(1);
  return result.length > 0;
}

export async function recordReminder(
  subscriptionId: string,
  reminderType: "5_day" | "2_day" | "final"
) {
  await db.insert(remindersSent).values({ subscriptionId, reminderType });
}

export async function setSubscriptionCancelUrl(
  subId: string,
  cancelUrl: string
) {
  await db
    .update(subscriptions)
    .set({ cancelUrl, updatedAt: new Date().toISOString() })
    .where(eq(subscriptions.id, subId));
}

/** Bidirectional lowercase-substring match against the small static/cached
 * vendor list — same matching style cancel.ts already uses for subscriptions,
 * since there's no canonical vendor identity table in this project. */
export async function getVendorCancelInfo(vendorName: string) {
  const all = await db.select().from(vendorCancelInfo);
  const needle = vendorName.trim().toLowerCase();
  return (
    all.find((v) => {
      const hay = v.vendorName.toLowerCase();
      return hay.includes(needle) || needle.includes(hay);
    }) ?? null
  );
}

export async function addVendorCancelInfo(
  vendorName: string,
  cancelLink: string,
  method: string
) {
  await db
    .insert(vendorCancelInfo)
    .values({ vendorName, cancelLink, method, source: "claude" });
}
