-- BROADCAST HISTORY & TRANSPARENCY - Database Schema
-- Creates table to archive all broadcast content for complete audit trail
-- Create broadcasts archive table
CREATE TABLE IF NOT EXISTS broadcasts (
    id VARCHAR(100) PRIMARY KEY,
    analytics_id VARCHAR(100) UNIQUE,
    template_id VARCHAR(50) NOT NULL,
    subject VARCHAR(500) NOT NULL,
    message_text TEXT NOT NULL,
    html_content TEXT,
    sent_by_user_id VARCHAR(100),
    sent_by_name VARCHAR(200),
    sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    recipient_filter JSON,
    recipient_user_ids JSON NOT NULL,
    -- Array of user IDs who received it
    FOREIGN KEY (analytics_id) REFERENCES broadcast_analytics(id) ON DELETE
    SET NULL,
        INDEX idx_sent_at (sent_at DESC),
        INDEX idx_template (template_id),
        INDEX idx_sent_by (sent_by_user_id)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;
-- Add comment for transparency
ALTER TABLE broadcasts COMMENT = 'Complete audit trail of all broadcast emails sent - for transparency and accountability';
-- Verify table structure
DESCRIBE broadcasts;
-- Sample query to verify
SELECT id,
    subject,
    template_id,
    sent_by_name,
    sent_at,
    JSON_LENGTH(recipient_user_ids) as recipient_count
FROM broadcasts
ORDER BY sent_at DESC
LIMIT 5;