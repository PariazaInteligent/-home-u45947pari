-- =====================================================
-- SEED DATA: Demo snapshots și payout methods pentru testing
-- =====================================================
-- IMPORTANT: Înlocuiește 'USER_ID_HERE' cu ID-ul real al userului tău
-- Găsește ID-ul cu: SELECT id FROM users WHERE email = 'admin@pariazainteligent.ro';
-- Demo snapshots (ultimele 30 zile, progres pozitiv)
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
        CONCAT('snap_', UUID()),
        'USER_ID_HERE',
        DATE_SUB(CURDATE(), INTERVAL 30 DAY),
        5000.00,
        -120.00,
        4880.00,
        2.14,
        228000.00,
        NOW()
    ),
    (
        CONCAT('snap_', UUID()),
        'USER_ID_HERE',
        DATE_SUB(CURDATE(), INTERVAL 20 DAY),
        5000.00,
        200.50,
        5200.50,
        2.23,
        233000.00,
        NOW()
    ),
    (
        CONCAT('snap_', UUID()),
        'USER_ID_HERE',
        DATE_SUB(CURDATE(), INTERVAL 10 DAY),
        5000.00,
        450.75,
        5450.75,
        2.28,
        239000.00,
        NOW()
    ),
    (
        CONCAT('snap_', UUID()),
        'USER_ID_HERE',
        CURDATE(),
        5000.00,
        620.00,
        5620.00,
        2.30,
        244000.00,
        NOW()
    );
-- Update user stats
UPDATE `users`
SET `streak_days` = 12,
    `loyalty_points` = 4200,
    `tier` = 'PRO',
    `clearance_level` = 2,
    `last_checkin_at` = DATE_SUB(NOW(), INTERVAL 1 DAY)
WHERE `id` = 'USER_ID_HERE';
-- Demo payout method
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
        CONCAT('pm_', UUID()),
        'USER_ID_HERE',
        'REVOLUT',
        '+40712***456',
        'Admin User',
        TRUE,
        TRUE,
        NOW()
    );