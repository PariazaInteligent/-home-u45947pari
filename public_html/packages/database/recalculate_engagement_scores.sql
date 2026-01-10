-- RECALCULATE ALL ENGAGEMENT SCORES WITH NEW CLICK-FIRST FORMULA
-- Run this SQL script after updating to the new analytics formula
-- Formula: opens (10%) + clicks (60%) + conversions (30%)
-- Backup current scores (optional)
CREATE TABLE IF NOT EXISTS broadcast_analytics_backup_old_scores AS
SELECT id,
    engagement_score as old_score,
    created_at
FROM broadcast_analytics;
-- Recalculate engagement scores with NEW formula
UPDATE broadcast_analytics
SET engagement_score = (
        (opened_count / GREATEST(recipient_count, 1) * 10) + (
            clicked_count / GREATEST(recipient_count, 1) * 60
        ) + (
            converted_count / GREATEST(recipient_count, 1) * 30
        )
    )
WHERE recipient_count > 0;
-- Verify changes
SELECT id,
    template_id,
    recipient_count,
    opened_count,
    clicked_count,
    converted_count,
    ROUND(opened_count / recipient_count * 100, 1) as open_rate,
    ROUND(clicked_count / recipient_count * 100, 1) as click_rate,
    ROUND(converted_count / recipient_count * 100, 1) as conversion_rate,
    ROUND(engagement_score, 2) as new_score
FROM broadcast_analytics
ORDER BY engagement_score DESC
LIMIT 10;
-- Compare OLD vs NEW scores (if backup exists)
-- SELECT 
--     ba.id,
--     ba.template_id,
--     bab.old_score,
--     ba.engagement_score as new_score,
--     ROUND(ba.engagement_score - bab.old_score, 2) as score_change
-- FROM broadcast_analytics ba
-- JOIN broadcast_analytics_backup_old_scores bab ON ba.id = bab.id
-- ORDER BY score_change DESC;