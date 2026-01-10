-- AlterTable
ALTER TABLE `users`
ADD COLUMN `gender` VARCHAR(10) NULL DEFAULT 'female',
    ADD COLUMN `profile_picture_url` TEXT NULL;