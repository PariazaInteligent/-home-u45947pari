
-- --------------------------------------------------------

--
-- Structură tabel pentru tabel `profit_distributions`
--

CREATE TABLE `profit_distributions` (
  `id` int NOT NULL,
  `bet_group_id` int NOT NULL,
  `user_id` int NOT NULL,
  `amount_cents` int NOT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Eliminarea datelor din tabel `profit_distributions`
--

INSERT INTO `profit_distributions` (`id`, `bet_group_id`, `user_id`, `amount_cents`, `created_at`) VALUES
(1, 1, 7, 9000, '2025-10-19 22:20:08'),
(2, 2, 7, -6900, '2025-10-20 21:45:43'),
(3, 3, 7, 4774, '2025-10-20 23:36:41'),
(4, 4, 7, 2815, '2025-10-22 21:54:53'),
(5, 6, 7, -4800, '2025-10-22 22:03:34'),
(8, 5, 7, 4018, '2025-10-25 23:55:48'),
(13, 7, 7, -4364, '2025-11-26 22:53:36'),
(14, 7, 8, -436, '2025-11-26 22:53:36'),
(15, 8, 7, 8182, '2025-11-26 22:55:32'),
(16, 8, 8, 818, '2025-11-26 22:55:32'),
(17, 9, 7, -227, '2025-11-27 20:23:22'),
(18, 9, 8, -23, '2025-11-27 20:23:22'),
(19, 10, 7, 5727, '2025-11-27 20:42:45'),
(20, 10, 8, 573, '2025-11-27 20:42:45');
