/**
 * Interactive backend verification harness.
 *
 * Usage:
 *   npm run verify              → interactive menu
 *   npm run verify -- <action>  → run one action and exit
 *
 * Actions: seed | command <text...> | scheduler | cron | haiku | webhook |
 *          signup | inspect | reset
 *
 * Runs entirely against the local SQLite DB with the console messaging
 * provider — no Telnyx account needed. Actions marked (needs dev server)
 * require `npm run dev` in another terminal.
 */
import { createInterface } from "node:readline/promises";

// Env must be loaded before any app module is imported — db/client.ts and
// friends read process.env at module load. Hence all dynamic imports below.
process.loadEnvFile(".env.local");
if (!process.env.MESSAGING_PROVIDER) {
  process.env.MESSAGING_PROVIDER = "console";
}

const TEST_PHONE = "+15550001111";
const SIGNUP_TEST_PHONE = "+15550002222";
const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3001";

function daysFromNow(days: number): string {
  return new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();
}

function pass(msg: string) {
  console.log(`  ✅ PASS: ${msg}`);
}

function fail(msg: string) {
  console.log(`  ❌ FAIL: ${msg}`);
}

async function getDeps() {
  const [{ db }, schema, queries, { routeMessage }, { sendSMSToUser }] =
    await Promise.all([
      import("@/lib/db/client"),
      import("@/lib/db/schema"),
      import("@/lib/db/queries"),
      import("@/lib/sms/router"),
      import("@/lib/messaging"),
    ]);
  const { eq, inArray, desc } = await import("drizzle-orm");
  return { db, schema, queries, routeMessage, sendSMSToUser, eq, inArray, desc };
}

async function ensureTestUser() {
  const { db, schema, queries, eq } = await getDeps();
  let user = await queries.getUserByPhone(TEST_PHONE);
  if (!user) {
    user = await queries.createUser(TEST_PHONE);
  }
  await db
    .update(schema.users)
    .set({ oauthConnected: true, status: "active" })
    .where(eq(schema.users.id, user.id));
  return (await queries.getUserByPhone(TEST_PHONE))!;
}

async function seed() {
  const { db, schema, eq, inArray } = await getDeps();
  const user = await ensureTestUser();

  // Wipe the test user's previous seed data so reruns are deterministic
  const existing = await db
    .select({ id: schema.subscriptions.id })
    .from(schema.subscriptions)
    .where(eq(schema.subscriptions.userId, user.id));
  if (existing.length > 0) {
    const ids = existing.map((s) => s.id);
    await db
      .delete(schema.remindersSent)
      .where(inArray(schema.remindersSent.subscriptionId, ids));
    await db
      .delete(schema.subscriptions)
      .where(eq(schema.subscriptions.userId, user.id));
  }

  const subs = [
    { vendorName: "Netflix", trialEndDate: daysFromNow(5), billingAmount: 15.49, cancelUrl: "https://netflix.com/cancel" },
    { vendorName: "Spotify", trialEndDate: daysFromNow(2), billingAmount: 11.99, cancelUrl: null },
    { vendorName: "Adobe", trialEndDate: daysFromNow(0), billingAmount: 54.99, cancelUrl: "https://adobe.com/cancel" },
    { vendorName: "Hulu", trialEndDate: daysFromNow(3), billingAmount: 7.99, cancelUrl: null, snoozeUntil: daysFromNow(2) },
  ];
  for (const sub of subs) {
    await db.insert(schema.subscriptions).values({
      userId: user.id,
      source: "manual_add",
      status: "active",
      ...sub,
    });
  }

  pass(`Seeded user ${TEST_PHONE} (oauthConnected) with 4 subscriptions:`);
  console.log("     Netflix ends in 5d, Spotify in 2d, Adobe TODAY, Hulu snoozed 48h");
}

async function simulateCommand(text: string) {
  const { queries, routeMessage, sendSMSToUser } = await getDeps();
  const user = await queries.getUserByPhone(TEST_PHONE);
  if (!user) {
    fail(`Test user missing — run "seed" first.`);
    return;
  }
  console.log(`\n  📲 Inbound from ${TEST_PHONE}: "${text}"`);
  await queries.logMessage(user.id, "inbound", text);
  const response = await routeMessage({
    userId: user.id,
    phoneNumber: TEST_PHONE,
    body: text,
    oauthConnected: user.oauthConnected ?? false,
    onboardingState: (user.onboardingState ?? null) as
      | "awaiting_connect"
      | null,
    awaitingDateForSubId: user.awaitingDateForSubId ?? null,
    lastRemindedSubId: user.lastRemindedSubId ?? null,
  });
  await sendSMSToUser(user.id, TEST_PHONE, response);
}

async function runScheduler() {
  const { processReminders } = await import("@/lib/reminders/scheduler");
  const sent = await processReminders();
  console.log(`\n  Reminders sent this run: ${sent}`);
  console.log(
    "  Expected: 3 on first run after seed (5_day, 2_day, final; Hulu skipped as snoozed), 0 on immediate rerun (dedup)."
  );
}

async function triggerCronRoutes() {
  const secret = process.env.CRON_SECRET;
  for (const route of ["send-reminders", "scan-emails"]) {
    try {
      const ok = await fetch(`${BASE_URL}/api/cron/${route}`, {
        headers: { authorization: `Bearer ${secret}` },
      });
      const body = await ok.json();
      if (ok.status === 200) pass(`${route} with correct secret → 200 ${JSON.stringify(body)}`);
      else fail(`${route} with correct secret → ${ok.status}`);
      const bad = await fetch(`${BASE_URL}/api/cron/${route}`, {
        headers: { authorization: "Bearer wrong" },
      });
      if (bad.status === 401) pass(`${route} with wrong secret → 401`);
      else fail(`${route} with wrong secret → ${bad.status} (expected 401)`);
      // the query-param path was removed deliberately; make sure it stays gone
      const viaQuery = await fetch(`${BASE_URL}/api/cron/${route}?secret=${secret}`);
      if (viaQuery.status === 401) pass(`${route} via ?secret= query param → 401 (rejected)`);
      else fail(`${route} via ?secret= → ${viaQuery.status} (secret must not work in URLs)`);
    } catch {
      fail(`Could not reach ${BASE_URL} — is "npm run dev" running?`);
      return;
    }
  }
}

async function testHaikuParsing() {
  const { parseEmail } = await import("@/lib/llm/parse-email");
  const endDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  const endDateStr = endDate.toISOString().slice(0, 10);

  console.log("\n  Testing positive fixture (Netflix trial email)...");
  const positive = await parseEmail(
    "Your Netflix free trial has started",
    "info@account.netflix.com",
    `Hi there,\n\nWelcome to Netflix! Your free trial is now active.\n\nYour trial ends on ${endDate.toDateString()}. After that, your Premium plan will renew automatically at $15.49/month.\n\nTo make changes or cancel, visit https://www.netflix.com/youraccount\n\nThe Netflix Team`
  );
  if (!positive) {
    fail("parseEmail returned null for an obvious trial email");
  } else {
    console.log(`     → ${JSON.stringify(positive)}`);
    if (/netflix/i.test(positive.vendorName)) pass("vendor identified as Netflix");
    else fail(`vendor was "${positive.vendorName}"`);
    if (positive.trialEndDate?.startsWith(endDateStr)) pass(`trial end date ≈ ${endDateStr}`);
    else console.log(`     ⚠️  trial end date: ${positive.trialEndDate} (expected ~${endDateStr})`);
    if (positive.billingAmount === 15.49) pass("billing amount $15.49");
    else console.log(`     ⚠️  billing amount: ${positive.billingAmount}`);
    if (positive.confidence >= 0.7) pass(`confidence ${positive.confidence} ≥ 0.7`);
    else fail(`confidence ${positive.confidence} < 0.7 — would be discarded`);
  }

  console.log("\n  Testing negative fixture (newsletter)...");
  const negative = await parseEmail(
    "This week in tech: 10 hot takes",
    "newsletter@techdigest.example.com",
    "Here are this week's top stories in tech. 1. AI does something. 2. A startup raised money. Unsubscribe at any time by clicking here."
  );
  if (negative === null || negative.confidence < 0.7) {
    pass(`newsletter rejected (${negative === null ? "no tool call" : `confidence ${negative.confidence}`})`);
  } else {
    fail(`newsletter parsed as a trial: ${JSON.stringify(negative)}`);
  }
}

async function postFakeWebhook() {
  const payloadId = crypto.randomUUID();
  const envelope = {
    data: {
      event_type: "message.received",
      id: crypto.randomUUID(),
      payload: {
        id: payloadId,
        from: { phone_number: TEST_PHONE },
        to: [{ phone_number: "+15559990000" }],
        text: "list",
      },
    },
  };
  try {
    for (const attempt of ["first", "duplicate"] as const) {
      const res = await fetch(`${BASE_URL}/api/sms/webhook`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(envelope),
      });
      const body = await res.json();
      if (attempt === "first") {
        if (res.status === 200 && !body.duplicate)
          pass("webhook processed message.received (reply box should be in the dev server terminal)");
        else fail(`first POST → ${res.status} ${JSON.stringify(body)}`);
      } else {
        if (res.status === 200 && body.duplicate === true)
          pass("duplicate payload id skipped — idempotency works");
        else fail(`duplicate POST → ${res.status} ${JSON.stringify(body)} (expected duplicate:true)`);
      }
    }
  } catch {
    fail(`Could not reach ${BASE_URL} — is "npm run dev" running?`);
  }
}

async function simulateSignup() {
  try {
    const res = await fetch(`${BASE_URL}/api/signup`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phoneNumber: SIGNUP_TEST_PHONE }),
    });
    const body = await res.json();
    if (res.status === 200 && body.success) {
      pass(`signup → 200, smsNumber=${body.smsNumber ?? "(unset — fine in console mode)"}`);
      console.log("     Welcome SMS box should be in the dev server terminal.");
    } else {
      fail(`signup → ${res.status} ${JSON.stringify(body)}`);
    }
  } catch {
    fail(`Could not reach ${BASE_URL} — is "npm run dev" running?`);
  }
}

async function inspectDb() {
  const { db, schema, desc } = await getDeps();
  const users = await db.select().from(schema.users);
  console.log("\n  users:");
  console.table(
    users.map((u) => ({
      id: u.id.slice(0, 8),
      phone: u.phoneNumber,
      oauth: u.oauthConnected,
      status: u.status,
    }))
  );
  const subs = await db.select().from(schema.subscriptions);
  console.log("  subscriptions:");
  console.table(
    subs.map((s) => ({
      id: s.id.slice(0, 8),
      vendor: s.vendorName,
      ends: s.trialEndDate?.slice(0, 10),
      amount: s.billingAmount,
      status: s.status,
      snoozed: s.snoozeUntil ? s.snoozeUntil.slice(0, 10) : "",
      source: s.source,
    }))
  );
  const msgs = await db
    .select()
    .from(schema.messages)
    .orderBy(desc(schema.messages.createdAt))
    .limit(15);
  console.log("  messages (latest 15):");
  console.table(
    msgs.map((m) => ({
      dir: m.direction,
      body: m.body.length > 60 ? m.body.slice(0, 57) + "..." : m.body,
      providerId: m.providerMessageId?.slice(0, 16),
      at: m.createdAt,
    }))
  );
  const reminders = await db.select().from(schema.remindersSent);
  console.log("  reminders_sent:");
  console.table(
    reminders.map((r) => ({
      subscription: r.subscriptionId.slice(0, 8),
      type: r.reminderType,
      at: r.sentAt,
    }))
  );
}

async function resetTestData() {
  const { db, schema, queries, eq, inArray } = await getDeps();
  for (const phone of [TEST_PHONE, SIGNUP_TEST_PHONE]) {
    const user = await queries.getUserByPhone(phone);
    if (!user) continue;
    const subs = await db
      .select({ id: schema.subscriptions.id })
      .from(schema.subscriptions)
      .where(eq(schema.subscriptions.userId, user.id));
    if (subs.length > 0) {
      await db.delete(schema.remindersSent).where(
        inArray(
          schema.remindersSent.subscriptionId,
          subs.map((s) => s.id)
        )
      );
    }
    await db.delete(schema.subscriptions).where(eq(schema.subscriptions.userId, user.id));
    await db.delete(schema.messages).where(eq(schema.messages.userId, user.id));
    await db.delete(schema.users).where(eq(schema.users.id, user.id));
    console.log(`  🧹 Removed test user ${phone} and all related rows.`);
  }
}

const ACTIONS: Record<string, (args: string[]) => Promise<void>> = {
  seed: () => seed(),
  command: async (args) => {
    if (args.length === 0) {
      console.log('  Provide the message text, e.g. "command list"');
      return;
    }
    await simulateCommand(args.join(" "));
  },
  scheduler: () => runScheduler(),
  cron: () => triggerCronRoutes(),
  haiku: () => testHaikuParsing(),
  webhook: () => postFakeWebhook(),
  signup: () => simulateSignup(),
  inspect: () => inspectDb(),
  reset: () => resetTestData(),
};

const MENU = `
Nudge backend verification  (provider: ${process.env.MESSAGING_PROVIDER})
  1) seed       Seed test user + 4 subscriptions (5d / 2d / today / snoozed)
  2) command    Simulate an inbound SMS command (list, cancel X, add X <date>, snooze X, stop, start, help)
  3) scheduler  Run reminder scheduler directly — run twice to prove dedup
  4) cron       Hit both cron routes over HTTP, correct + wrong secret (needs dev server)
  5) haiku      Claude Haiku parsing against trial + newsletter fixtures (needs ANTHROPIC_API_KEY)
  6) webhook    POST fake Telnyx envelope twice — proves wiring + idempotency (needs dev server)
  7) signup     POST /api/signup with a test phone (needs dev server)
  8) inspect    Dump users / subscriptions / messages / reminders_sent
  9) reset      Delete all test data
  q) quit
`;

const NUMBER_TO_ACTION: Record<string, string> = {
  "1": "seed", "2": "command", "3": "scheduler", "4": "cron", "5": "haiku",
  "6": "webhook", "7": "signup", "8": "inspect", "9": "reset",
};

async function main() {
  const [action, ...args] = process.argv.slice(2);
  if (action) {
    const fn = ACTIONS[action];
    if (!fn) {
      console.error(`Unknown action "${action}". Actions: ${Object.keys(ACTIONS).join(", ")}`);
      process.exit(1);
    }
    await fn(args);
    return;
  }

  const rl = createInterface({ input: process.stdin, output: process.stdout });
  for (;;) {
    console.log(MENU);
    const choice = (await rl.question("> ")).trim();
    if (choice === "q" || choice === "quit") break;
    const name = NUMBER_TO_ACTION[choice] ?? choice.split(/\s+/)[0];
    const fn = ACTIONS[name];
    if (!fn) {
      console.log("  Unknown choice.");
      continue;
    }
    if (name === "command") {
      const inline = choice.split(/\s+/).slice(1);
      const text = inline.length > 0 ? inline.join(" ") : await rl.question("  Message text: ");
      await simulateCommand(text.trim());
    } else {
      await fn([]);
    }
  }
  rl.close();
}

main().then(() => process.exit(0), (err) => {
  console.error(err);
  process.exit(1);
});
