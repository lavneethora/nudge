import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";

export const users = sqliteTable("users", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  phoneNumber: text("phone_number").notNull().unique(),
  gmailAccessToken: text("gmail_access_token"),
  gmailRefreshToken: text("gmail_refresh_token"),
  gmailTokenExpiry: integer("gmail_token_expiry"),
  oauthConnected: integer("oauth_connected", { mode: "boolean" }).default(
    false
  ),
  oauthStateToken: text("oauth_state_token"),
  status: text("status", {
    enum: ["active", "paused", "disconnected"],
  }).default("active"),
  // where the user is in the conversational onboarding funnel: null =
  // fresh / already connected; "awaiting_connect" = got the intro, we're
  // waiting for their yes/no on connecting Gmail
  onboardingState: text("onboarding_state", {
    enum: ["awaiting_connect"],
  }),
  // when non-null, the user's next inbound is treated as a date response for
  // this specific subscription (Nudge just asked "when does it end?")
  awaitingDateForSubId: text("awaiting_date_for_sub_id"),
  // remembers the most recent sub we sent a reminder for — lets the router
  // resolve bare "cancel it" / "cancel this" / "cancelling" replies to
  // the right trial without the user re-naming it.
  lastRemindedSubId: text("last_reminded_sub_id"),
  // Timestamp of the SMS opt-in. The privacy policy promises we keep this
  // record, and it's the artifact we'd need in a TCPA or carrier dispute.
  // Null for users created by texting in first (consent by initiation).
  smsConsentAt: text("sms_consent_at"),
  createdAt: text("created_at").default(sql`(datetime('now'))`),
  updatedAt: text("updated_at").default(sql`(datetime('now'))`),
});

export const subscriptions = sqliteTable("subscriptions", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  userId: text("user_id")
    .notNull()
    .references(() => users.id),
  vendorName: text("vendor_name").notNull(),
  trialEndDate: text("trial_end_date"),
  billingAmount: real("billing_amount"),
  cancelUrl: text("cancel_url"),
  source: text("source", {
    enum: ["email_detected", "manual_add"],
  }).default("email_detected"),
  status: text("status", {
    enum: ["active", "cancelled", "charged", "snoozed"],
  }).default("active"),
  snoozeUntil: text("snooze_until"),
  emailMessageId: text("email_message_id"),
  createdAt: text("created_at").default(sql`(datetime('now'))`),
  updatedAt: text("updated_at").default(sql`(datetime('now'))`),
});

export const messages = sqliteTable("messages", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  userId: text("user_id")
    .notNull()
    .references(() => users.id),
  direction: text("direction", { enum: ["inbound", "outbound"] }).notNull(),
  body: text("body").notNull(),
  providerMessageId: text("provider_message_id"),
  createdAt: text("created_at").default(sql`(datetime('now'))`),
});

export const remindersSent = sqliteTable("reminders_sent", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  subscriptionId: text("subscription_id")
    .notNull()
    .references(() => subscriptions.id),
  reminderType: text("reminder_type", {
    enum: ["5_day", "2_day", "final"],
  }).notNull(),
  sentAt: text("sent_at").default(sql`(datetime('now'))`),
});

export const vendorCancelInfo = sqliteTable("vendor_cancel_info", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  vendorName: text("vendor_name").notNull(),
  // web / app_store / play_store / call_or_chat / mixed — informational only,
  // not branched on yet; cancelLink already reads fine whether it's a URL or
  // a plain-text instruction
  method: text("method"),
  cancelLink: text("cancel_link").notNull(),
  source: text("source", { enum: ["seed", "claude"] })
    .notNull()
    .default("seed"),
  notes: text("notes"),
  createdAt: text("created_at").default(sql`(datetime('now'))`),
});

export const otpCodes = sqliteTable("otp_codes", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  phoneNumber: text("phone_number").notNull(),
  codeHash: text("code_hash").notNull(),
  attempts: integer("attempts").notNull().default(0),
  maxAttempts: integer("max_attempts").notNull().default(5),
  expiresAt: text("expires_at").notNull(),
  verifiedAt: text("verified_at"),
  // Source IP of the send request, used for per-IP throttling. Per-phone
  // limits alone don't stop someone iterating numbers to pump paid SMS.
  requestIp: text("request_ip"),
  createdAt: text("created_at").default(sql`(datetime('now'))`),
});
