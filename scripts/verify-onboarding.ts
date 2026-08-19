// End-to-end verification of the Poke-style onboarding flow.
// Uses the same imports the real webhook uses; no mocks.
//
// Cases covered:
//   A. Fresh user texts "so, what is nudge anyway??" → gets the lowercase
//      intro with brand+HELP+STOP+frequency+fees disclosures + gmail ask,
//      state becomes "awaiting_connect".
//   B. That user texts "yes" → gets the OAuth link + save-as-nudge nudge,
//      state clears.
//   C. Another fresh user texts anything ("sup") → also gets the intro
//      (state-based, not text-matched).
//   D. Fresh user texts "STOP" mid-onboarding → gets the unsubscribe
//      copy AND their `users.status` becomes "paused".
//   E. Scanner-found sub without a date → user gets asked; replying
//      "aug 15" writes the date + clears state; "not a trial" deletes it.
//   F. Post-reminder replies: "cancel it" cancels the last-reminded sub,
//      "cancelling now" marks it cancelled, "thanks" gets a friendly 👍.

import { routeMessage } from "@/lib/sms/router";
import { createUser, setOnboardingState } from "@/lib/db/queries";
import { db } from "@/lib/db/client";
import {
  users,
  messages,
  subscriptions,
  remindersSent,
} from "@/lib/db/schema";
import { eq, or, inArray } from "drizzle-orm";

const A = "+15550001111";
const B = "+15550002222";
const C = "+15550003333";

let passed = 0;
let failed = 0;

function assert(name: string, cond: boolean, extra?: string) {
  if (cond) {
    console.log(`  ✓ ${name}`);
    passed++;
  } else {
    console.log(`  ✗ ${name}${extra ? "  — " + extra : ""}`);
    failed++;
  }
}

async function fresh(phone: string) {
  const existing = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.phoneNumber, phone));
  if (existing.length) {
    const ids = existing.map((r) => r.id);
    // clear FK-referencing rows before deleting the user
    const subs = await db
      .select({ id: subscriptions.id })
      .from(subscriptions)
      .where(inArray(subscriptions.userId, ids));
    if (subs.length) {
      await db
        .delete(remindersSent)
        .where(inArray(remindersSent.subscriptionId, subs.map((s) => s.id)));
      await db.delete(subscriptions).where(inArray(subscriptions.userId, ids));
    }
    await db.delete(messages).where(inArray(messages.userId, ids));
    await db.delete(users).where(inArray(users.id, ids));
  }
  return createUser(phone);
}

async function reload(userId: string) {
  const r = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  return r[0]!;
}

async function driveIntro(user: { id: string; phoneNumber: string }, text: string) {
  return routeMessage({
    userId: user.id,
    phoneNumber: user.phoneNumber,
    body: text,
    oauthConnected: false,
    awaitingDateForSubId: null,
    lastRemindedSubId: null,
    onboardingState: null,
  });
}

async function main() {
  console.log("\n── A. fresh user texts the pre-fill ──");
  const uA = await fresh(A);
  const introReply = await driveIntro(uA, "so, what is nudge anyway??");
  assert("reply contains 'hey! im nudge'", introReply.includes("hey! im nudge"));
  assert("reply mentions HELP", /\bHELP\b/.test(introReply));
  assert("reply mentions STOP", /\bSTOP\b/.test(introReply));
  assert(
    "reply contains msg frequency + rates disclosures",
    /msg frequency varies/.test(introReply) && /msg & data rates/.test(introReply)
  );
  assert("reply asks about gmail", /gmail/i.test(introReply));
  const uA2 = await reload(uA.id);
  assert(
    "user state is now awaiting_connect",
    uA2.onboardingState === "awaiting_connect",
    `got ${JSON.stringify(uA2.onboardingState)}`
  );

  console.log("\n── B. user replies 'yes' ──");
  const yesReply = await routeMessage({
    userId: uA.id,
    phoneNumber: A,
    body: "yes",
    oauthConnected: false,
    awaitingDateForSubId: null,
    lastRemindedSubId: null,
    onboardingState: "awaiting_connect",
  });
  assert(
    "reply contains tokenised OAuth link",
    /\/auth\/gmail\?t=[A-Za-z0-9_-]{20,}/.test(yesReply)
  );
  // A phone number in this link would mean anyone who knows someone's number
  // could start a Gmail connect for their account — regression guard.
  assert("OAuth link leaks no phone number", !/phone=/.test(yesReply));
  assert(
    "reply includes the save-as-nudge nudge",
    /save me in your contacts as "nudge"/.test(yesReply)
  );
  const uA3 = await reload(uA.id);
  assert(
    "state cleared to null after yes",
    uA3.onboardingState === null,
    `got ${JSON.stringify(uA3.onboardingState)}`
  );

  console.log("\n── C. different fresh user says 'sup' ──");
  const uC = await fresh(C);
  const supReply = await driveIntro(uC, "sup");
  assert("same intro fires regardless of text", supReply.includes("hey! im nudge"));
  const uC2 = await reload(uC.id);
  assert("state moved to awaiting_connect", uC2.onboardingState === "awaiting_connect");

  console.log("\n── D. STOP mid-onboarding ──");
  const uD = await fresh(B);
  await setOnboardingState(uD.id, "awaiting_connect");
  const stopReply = await routeMessage({
    userId: uD.id,
    phoneNumber: B,
    body: "STOP",
    oauthConnected: false,
    awaitingDateForSubId: null,
    lastRemindedSubId: null,
    onboardingState: "awaiting_connect",
  });
  assert("STOP reply starts with 'nudge:'", stopReply.startsWith("nudge:"));
  assert(
    "STOP reply promises no more messages",
    /won't get any more messages/i.test(stopReply)
  );
  assert("STOP reply invites START", /text START/i.test(stopReply));
  const uD2 = await reload(uD.id);
  assert("user.status is paused", uD2.status === "paused", `got ${uD2.status}`);

  console.log("\n── E. date-reply flow ──");
  // Seed: user with OAuth, awaiting date on a real sub
  const uE = await fresh("+15550004444");
  await db
    .update(users)
    .set({ oauthConnected: true })
    .where(eq(users.id, uE.id));
  const [seededSub] = await db
    .insert(subscriptions)
    .values({
      userId: uE.id,
      vendorName: "Tidal",
      trialEndDate: null,
      billingAmount: null,
      source: "email_detected",
      status: "active",
      emailMessageId: "test-e-1",
    })
    .returning({ id: subscriptions.id });
  await db
    .update(users)
    .set({ awaitingDateForSubId: seededSub.id })
    .where(eq(users.id, uE.id));

  // date reply "aug 15" → updates the sub, clears state
  const dateReply = await routeMessage({
    userId: uE.id,
    phoneNumber: "+15550004444",
    body: "aug 15",
    oauthConnected: true,
    onboardingState: null,
    awaitingDateForSubId: seededSub.id,
    lastRemindedSubId: null,
  });
  assert("date reply confirms with vendor name", /Tidal/.test(dateReply));
  assert("date reply names a specific end month", /Aug/.test(dateReply));
  const uE2 = await reload(uE.id);
  assert("awaitingDateForSubId cleared", uE2.awaitingDateForSubId === null);
  const subAfter = await db
    .select({ trialEndDate: subscriptions.trialEndDate })
    .from(subscriptions)
    .where(eq(subscriptions.id, seededSub.id))
    .limit(1);
  assert(
    "sub.trialEndDate is now an ISO date",
    /^\d{4}-\d{2}-\d{2}$/.test(subAfter[0]?.trialEndDate ?? "")
  );

  // second seeded sub, this time user says "not a trial" → sub deleted
  const [seededSub2] = await db
    .insert(subscriptions)
    .values({
      userId: uE.id,
      vendorName: "Some Newsletter",
      trialEndDate: null,
      billingAmount: null,
      source: "email_detected",
      status: "active",
      emailMessageId: "test-e-2",
    })
    .returning({ id: subscriptions.id });
  await db
    .update(users)
    .set({ awaitingDateForSubId: seededSub2.id })
    .where(eq(users.id, uE.id));

  const notATrial = await routeMessage({
    userId: uE.id,
    phoneNumber: "+15550004444",
    body: "not a trial",
    oauthConnected: true,
    onboardingState: null,
    awaitingDateForSubId: seededSub2.id,
    lastRemindedSubId: null,
  });
  assert(
    "'not a trial' reply acknowledges drop",
    /dropped Some Newsletter from your list/.test(notATrial)
  );
  const gone = await db
    .select({ id: subscriptions.id })
    .from(subscriptions)
    .where(eq(subscriptions.id, seededSub2.id));
  assert("sub is deleted from db", gone.length === 0);

  console.log("\n── F. post-reminder replies ──");
  const F = "+15550005555";
  const uF = await fresh(F);
  await db
    .update(users)
    .set({ oauthConnected: true })
    .where(eq(users.id, uF.id));

  // seed two subs so we can test each pattern
  const [netflixSub] = await db
    .insert(subscriptions)
    .values({
      userId: uF.id,
      vendorName: "Netflix",
      trialEndDate: new Date(Date.now() + 2 * 86400000).toISOString().slice(0, 10),
      billingAmount: 15.49,
      source: "manual_add",
      status: "active",
    })
    .returning({ id: subscriptions.id });
  const [spotifySub] = await db
    .insert(subscriptions)
    .values({
      userId: uF.id,
      vendorName: "Spotify",
      trialEndDate: new Date(Date.now() + 5 * 86400000).toISOString().slice(0, 10),
      billingAmount: 11.99,
      source: "manual_add",
      status: "active",
    })
    .returning({ id: subscriptions.id });

  // F1: "cancel it" with lastRemindedSubId → marks Netflix cancelled
  await db
    .update(users)
    .set({ lastRemindedSubId: netflixSub.id })
    .where(eq(users.id, uF.id));
  const cancelItReply = await routeMessage({
    userId: uF.id,
    phoneNumber: F,
    body: "cancel it",
    oauthConnected: true,
    onboardingState: null,
    awaitingDateForSubId: null,
    lastRemindedSubId: netflixSub.id,
  });
  assert("cancel it → mentions Netflix", /Netflix/i.test(cancelItReply));
  assert("cancel it → mentions cancelled", /cancelled/i.test(cancelItReply));
  const nfAfter = await db
    .select({ status: subscriptions.status })
    .from(subscriptions)
    .where(eq(subscriptions.id, netflixSub.id))
    .limit(1);
  assert(
    "Netflix sub status is cancelled",
    nfAfter[0]?.status === "cancelled",
    `got ${nfAfter[0]?.status}`
  );

  // F2: "cancelling now" with lastRemindedSubId → marks Spotify cancelled
  await db
    .update(users)
    .set({ lastRemindedSubId: spotifySub.id })
    .where(eq(users.id, uF.id));
  const cancellingReply = await routeMessage({
    userId: uF.id,
    phoneNumber: F,
    body: "cancelling now",
    oauthConnected: true,
    onboardingState: null,
    awaitingDateForSubId: null,
    lastRemindedSubId: spotifySub.id,
  });
  assert("cancelling now → mentions Spotify", /Spotify/i.test(cancellingReply));
  assert("cancelling now → mentions cancelled", /cancelled/i.test(cancellingReply));
  const spAfter = await db
    .select({ status: subscriptions.status })
    .from(subscriptions)
    .where(eq(subscriptions.id, spotifySub.id))
    .limit(1);
  assert(
    "Spotify sub status is cancelled",
    spAfter[0]?.status === "cancelled",
    `got ${spAfter[0]?.status}`
  );

  // F3: "thanks" → friendly 👍, no state change
  const thanksReply = await routeMessage({
    userId: uF.id,
    phoneNumber: F,
    body: "thanks",
    oauthConnected: true,
    onboardingState: null,
    awaitingDateForSubId: null,
    lastRemindedSubId: null,
  });
  assert("thanks → gets 👍", thanksReply.includes("👍"));

  // F4: "cancel it" with no lastRemindedSubId → asks which one
  const bareCancelReply = await routeMessage({
    userId: uF.id,
    phoneNumber: F,
    body: "cancel it",
    oauthConnected: true,
    onboardingState: null,
    awaitingDateForSubId: null,
    lastRemindedSubId: null,
  });
  assert(
    "cancel it with no context → asks which one",
    /which one/i.test(bareCancelReply),
    `got: ${bareCancelReply}`
  );

  // cleanup
  const allIds = [uA.id, uC.id, uD.id, uE.id, uF.id];
  for (const uid of [uE.id, uF.id]) {
    const subs = await db
      .select({ id: subscriptions.id })
      .from(subscriptions)
      .where(eq(subscriptions.userId, uid));
    if (subs.length) {
      await db
        .delete(remindersSent)
        .where(inArray(remindersSent.subscriptionId, subs.map((s) => s.id)));
      await db.delete(subscriptions).where(eq(subscriptions.userId, uid));
    }
  }
  await db.delete(users).where(or(...allIds.map((id) => eq(users.id, id))));

  console.log(`\n──\n${passed} passed, ${failed} failed`);
  if (failed > 0) process.exit(1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
