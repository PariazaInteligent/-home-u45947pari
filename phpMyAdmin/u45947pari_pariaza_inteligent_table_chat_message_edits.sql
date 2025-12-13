
-- --------------------------------------------------------

--
-- Structură tabel pentru tabel `chat_message_edits`
--

CREATE TABLE `chat_message_edits` (
  `message_id` bigint UNSIGNED NOT NULL,
  `edited_at` datetime NOT NULL,
  `editor_id` bigint DEFAULT NULL,
  `editor_name` varchar(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Eliminarea datelor din tabel `chat_message_edits`
--

INSERT INTO `chat_message_edits` (`message_id`, `edited_at`, `editor_id`, `editor_name`) VALUES
(143, '2025-11-22 20:48:42', 7, 'Mihaita');
