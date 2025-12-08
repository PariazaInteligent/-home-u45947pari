
-- --------------------------------------------------------

--
-- Structură tabel pentru tabel `withdrawal_requests`
--

CREATE TABLE `withdrawal_requests` (
  `id` bigint UNSIGNED NOT NULL,
  `user_id` bigint UNSIGNED NOT NULL,
  `amount_cents` int UNSIGNED NOT NULL,
  `fee_cents` int UNSIGNED NOT NULL DEFAULT '0',
  `fee_rate` decimal(6,4) NOT NULL DEFAULT '0.0000',
  `fee_mode` enum('on_top','from_amount') NOT NULL DEFAULT 'on_top',
  `method` varchar(32) NOT NULL DEFAULT 'bank-transfer',
  `status` enum('pending','approved','rejected','canceled') NOT NULL DEFAULT 'pending',
  `note` varchar(255) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT NULL,
  `processed_at` datetime DEFAULT NULL,
  `payout_provider` varchar(32) DEFAULT NULL,
  `payout_reference` varchar(190) DEFAULT NULL,
  `payout_status` enum('queued','sent','failed') DEFAULT NULL,
  `payout_error` text
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Eliminarea datelor din tabel `withdrawal_requests`
--

INSERT INTO `withdrawal_requests` (`id`, `user_id`, `amount_cents`, `fee_cents`, `fee_rate`, `fee_mode`, `method`, `status`, `note`, `created_at`, `updated_at`, `processed_at`, `payout_provider`, `payout_reference`, `payout_status`, `payout_error`) VALUES
(1, 7, 10000, 184, 0.0134, 'on_top', 'bank-transfer', 'rejected', NULL, '2025-10-26 21:45:44', NULL, '2025-10-27 21:23:49', NULL, NULL, NULL, NULL),
(2, 7, 43, 51, 0.0134, 'on_top', 'bank-transfer', 'approved', NULL, '2025-10-27 19:50:08', NULL, '2025-10-27 21:51:33', NULL, NULL, NULL, NULL),
(3, 7, 49, 51, 0.0134, 'on_top', 'bank-transfer', 'rejected', NULL, '2025-10-27 20:20:16', NULL, '2025-10-30 17:15:57', NULL, NULL, NULL, NULL),
(4, 7, 1000, 63, 0.0134, 'on_top', 'bank-transfer', 'rejected', NULL, '2025-10-30 16:02:34', NULL, '2025-10-30 18:03:45', NULL, NULL, NULL, NULL),
(5, 7, 1000, 63, 0.0134, 'on_top', 'bank-transfer', 'rejected', NULL, '2025-10-30 16:04:07', NULL, '2025-10-30 18:05:59', NULL, NULL, NULL, NULL),
(6, 7, 1000, 63, 0.0134, 'on_top', 'bank-transfer', 'approved', NULL, '2025-10-30 16:25:22', NULL, '2025-10-30 20:11:05', 'bank-api', 'SIM-dc318430', 'sent', NULL),
(7, 7, 1000, 63, 0.0134, 'on_top', 'bank-transfer', 'approved', NULL, '2025-10-30 18:12:49', NULL, '2025-10-30 20:33:11', 'bank-api', 'PI-3d4b79c0', 'sent', NULL),
(8, 7, 1000, 85, 0.0350, 'on_top', 'bank-transfer', 'approved', NULL, '2025-10-31 05:32:06', NULL, '2025-11-07 21:23:31', 'bank-api', 'PI-7d9d465a', 'sent', NULL),
(9, 7, 1000, 85, 0.0350, 'on_top', 'bank-transfer', 'approved', NULL, '2025-11-07 19:22:26', NULL, '2025-11-07 21:23:27', 'bank-api', 'PI-e25112cb', 'sent', NULL),
(10, 7, 1000, 85, 0.0350, 'on_top', 'bank-transfer', 'approved', NULL, '2025-11-07 19:34:11', NULL, '2025-11-27 19:31:30', 'bank-api', 'PI-da0ea8fb', 'sent', NULL);
