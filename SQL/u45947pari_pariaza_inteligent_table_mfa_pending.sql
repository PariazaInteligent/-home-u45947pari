
-- --------------------------------------------------------

--
-- Structură tabel pentru tabel `mfa_pending`
--

CREATE TABLE `mfa_pending` (
  `id` bigint UNSIGNED NOT NULL,
  `ticket` varchar(64) COLLATE utf8mb4_unicode_ci NOT NULL,
  `user_id` bigint UNSIGNED NOT NULL,
  `code` varchar(10) COLLATE utf8mb4_unicode_ci NOT NULL,
  `expires_at` datetime NOT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
