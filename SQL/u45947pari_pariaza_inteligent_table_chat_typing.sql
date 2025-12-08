
-- --------------------------------------------------------

--
-- Structură tabel pentru tabel `chat_typing`
--

CREATE TABLE `chat_typing` (
  `user_id` bigint UNSIGNED NOT NULL,
  `user_name` varchar(120) NOT NULL,
  `room` varchar(64) NOT NULL DEFAULT 'global',
  `until_ts` timestamp NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Eliminarea datelor din tabel `chat_typing`
--

INSERT INTO `chat_typing` (`user_id`, `user_name`, `room`, `until_ts`) VALUES
(7, 'Mihaita', 'global', '2025-12-07 22:43:53'),
(8, 'test', 'global', '2025-12-07 22:43:08');
