
-- --------------------------------------------------------

--
-- Structură tabel pentru tabel `user_goals`
--

CREATE TABLE `user_goals` (
  `id` bigint UNSIGNED NOT NULL,
  `user_id` bigint UNSIGNED NOT NULL,
  `target_balance_cents` int UNSIGNED NOT NULL DEFAULT '0',
  `target_profit_quarter_cents` int UNSIGNED NOT NULL DEFAULT '0',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Eliminarea datelor din tabel `user_goals`
--

INSERT INTO `user_goals` (`id`, `user_id`, `target_balance_cents`, `target_profit_quarter_cents`, `created_at`, `updated_at`) VALUES
(1, 7, 120000, 20000, '2025-10-22 17:12:22', '2025-12-01 20:40:01');
