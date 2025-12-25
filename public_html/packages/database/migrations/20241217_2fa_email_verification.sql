-- Add 2FA columns to users table (missing from database)
ALTER TABLE `users`
ADD COLUMN `two_fa_enabled` TINYINT(1) NOT NULL DEFAULT 0 AFTER `status`,
ADD COLUMN `two_fa_secret` VARCHAR(191) NULL AFTER `two_fa_enabled`,
ADD COLUMN `email_verified` TINYINT(1) NOT NULL DEFAULT 0 AFTER `two_fa_secret`,
ADD COLUMN `email_verified_at` DATETIME NULL AFTER `email_verified`;
