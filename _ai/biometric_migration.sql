-- Migration: Add Biometric Login Fields to Users Table
-- Date: 2026-01-10
-- Description: Adaugă câmpuri pentru funcționalitatea Login Biometric (WebAuthn/FIDO2)
ALTER TABLE `users`
ADD COLUMN `biometric_enabled` BOOLEAN NOT NULL DEFAULT false
AFTER `last_checkin_at`,
    ADD COLUMN `biometric_public_key` TEXT NULL
AFTER `biometric_enabled`,
    ADD COLUMN `biometric_challenge` VARCHAR(255) NULL
AFTER `biometric_public_key`,
    ADD COLUMN `biometric_last_used` DATETIME NULL
AFTER `biometric_challenge`;
-- Verificare câmpuri adăugate
SELECT COLUMN_NAME,
    DATA_TYPE,
    IS_NULLABLE,
    COLUMN_DEFAULT
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_NAME = 'users'
    AND COLUMN_NAME LIKE 'biometric%';