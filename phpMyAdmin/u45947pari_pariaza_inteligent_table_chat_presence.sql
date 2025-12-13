
-- --------------------------------------------------------

--
-- Structură tabel pentru tabel `chat_presence`
--

CREATE TABLE `chat_presence` (
  `user_id` bigint UNSIGNED NOT NULL,
  `user_name` varchar(120) NOT NULL,
  `room` varchar(64) NOT NULL DEFAULT 'global',
  `last_seen` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Eliminarea datelor din tabel `chat_presence`
--

INSERT INTO `chat_presence` (`user_id`, `user_name`, `room`, `last_seen`) VALUES
(7, 'Mihaita', 'global', '2025-12-08 19:09:15'),
(8, 'test', 'global', '2025-12-08 19:09:18');
