
-- --------------------------------------------------------

--
-- Structură tabel pentru tabel `user_daily_balances`
--

CREATE TABLE `user_daily_balances` (
  `id` bigint UNSIGNED NOT NULL,
  `user_id` bigint UNSIGNED NOT NULL,
  `day` date NOT NULL,
  `opening_balance_cents` bigint NOT NULL DEFAULT '0',
  `closing_balance_cents` bigint NOT NULL DEFAULT '0',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
