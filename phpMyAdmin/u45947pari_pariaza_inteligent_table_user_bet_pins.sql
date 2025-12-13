
-- --------------------------------------------------------

--
-- Structură tabel pentru tabel `user_bet_pins`
--

CREATE TABLE `user_bet_pins` (
  `user_id` bigint UNSIGNED NOT NULL,
  `bet_group_id` int NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Eliminarea datelor din tabel `user_bet_pins`
--

INSERT INTO `user_bet_pins` (`user_id`, `bet_group_id`, `created_at`) VALUES
(1, 4, '2025-11-26 20:53:07'),
(1, 5, '2025-10-26 17:51:56'),
(1, 6, '2025-10-26 17:58:52'),
(1, 7, '2025-10-26 17:52:32'),
(7, 1, '2025-10-26 17:42:22'),
(7, 5, '2025-10-26 19:40:55'),
(7, 7, '2025-11-27 17:44:02');
