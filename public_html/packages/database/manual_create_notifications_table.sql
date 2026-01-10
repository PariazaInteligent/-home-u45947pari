-- SQL Script to create broadcast_notifications table manually
-- Run this in MySQL database: u45947pari_pariaza_inteligent
CREATE TABLE IF NOT EXISTS `broadcast_notifications` (
    `id` VARCHAR(191) NOT NULL,
    `user_id` VARCHAR(191) NOT NULL,
    `type` VARCHAR(50) NOT NULL DEFAULT 'BROADCAST_OPPORTUNITY',
    `template_id` VARCHAR(50) NOT NULL,
    `title` VARCHAR(255) NOT NULL,
    `message` TEXT NOT NULL,
    `recipient_count` INT NOT NULL DEFAULT 0,
    `is_read` BOOLEAN NOT NULL DEFAULT false,
    `is_manual` BOOLEAN NOT NULL DEFAULT false,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `read_at` DATETIME(3) NULL,
    PRIMARY KEY (`id`),
    INDEX `broadcast_notifications_user_id_is_read_idx`(`user_id`, `is_read`),
    INDEX `broadcast_notifications_created_at_idx`(`created_at`),
    CONSTRAINT `broadcast_notifications_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;