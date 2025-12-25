-- CreateTable
CREATE TABLE `invitation_codes` (
    `id` VARCHAR(191) NOT NULL,
    `code` VARCHAR(191) NOT NULL,
    `createdBy` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `expiresAt` DATETIME(3) NULL,
    `maxUses` INTEGER NOT NULL DEFAULT 1,
    `usedCount` INTEGER NOT NULL DEFAULT 0,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    UNIQUE INDEX `invitation_codes_code_key`(`code`),
    INDEX `invitation_codes_code_idx`(`code`),
    INDEX `invitation_codes_createdBy_idx`(`createdBy`),
    INDEX `invitation_codes_isActive_idx`(`isActive`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
-- AlterTable
ALTER TABLE `users`
ADD COLUMN `referred_by` VARCHAR(191) NULL,
    ADD COLUMN `invitation_code_used` VARCHAR(191) NULL;
-- CreateIndex
CREATE INDEX `users_referred_by_idx` ON `users`(`referred_by`);
-- AddForeignKey
ALTER TABLE `users`
ADD CONSTRAINT `users_referred_by_fkey` FOREIGN KEY (`referred_by`) REFERENCES `users`(`id`) ON DELETE
SET NULL ON UPDATE CASCADE;
-- AddForeignKey
ALTER TABLE `users`
ADD CONSTRAINT `users_invitation_code_used_fkey` FOREIGN KEY (`invitation_code_used`) REFERENCES `invitation_codes`(`code`) ON UPDATE CASCADE;
-- AddForeignKey
ALTER TABLE `invitation_codes`
ADD CONSTRAINT `invitation_codes_createdBy_fkey` FOREIGN KEY (`createdBy`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;