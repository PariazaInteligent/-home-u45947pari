
-- --------------------------------------------------------

--
-- Structură tabel pentru tabel `ledger_tx`
--

CREATE TABLE `ledger_tx` (
  `id` bigint UNSIGNED NOT NULL,
  `user_id` bigint UNSIGNED NOT NULL,
  `kind` enum('DEPOSIT','WITHDRAWAL_REQUEST','WITHDRAWAL','ADJUSTMENT') NOT NULL,
  `status` enum('PENDING','APPROVED','REJECTED','CANCELED','SETTLED') DEFAULT NULL,
  `amount_cents` int NOT NULL,
  `method` varchar(64) DEFAULT NULL,
  `meta` json DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Eliminarea datelor din tabel `ledger_tx`
--

INSERT INTO `ledger_tx` (`id`, `user_id`, `kind`, `status`, `amount_cents`, `method`, `meta`, `created_at`) VALUES
(1, 7, 'WITHDRAWAL_REQUEST', 'CANCELED', 10184, 'bank-transfer', '{\"fee_mode\": \"on_top\", \"reversal\": 1, \"fee_cents\": \"184\", \"request_id\": \"1\"}', '2025-10-27 21:23:49'),
(2, 7, 'WITHDRAWAL', 'APPROVED', 0, 'bank-transfer', '{\"fee_mode\": \"on_top\", \"fee_cents\": \"51\", \"request_id\": \"2\"}', '2025-10-27 21:51:33'),
(3, 7, 'WITHDRAWAL_REQUEST', 'REJECTED', 100, 'bank-transfer', '{\"request_id\": \"3\"}', '2025-10-30 17:15:57'),
(4, 7, 'WITHDRAWAL_REQUEST', 'REJECTED', 1063, 'bank-transfer', '{\"request_id\": \"4\"}', '2025-10-30 18:03:45'),
(5, 7, 'WITHDRAWAL_REQUEST', 'REJECTED', 1063, 'bank-transfer', '{\"request_id\": \"5\"}', '2025-10-30 18:05:59'),
(6, 7, 'WITHDRAWAL', 'APPROVED', 0, 'bank-transfer', '{\"request_id\": \"6\", \"payout_reference\": \"SIM-dc318430\"}', '2025-10-30 20:11:05'),
(7, 7, 'WITHDRAWAL', 'APPROVED', 0, 'bank-transfer', '{\"request_id\": \"7\", \"payout_reference\": \"PI-3d4b79c0\"}', '2025-10-30 20:33:11'),
(8, 7, 'WITHDRAWAL', 'APPROVED', 0, 'bank-transfer', '{\"request_id\": \"9\", \"payout_reference\": \"PI-e25112cb\"}', '2025-11-07 21:23:27'),
(9, 7, 'WITHDRAWAL', 'APPROVED', 0, 'bank-transfer', '{\"request_id\": \"8\", \"payout_reference\": \"PI-7d9d465a\"}', '2025-11-07 21:23:31'),
(10, 7, 'WITHDRAWAL', 'APPROVED', 0, 'bank-transfer', '{\"request_id\": \"10\", \"payout_reference\": \"PI-da0ea8fb\"}', '2025-11-27 19:31:30');
