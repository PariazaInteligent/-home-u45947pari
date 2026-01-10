-- Migration: Create backup_codes table for 2FA recovery codes
-- Date: 2026-01-09
-- Purpose: Store hashed backup codes for 2FA recovery
CREATE TABLE IF NOT EXISTS `backup_codes` (
    `id` VARCHAR(191) NOT NULL,
    `user_id` VARCHAR(191) NOT NULL,
    `code_hash` VARCHAR(255) NOT NULL,
    `used_at` DATETIME NULL,
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    INDEX `backup_codes_user_id_idx` (`user_id`),
    CONSTRAINT `backup_codes_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;