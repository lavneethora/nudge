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
    onboardingState: "awaiting_connect",
  });
  assert("reply contains OAuth link path", /\/auth\/gmail\?phone=/.test(yesReply));
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

  // cleanup: no messages/subs were created in these tests, so this is safe
  const ids = [uA.id, uC.id, uD.id, uE.id];
  await db.delete(subscriptions).where(eq(subscriptions.userId, uE.id));
  await db.delete(users).where(or(...ids.map((id) => eq(users.id, id))));

  console.log(`\n──\n${passed} passed, ${failed} failed`);
  if (failed > 0) process.exit(1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
