
-- --------------------------------------------------------

--
-- Structură tabel pentru tabel `opening_balance_cents`
--

CREATE TABLE `opening_balance_cents` (
  `id` bigint UNSIGNED NOT NULL,
  `user_id` bigint UNSIGNED NOT NULL,
  `period_start` datetime NOT NULL,
  `opening_balance_cents` bigint NOT NULL,
  `note` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Eliminarea datelor din tabel `opening_balance_cents`
--

INSERT INTO `opening_balance_cents` (`id`, `user_id`, `period_start`, `opening_balance_cents`, `note`, `created_at`) VALUES
(1, 7, '2025-10-20 00:00:00', 109000, NULL, '2025-10-20 18:27:49'),
(2, 7, '2025-10-19 18:27:52', 100000, NULL, '2025-10-20 18:27:52'),
(3, 7, '2025-10-14 00:00:00', 0, NULL, '2025-10-20 18:27:56'),
(4, 7, '2025-09-21 00:00:00', 0, NULL, '2025-10-20 18:28:03'),
(5, 7, '2025-10-19 18:28:08', 100000, NULL, '2025-10-20 18:28:08'),
(6, 7, '1970-01-01 00:00:00', 0, NULL, '2025-10-20 18:33:10'),
(7, 7, '2025-10-19 18:33:21', 100000, NULL, '2025-10-20 18:33:21'),
(8, 7, '2025-10-19 18:33:38', 100000, NULL, '2025-10-20 18:33:38'),
(9, 7, '2025-10-01 00:00:00', 0, NULL, '2025-10-20 18:34:01'),
(10, 7, '2025-10-19 18:34:18', 100000, NULL, '2025-10-20 18:34:18'),
(11, 7, '2025-10-19 18:38:19', 100000, NULL, '2025-10-20 18:38:19'),
(12, 7, '2025-10-19 18:38:41', 100000, NULL, '2025-10-20 18:38:41'),
(13, 7, '2025-01-01 00:00:00', 0, NULL, '2025-10-20 18:39:22'),
(14, 7, '2025-10-19 18:49:21', 100000, NULL, '2025-10-20 18:49:21'),
(15, 7, '2025-10-19 18:53:16', 100000, NULL, '2025-10-20 18:53:16'),
(16, 7, '2025-10-19 18:58:53', 100000, NULL, '2025-10-20 18:58:53'),
(17, 7, '2025-10-19 19:00:18', 100000, NULL, '2025-10-20 19:00:18');
