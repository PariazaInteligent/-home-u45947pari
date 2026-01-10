-- =====================================================
-- FIX FINAL: Drop + Recreate snapshots corect + Seed demo data
-- =====================================================
-- Rulează în phpMyAdmin (copie/paste direct)
-- 1. Drop tabel vechi dacă există
DROP TABLE IF EXISTS `snapshots`;
-- 2. Recreate cu structura corectă
CREATE TABLE `snapshots` (
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
-- 3. Seed demo data pentru admin user
-- IMPORTANT: Găsește USER_ID cu: SELECT id FROM users WHERE email = 'admin@pariazainteligent.ro';
-- Apoi înlocuiește USER_ID_PLACEHOLDER mai jos cu ID-ul real
SET @admin_user_id = (
        SELECT id
        FROM users
        WHERE email = 'admin@pariazainteligent.ro'
        LIMIT 1
    );
-- Verify we got a user ID
SELECT @admin_user_id AS 'Admin User ID Found';
-- Insert demo snapshots (ultimele 30 zile cu progres pozitiv)
INSERT INTO `snapshots` (
        `id`,
        `user_id`,
        `snapshot_date`,
        `principal_amount`,
        `profit_net`,
        `total_value`,
        `share_percent`,
        `total_fund_value`,
        `created_at`
    )
VALUES (
        UUID(),
        @admin_user_id,
        DATE_SUB(CURDATE(), INTERVAL 30 DAY),
        5000.00,
        -120.00,
        4880.00,
        2.14,
        228000.00,
        NOW()
    ),
    (
        UUID(),
        @admin_user_id,
        DATE_SUB(CURDATE(), INTERVAL 20 DAY),
        5000.00,
        200.50,
        5200.50,
        2.23,
        233000.00,
        NOW()
    ),
    (
        UUID(),
        @admin_user_id,
        DATE_SUB(CURDATE(), INTERVAL 10 DAY),
        5000.00,
        450.75,
        5450.75,
        2.28,
        239000.00,
        NOW()
    ),
    (
        UUID(),
        @admin_user_id,
        CURDATE(),
        5000.00,
        620.00,
        5620.00,
        2.30,
        244000.00,
        NOW()
    );
-- 4. Update user stats gamification
UPDATE `users`
SET `streak_days` = 12,
    `loyalty_points` = 4200,
    `tier` = 'PRO',
    `clearance_level` = 2,
    `last_checkin_at` = DATE_SUB(NOW(), INTERVAL 1 DAY)
WHERE `id` = @admin_user_id;
-- 5. Insert demo payout method
INSERT INTO `payout_methods` (
        `id`,
        `user_id`,
        `method_type`,
        `account_identifier`,
        `account_name`,
        `is_verified`,
        `is_primary`,
        `created_at`
    )
VALUES (
        UUID(),
        @admin_user_id,
        'REVOLUT',
        '+40712***456',
        'Admin User',
        TRUE,
        TRUE,
        NOW()
    );
-- 6. Verify inserts
SELECT 'Snapshots inserted:' AS status,
    COUNT(*) AS count
FROM snapshots
WHERE user_id = @admin_user_id;
SELECT 'User stats updated:' AS status,
    streak_days,
    loyalty_points,
    tier
FROM users
WHERE id = @admin_user_id;
SELECT 'Payout methods:' AS status,
    COUNT(*) AS count
FROM payout_methods
WHERE user_id = @admin_user_id;
SELECT '=== DONE: Snapshots recreated + Seed complete ===' AS final_status;