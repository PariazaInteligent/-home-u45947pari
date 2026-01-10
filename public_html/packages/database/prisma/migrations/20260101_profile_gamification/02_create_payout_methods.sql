-- =====================================================
-- MIGRATION 2: Creare tabel payout_methods
-- =====================================================
-- Rulează în phpMyAdmin (copie/paste direct)
CREATE TABLE `payout_methods` (
    `id` VARCHAR(191) NOT NULL,
    `user_id` VARCHAR(191) NOT NULL,
    `method_type` ENUM('REVOLUT', 'IBAN', 'PAYPAL', 'CRYPTO', 'WISE') NOT NULL,
    `account_identifier` VARCHAR(255) NOT NULL COMMENT 'Phone/IBAN/Email/Address',
    `account_name` VARCHAR(255) NULL COMMENT 'Optional account holder name',
    `is_verified` BOOLEAN NOT NULL DEFAULT FALSE,
    `is_primary` BOOLEAN NOT NULL DEFAULT FALSE,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
    PRIMARY KEY (`id`),
    INDEX `payout_methods_user_id_idx` (`user_id`),
    INDEX `payout_methods_is_primary_idx` (`user_id`, `is_primary`),
    CONSTRAINT `payout_methods_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;