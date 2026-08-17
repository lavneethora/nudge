CREATE TABLE `otp_codes` (
  `id` text PRIMARY KEY NOT NULL,
  `phone_number` text NOT NULL,
  `code_hash` text NOT NULL,
  `attempts` integer DEFAULT 0 NOT NULL,
  `max_attempts` integer DEFAULT 5 NOT NULL,
  `expires_at` text NOT NULL,
  `verified_at` text,
  `created_at` text DEFAULT (datetime('now'))
);

CREATE INDEX `otp_codes_phone_idx` ON `otp_codes` (`phone_number`);
CREATE INDEX `otp_codes_expires_idx` ON `otp_codes` (`expires_at`);
