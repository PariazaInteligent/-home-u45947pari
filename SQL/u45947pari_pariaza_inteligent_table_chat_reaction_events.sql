
-- --------------------------------------------------------

--
-- Structură tabel pentru tabel `chat_reaction_events`
--

CREATE TABLE `chat_reaction_events` (
  `id` bigint NOT NULL,
  `message_id` bigint NOT NULL,
  `user_id` bigint NOT NULL,
  `emoji` varchar(16) NOT NULL,
  `active` tinyint(1) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Eliminarea datelor din tabel `chat_reaction_events`
--

INSERT INTO `chat_reaction_events` (`id`, `message_id`, `user_id`, `emoji`, `active`, `created_at`) VALUES
(1, 53, 7, '🔥', 1, '2025-11-09 20:36:10'),
(2, 53, 7, '👍', 1, '2025-11-09 20:36:58'),
(3, 53, 7, '🙂', 1, '2025-11-09 20:36:59'),
(4, 53, 7, '🔥', 0, '2025-11-09 20:37:23'),
(5, 53, 7, '🙂', 0, '2025-11-09 20:37:25'),
(6, 54, 7, '🙂', 1, '2025-11-09 20:38:15'),
(7, 52, 7, '🔥', 1, '2025-11-09 20:38:18'),
(8, 56, 7, '🙂', 1, '2025-11-09 20:55:06'),
(9, 56, 7, '🙂', 0, '2025-11-09 20:55:15'),
(10, 55, 7, '🙂', 1, '2025-11-09 20:55:23'),
(11, 56, 7, '🔥', 1, '2025-11-09 20:55:59');
