-- Migration: Add trade transparency fields
-- Created automatically by implementation
-- Adds bookmaker, betCode, and eventStartTime to trades table
ALTER TABLE `trades`
ADD COLUMN `bookmaker` VARCHAR(100) NULL
AFTER `ledgerEntryId`,
    ADD COLUMN `betCode` VARCHAR(255) NULL
AFTER `bookmaker`,
    ADD COLUMN `eventStartTime` DATETIME NULL
AFTER `betCode`;
-- Add index for eventStartTime for better query performance
CREATE INDEX `idx_trades_eventStartTime` ON `trades`(`eventStartTime`);