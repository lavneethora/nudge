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
