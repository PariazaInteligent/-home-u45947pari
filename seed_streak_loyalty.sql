-- Seed inițial pentru streak_config (idempotent)
-- Mod HYBRID: folosește profit-based cu fallback la check-in
INSERT INTO streak_config (
        id,
        streak_type,
        enabled,
        profit_threshold,
        fallback_to_checkin,
        version,
        created_at,
        updated_at
    )
VALUES (
        'default_config',
        'HYBRID',
        1,
        0.00,
        1,
        1,
        NOW(),
        NOW()
    ) ON DUPLICATE KEY
UPDATE updated_at = NOW();
-- Seed default loyalty rules (idempotent)
-- Rule 1: Daily Check-In (repeatable, 10 puncte zilnic)
INSERT INTO loyalty_rules (
        id,
        rule_name,
        event_type,
        points_awarded,
        conditions_json,
        is_active,
        is_repeatable,
        max_occurrences,
        priority,
        version,
        created_at,
        updated_at
    )
VALUES (
        'rule_daily_checkin',
        'Check-In Zilnic',
        'CHECKIN',
        10,
        NULL,
        1,
        1,
        NULL,
        100,
        1,
        NOW(),
        NOW()
    ) ON DUPLICATE KEY
UPDATE updated_at = NOW();
-- Rule 2: Streak Milestone (7 zile consecutive, 50 puncte, repeatable)
INSERT INTO loyalty_rules (
        id,
        rule_name,
        event_type,
        points_awarded,
        conditions_json,
        is_active,
        is_repeatable,
        max_occurrences,
        priority,
        version,
        created_at,
        updated_at
    )
VALUES (
        'rule_streak_7days',
        'Streak 7 Zile Consecutive',
        'STREAK_MILESTONE',
        50,
        '{"minStreak": 7}',
        1,
        1,
        NULL,
        90,
        1,
        NOW(),
        NOW()
    ) ON DUPLICATE KEY
UPDATE updated_at = NOW();
-- Rule 3: First Investment Threshold (1000 EUR, one-time, 100 puncte)
INSERT INTO loyalty_rules (
        id,
        rule_name,
        event_type,
        points_awarded,
        conditions_json,
        is_active,
        is_repeatable,
        max_occurrences,
        priority,
        version,
        created_at,
        updated_at
    )
VALUES (
        'rule_invest_1000',
        'Prima Investiție 1000 EUR',
        'INVESTMENT_THRESHOLD',
        100,
        '{"minInvestment": 1000}',
        1,
        0,
        1,
        80,
        1,
        NOW(),
        NOW()
    ) ON DUPLICATE KEY
UPDATE updated_at = NOW();