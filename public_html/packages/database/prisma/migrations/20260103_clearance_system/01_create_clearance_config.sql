-- =====================================================
-- CLEARANCE LEVEL SYSTEM - Migration SQL
-- =====================================================
-- Rulează în phpMyAdmin sau MySQL CLI
-- Step 1: Create config table
CREATE TABLE `clearance_level_config` (
    `level` INT PRIMARY KEY COMMENT 'Clearance level (1-5)',
    `level_name` VARCHAR(50) NOT NULL COMMENT 'Display name',
    `required_streak` INT NOT NULL DEFAULT 0 COMMENT 'Min consecutive check-ins',
    `required_loyalty` INT NOT NULL DEFAULT 0 COMMENT 'Min loyalty points',
    `required_tier` ENUM('ENTRY', 'INVESTOR', 'PRO', 'WHALE') NOT NULL DEFAULT 'ENTRY',
    `required_investment` DECIMAL(15, 2) NOT NULL DEFAULT 0.00 COMMENT 'Min EUR invested',
    `icon_emoji` VARCHAR(10) NULL COMMENT 'Visual icon',
    `description` TEXT NULL COMMENT 'Benefits description',
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;
-- Step 2: Seed 5-level system
INSERT INTO `clearance_level_config` (
        `level`,
        `level_name`,
        `required_streak`,
        `required_loyalty`,
        `required_tier`,
        `required_investment`,
        `icon_emoji`,
        `description`,
        `created_at`,
        `updated_at`
    )
VALUES (
        1,
        'Beginner',
        0,
        0,
        'ENTRY',
        0.00,
        '🌱',
        'Entry level - basic platform access',
        NOW(),
        NOW()
    ),
    (
        2,
        'Active',
        7,
        50,
        'INVESTOR',
        500.00,
        '⭐',
        'Active investor - 7-day streak + €500 invested',
        NOW(),
        NOW()
    ),
    (
        3,
        'Verified',
        30,
        200,
        'PRO',
        2000.00,
        '💎',
        'Verified PRO - 30-day streak + €2,000 portfolio',
        NOW(),
        NOW()
    ),
    (
        4,
        'Trusted',
        90,
        500,
        'PRO',
        5000.00,
        '🏆',
        'Trusted expert - 90-day streak + €5,000 invested',
        NOW(),
        NOW()
    ),
    (
        5,
        'Elite',
        365,
        1000,
        'WHALE',
        10000.00,
        '👑',
        'Elite WHALE - 1-year streak + €10,000+ portfolio',
        NOW(),
        NOW()
    ) ON DUPLICATE KEY
UPDATE `updated_at` = NOW();
-- Verificare
SELECT *
FROM `clearance_level_config`
ORDER BY `level`;