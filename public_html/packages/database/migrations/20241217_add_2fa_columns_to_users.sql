-- Targeted migration: Add missing 2FA and email verification columns to users table
-- Safe to run: adds columns with defaults, no data loss
-- Run this manually via PHPMyAdmin or mysql CLI

-- Check if columns exist before adding (idempotent)
-- Run ONE statement at a time if your SQL client doesn't support conditionals

ALTER TABLE `users` 
ADD COLUMN IF NOT EXISTS `two_fa_enabled` TINYINT(1) NOT NULL DEFAULT 0 AFTER `status`;

ALTER TABLE `users`
ADD COLUMN IF NOT EXISTS `two_fa_secret` VARCHAR(191) NULL AFTER `two_fa_enabled`;

ALTER TABLE `users`
ADD COLUMN IF NOT EXISTS `email_verified` TINYINT(1) NOT NULL DEFAULT 0 AFTER `two_fa_secret`;

ALTER TABLE `users`
ADD COLUMN IF NOT EXISTS `email_verified_at` DATETIME NULL AFTER `email_verified`;

ALTER TABLE `users`
ADD COLUMN IF NOT EXISTS `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP AFTER `created_at`;

-- Verify columns exist:
-- SHOW COLUMNS FROM users;
