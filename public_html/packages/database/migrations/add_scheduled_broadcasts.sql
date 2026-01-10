-- Sprint 3: Scheduled Broadcasts - Database Migration
-- Add scheduling capabilities to broadcasts table
-- Step 1: Add new columns for scheduling
ALTER TABLE broadcasts
ADD COLUMN status ENUM('DRAFT', 'SCHEDULED', 'SENT', 'CANCELLED') DEFAULT 'SENT' COMMENT 'Broadcast status for scheduling workflow',
    ADD COLUMN scheduled_for DATETIME NULL COMMENT 'When the broadcast should be sent (NULL for immediate sends)',
    ADD COLUMN created_at DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT 'When the broadcast was created',
    ADD COLUMN updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Last update timestamp';
-- Step 2: Update existing broadcasts to have SENT status
UPDATE broadcasts
SET status = 'SENT'
WHERE status IS NULL
    OR status = '';
-- Step 3: Create index for scheduler performance
-- This index optimizes the cron job query: WHERE status='SCHEDULED' AND scheduled_for <= NOW()
CREATE INDEX idx_scheduled_broadcasts ON broadcasts(status, scheduled_for);
-- Step 4: Verify migration
SELECT COLUMN_NAME,
    COLUMN_TYPE,
    COLUMN_DEFAULT,
    IS_NULLABLE,
    COLUMN_COMMENT
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_NAME = 'broadcasts'
    AND COLUMN_NAME IN (
        'status',
        'scheduled_for',
        'created_at',
        'updated_at'
    )
ORDER BY ORDINAL_POSITION;
-- Expected result: 4 new columns visible