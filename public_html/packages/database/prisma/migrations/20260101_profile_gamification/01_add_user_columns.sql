-- =====================================================
-- MIGRATION 1: Adăugare coloane în users pentru gamification
-- =====================================================
-- Rulează în phpMyAdmin (copie/paste direct)
ALTER TABLE `users`
ADD COLUMN `streak_days` INT NOT NULL DEFAULT 0 COMMENT 'Consecutive daily check-ins'
AFTER `avatar_url`,
    ADD COLUMN `loyalty_points` INT NOT NULL DEFAULT 0 COMMENT 'Gamification points'
AFTER `streak_days`,
    ADD COLUMN `tier` ENUM('ENTRY', 'INVESTOR', 'PRO', 'WHALE') NOT NULL DEFAULT 'ENTRY' COMMENT 'Investment tier'
AFTER `loyalty_points`,
    ADD COLUMN `clearance_level` INT NOT NULL DEFAULT 1 COMMENT 'Access level (1-5)'
AFTER `tier`,
    ADD COLUMN `last_checkin_at` DATETIME NULL COMMENT 'Last daily checkin timestamp'
AFTER `clearance_level`;
-- Index pentru optimizare queries
CREATE INDEX `idx_users_tier` ON `users`(`tier`);
CREATE INDEX `idx_users_last_checkin` ON `users`(`last_checkin_at`);