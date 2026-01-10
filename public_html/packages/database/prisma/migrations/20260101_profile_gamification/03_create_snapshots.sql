-- =====================================================
-- MIGRATION 3: Creare tabel snapshots pentru portfolio tracking
-- =====================================================
-- Rulează în phpMyAdmin (copie/paste direct)
CREATE TABLE IF NOT EXISTS `snapshots` (
    `id` VARCHAR(191) NOT NULL,
    `user_id` VARCHAR(191) NOT NULL,
    `snapshot_date` DATE NOT NULL COMMENT 'Date of snapshot',
    `principal_amount` DECIMAL(15, 2) NOT NULL DEFAULT 0.00 COMMENT 'Total deposits - withdrawals',
    `profit_net` DECIMAL(15, 2) NOT NULL DEFAULT 0.00 COMMENT 'Net profit/loss',
    `total_value` DECIMAL(15, 2) NOT NULL DEFAULT 0.00 COMMENT 'principal + profit',
    `share_percent` DECIMAL(5, 2) NOT NULL DEFAULT 0.00 COMMENT 'User share of total fund',
    `total_fund_value` DECIMAL(15, 2) NOT NULL DEFAULT 0.00 COMMENT 'Total platform bankroll',
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    PRIMARY KEY (`id`),
    UNIQUE KEY `snapshots_user_date_unique` (`user_id`, `snapshot_date`),
    INDEX `snapshots_user_id_idx` (`user_id`),
    INDEX `snapshots_date_idx` (`snapshot_date`),
    CONSTRAINT `snapshots_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;