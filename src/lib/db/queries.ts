import { eq, and, gt } from "drizzle-orm";
import { db } from "./client";
import {
  users,
  subscriptions,
  messages,
  remindersSent,
  vendorCancelInfo,
  otpCodes,
} from "./schema";

/** Timestamps we later compare against must be ISO-8601, matching what
 * JS produces. Never rely on SQLite's datetime('now') default for a column
 * that participates in a range query — the formats don't sort together. */
export function nowIso() {
  return new Date().toISOString();
}

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

// Every subscription lookup and mutation below takes an explicit userId and
// ANDs it into the predicate. There is no row-level security behind these —
// Turso will happily act on any id we hand it — so this scoping is the only
// thing standing between a mistaken id and touching someone else's data.
// Keep userId required; an optional one would silently reintroduce the gap.

export async function getSubscriptionById(subId: string, userId: string) {
  const result = await db
    .select()
    .from(subscriptions)
    .where(and(eq(subscriptions.id, subId), eq(subscriptions.userId, userId)))
    .limit(1);
  return result[0] ?? null;
}

export async function updateSubscriptionTrialEnd(
  subId: string,
  userId: string,
  trialEndDate: string
) {
  await db
    .update(subscriptions)
    .set({
      trialEndDate,
      updatedAt: new Date().toISOString(),
    })
    .where(and(eq(subscriptions.id, subId), eq(subscriptions.userId, userId)));
}

export async function deleteSubscription(subId: string, userId: string) {
  await db
    .delete(subscriptions)
    .where(and(eq(subscriptions.id, subId), eq(subscriptions.userId, userId)));
}

export async function markSubscriptionCancelled(subId: string, userId: string) {
  await db
    .update(subscriptions)
    .set({
      status: "cancelled",
      updatedAt: new Date().toISOString(),
    })
    .where(and(eq(subscriptions.id, subId), eq(subscriptions.userId, userId)));
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
  await db.insert(messages).values({
    userId,
    direction,
    body,
    providerMessageId,
    // Written explicitly rather than left to the column default. SQLite's
    // datetime('now') emits "2026-08-19 08:15:00" (space separator), which
    // string-compares as LESS THAN any JS toISOString() value because ' '
    // sorts before 'T'. Any `gt(createdAt, <iso>)` window would silently
    // match nothing — which is exactly how the rate limiters were dead.
    createdAt: nowIso(),
  });
}

/** How many inbound texts this user has sent since `sinceIso`. Backs the
 * webhook throttle — anyone can text our number, and every reply we send
 * costs real money, so a flood has to stop costing us at some point. */
export async function countRecentInbound(userId: string, sinceIso: string) {
  const rows = await db
    .select({ id: messages.id })
    .from(messages)
    .where(
      and(
        eq(messages.userId, userId),
        eq(messages.direction, "inbound"),
        gt(messages.createdAt, sinceIso)
      )
    );
  return rows.length;
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

/** Hard-delete a user and everything belonging to them. Order matters —
 * reminders_sent and subscriptions carry FK references, so children go first.
 * This is what backs the "delete" SMS command and the deletion promise in the
 * privacy policy; nothing here is a soft flag. */
export async function deleteUserCompletely(userId: string) {
  const subs = await db
    .select({ id: subscriptions.id })
    .from(subscriptions)
    .where(eq(subscriptions.userId, userId));

  for (const sub of subs) {
    await db
      .delete(remindersSent)
      .where(eq(remindersSent.subscriptionId, sub.id));
  }

  await db.delete(subscriptions).where(eq(subscriptions.userId, userId));
  await db.delete(messages).where(eq(messages.userId, userId));

  const rows = await db
    .select({ phoneNumber: users.phoneNumber })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);
  if (rows[0]) {
    await db.delete(otpCodes).where(eq(otpCodes.phoneNumber, rows[0].phoneNumber));
  }

  await db.delete(users).where(eq(users.id, userId));
}

export async function recordSmsConsent(userId: string) {
  await db
    .update(users)
    .set({
      smsConsentAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    })
    .where(eq(users.id, userId));
}

export async function setSubscriptionCancelUrl(
  subId: string,
  userId: string,
  cancelUrl: string
) {
  await db
    .update(subscriptions)
    .set({ cancelUrl, updatedAt: new Date().toISOString() })
    .where(and(eq(subscriptions.id, subId), eq(subscriptions.userId, userId)));
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
