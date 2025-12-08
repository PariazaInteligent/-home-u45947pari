
-- --------------------------------------------------------

--
-- Structură tabel pentru tabel `bet_allocations`
--

CREATE TABLE `bet_allocations` (
  `id` int NOT NULL,
  `bet_group_id` int NOT NULL,
  `user_id` int NOT NULL,
  `percent` decimal(8,5) NOT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Eliminarea datelor din tabel `bet_allocations`
--

INSERT INTO `bet_allocations` (`id`, `bet_group_id`, `user_id`, `percent`, `created_at`) VALUES
(1, 1, 7, 1.00000, '2025-10-19 22:18:58'),
(2, 2, 7, 1.00000, '2025-10-20 12:45:00'),
(3, 3, 7, 1.00000, '2025-10-20 23:36:10'),
(4, 4, 7, 1.00000, '2025-10-22 21:53:01'),
(5, 5, 7, 1.00000, '2025-10-22 22:01:19'),
(6, 6, 7, 1.00000, '2025-10-22 22:02:53'),
(7, 7, 7, 0.90909, '2025-10-26 00:09:18'),
(8, 7, 8, 0.09091, '2025-10-26 00:09:18'),
(9, 8, 7, 0.90909, '2025-11-26 22:54:50'),
(10, 8, 8, 0.09091, '2025-11-26 22:54:50'),
(11, 9, 7, 0.90909, '2025-11-27 20:22:54'),
(12, 9, 8, 0.09091, '2025-11-27 20:22:54'),
(13, 10, 7, 0.90909, '2025-11-27 20:42:32'),
(14, 10, 8, 0.09091, '2025-11-27 20:42:32');
