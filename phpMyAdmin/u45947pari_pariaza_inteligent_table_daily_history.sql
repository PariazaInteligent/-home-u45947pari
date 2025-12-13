
-- --------------------------------------------------------

--
-- Structură tabel pentru tabel `daily_history`
--

CREATE TABLE `daily_history` (
  `id` int UNSIGNED NOT NULL,
  `day` date NOT NULL,
  `profit_cents` bigint NOT NULL DEFAULT '0',
  `deposit_cents` bigint NOT NULL DEFAULT '0',
  `withdraw_cents` bigint NOT NULL DEFAULT '0',
  `bank_balance_cents` bigint NOT NULL DEFAULT '0',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
