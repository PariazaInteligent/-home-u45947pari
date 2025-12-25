-- CreateTable: Add withdrawal fees fields
ALTER TABLE `withdrawals` 
  ADD COLUMN `amount_requested` DECIMAL(15, 2) NOT NULL DEFAULT 0 AFTER `amount`,
  ADD COLUMN `fee_fixed_pct` DECIMAL(5, 5) NOT NULL DEFAULT 0.015 AFTER `amount_requested`,
  ADD COLUMN `fee_surge_pct` DECIMAL(5, 5) NOT NULL DEFAULT 0 AFTER `fee_fixed_pct`,
  ADD COLUMN `fee_fixed_amount` DECIMAL(15, 2) NOT NULL DEFAULT 0 AFTER `fee_surge_pct`,
  ADD COLUMN `fee_surge_amount` DECIMAL(15, 2) NOT NULL DEFAULT 0 AFTER `fee_fixed_amount`,
  ADD COLUMN `fee_total_amount` DECIMAL(15, 2) NOT NULL DEFAULT 0 AFTER `fee_surge_amount`,
  ADD COLUMN `amount_payout` DECIMAL(15, 2) NOT NULL DEFAULT 0 AFTER `fee_total_amount`,
  ADD COLUMN `surge_reasons` JSON NULL AFTER `amount_payout`,
  ADD COLUMN `surge_snapshot` JSON NULL AFTER `surge_reasons`,
  ADD COLUMN `fee_locked_at` DATETIME(3) NULL AFTER `surge_snapshot`;
