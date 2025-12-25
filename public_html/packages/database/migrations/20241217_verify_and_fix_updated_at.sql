-- Verify and fix updated_at column (comprehensive)
-- Run this to check current state and fix if needed

-- First, show current definition
SHOW CREATE TABLE users;

-- Then apply fix (run this if updated_at doesn't have proper defaults)
ALTER TABLE `users` 
MODIFY COLUMN `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP;

-- Verify after fix
DESCRIBE users;
