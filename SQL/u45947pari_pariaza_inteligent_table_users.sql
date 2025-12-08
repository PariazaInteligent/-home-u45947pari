
-- --------------------------------------------------------

--
-- Structură tabel pentru tabel `users`
--

CREATE TABLE `users` (
  `id` bigint UNSIGNED NOT NULL,
  `email` varchar(190) COLLATE utf8mb4_unicode_ci NOT NULL,
  `user_handle` varbinary(64) DEFAULT NULL,
  `name` varchar(120) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `password_hash` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `role` enum('USER','ADMIN') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'USER',
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `email_verified_at` datetime DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `payout_name` varchar(190) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `payout_iban` varchar(64) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `payout_bic` varchar(32) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `payout_currency` char(3) COLLATE utf8mb4_unicode_ci DEFAULT 'EUR'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Eliminarea datelor din tabel `users`
--

INSERT INTO `users` (`id`, `email`, `user_handle`, `name`, `password_hash`, `role`, `is_active`, `email_verified_at`, `created_at`, `updated_at`, `payout_name`, `payout_iban`, `payout_bic`, `payout_currency`) VALUES
(1, 'admin@pariazainteligent.ro', NULL, NULL, '$2y$12$bSoSLr068Jt5bStcKJSHmevv6HwtEW6kDB0TDTzp9EfgJbiHjN3vu', 'ADMIN', 1, NULL, '2025-10-12 20:01:26', '2025-10-12 20:02:34', NULL, NULL, NULL, 'EUR'),
(7, 'tomizeimihaita@gmail.com', NULL, 'Mihaita', '$2y$12$401UhE5tFjAv/VEI4JS5Ue91t7rv7LldSmHCFe0V4yio6Mv0lG1Bm', 'USER', 1, '2025-10-12 23:24:09', '2025-10-12 23:24:09', '2025-10-16 22:05:41', NULL, NULL, NULL, 'EUR'),
(8, 'test@test.com', NULL, 'test', '$2y$12$i1qZ6.W.fYzxydCk.UmoverCfL.4ddzsyU0RcoaiB6T6Ebg98nAVu', 'USER', 1, '2025-10-12 23:24:09', '2025-10-12 23:24:09', '2025-10-25 23:46:07', NULL, NULL, NULL, 'EUR');
