-- Broadcast Analytics Tables
-- Manual creation for Prisma 7 compatibility
-- Table 1: broadcast_analytics (aggregated metrics per broadcast)
CREATE TABLE IF NOT EXISTS broadcast_analytics (
    id VARCHAR(191) PRIMARY KEY,
    template_id VARCHAR(50) NOT NULL,
    broadcast_subject VARCHAR(255),
    sent_at DATETIME NOT NULL,
    recipient_count INT DEFAULT 0,
    opened_count INT DEFAULT 0,
    clicked_count INT DEFAULT 0,
    converted_count INT DEFAULT 0,
    avg_open_time_minutes INT,
    engagement_score DECIMAL(5, 2) DEFAULT 0.00,
    metadata JSON,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_template_sent (template_id, sent_at),
    INDEX idx_sent_at (sent_at)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;
-- Table 2: broadcast_events (granular event tracking)
CREATE TABLE IF NOT EXISTS broadcast_events (
    id VARCHAR(191) PRIMARY KEY,
    analytics_id VARCHAR(191) NOT NULL,
    user_id VARCHAR(191) NOT NULL,
    event_type ENUM('SENT', 'OPENED', 'CLICKED', 'CONVERTED') NOT NULL,
    occurred_at DATETIME NOT NULL,
    metadata JSON,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (analytics_id) REFERENCES broadcast_analytics(id) ON DELETE CASCADE,
    INDEX idx_analytics_event (analytics_id, event_type),
    INDEX idx_user_event (user_id, event_type),
    INDEX idx_occurred (occurred_at)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;