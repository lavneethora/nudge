CREATE TABLE `messages` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`direction` text NOT NULL,
	`body` text NOT NULL,
	`twilio_sid` text,
	`created_at` text DEFAULT (datetime('now')),
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `reminders_sent` (
	`id` text PRIMARY KEY NOT NULL,
	`subscription_id` text NOT NULL,
	`reminder_type` text NOT NULL,
	`sent_at` text DEFAULT (datetime('now')),
	FOREIGN KEY (`subscription_id`) REFERENCES `subscriptions`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `subscriptions` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`vendor_name` text NOT NULL,
	`trial_end_date` text,
	`billing_amount` real,
	`cancel_url` text,
	`source` text DEFAULT 'email_detected',
	`status` text DEFAULT 'active',
	`snooze_until` text,
	`email_message_id` text,
	`created_at` text DEFAULT (datetime('now')),
	`updated_at` text DEFAULT (datetime('now')),
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` text PRIMARY KEY NOT NULL,
	`phone_number` text NOT NULL,
	`gmail_access_token` text,
	`gmail_refresh_token` text,
	`gmail_token_expiry` integer,
	`oauth_connected` integer DEFAULT false,
	`oauth_state_token` text,
	`status` text DEFAULT 'active',
	`created_at` text DEFAULT (datetime('now')),
	`updated_at` text DEFAULT (datetime('now'))
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_phone_number_unique` ON `users` (`phone_number`);