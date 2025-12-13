
-- --------------------------------------------------------

--
-- Structură tabel pentru tabel `rate_limits`
--

CREATE TABLE `rate_limits` (
  `id` bigint UNSIGNED NOT NULL,
  `action` varchar(50) NOT NULL,
  `key_hash` char(64) NOT NULL,
  `period_start` datetime NOT NULL,
  `cnt` int UNSIGNED NOT NULL DEFAULT '0',
  `last_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Eliminarea datelor din tabel `rate_limits`
--

INSERT INTO `rate_limits` (`id`, `action`, `key_hash`, `period_start`, `cnt`, `last_at`) VALUES
(1, 'register', '7a53b49bb09420ede6d66c64a60535bafed2e83c4439564e68a66272890b0820', '2025-10-12 19:20:00', 1, '2025-10-12 22:27:01'),
(2, 'register', '7a53b49bb09420ede6d66c64a60535bafed2e83c4439564e68a66272890b0820', '2025-10-12 19:30:00', 2, '2025-10-12 22:35:44'),
(4, 'magic_start', '7a53b49bb09420ede6d66c64a60535bafed2e83c4439564e68a66272890b0820', '2025-10-12 20:30:00', 2, '2025-10-12 23:36:32'),
(6, 'magic_start', '7a53b49bb09420ede6d66c64a60535bafed2e83c4439564e68a66272890b0820', '2025-10-12 20:40:00', 3, '2025-10-12 23:48:12'),
(9, 'magic_start', '7a53b49bb09420ede6d66c64a60535bafed2e83c4439564e68a66272890b0820', '2025-10-12 20:50:00', 2, '2025-10-12 23:54:54');
