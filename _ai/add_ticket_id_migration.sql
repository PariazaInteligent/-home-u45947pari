-- Migration: Add ticket_id column to users table
-- Date: 2025-12-25
-- Description: Add ticketId field for tracking pending verification requests
ALTER TABLE `users`
ADD COLUMN `ticket_id` VARCHAR(191) NULL
AFTER `status`;
-- Optional: Add index for faster lookups
CREATE INDEX `idx_users_ticket_id` ON `users`(`ticket_id`);