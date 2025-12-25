-- Fix updated_at column to handle default and auto-update
ALTER TABLE `users` 
MODIFY COLUMN `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP;
