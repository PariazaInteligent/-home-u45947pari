-- Drop old column and add new columns with enums
ALTER TABLE `users` DROP COLUMN IF EXISTS `profile_picture_url`,
    MODIFY COLUMN `gender` ENUM('MALE', 'FEMALE', 'NEUTRAL') NOT NULL DEFAULT 'NEUTRAL',
    ADD COLUMN `avatar_type` ENUM('DEFAULT', 'CUSTOM') NOT NULL DEFAULT 'DEFAULT'
AFTER `gender`,
    ADD COLUMN `avatar_url` TEXT NULL
AFTER `avatar_type`;