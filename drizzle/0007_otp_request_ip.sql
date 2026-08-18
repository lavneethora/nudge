ALTER TABLE `otp_codes` ADD `request_ip` text;

CREATE INDEX `otp_codes_request_ip_idx` ON `otp_codes` (`request_ip`);
