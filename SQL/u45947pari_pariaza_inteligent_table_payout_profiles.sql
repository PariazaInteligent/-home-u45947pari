
-- --------------------------------------------------------

--
-- Structură tabel pentru tabel `payout_profiles`
--

CREATE TABLE `payout_profiles` (
  `user_id` bigint UNSIGNED NOT NULL,
  `holder_name` varchar(128) NOT NULL,
  `iban` varchar(34) NOT NULL,
  `country_code` char(2) GENERATED ALWAYS AS (substr(`iban`,1,2)) STORED,
  `currency` char(3) DEFAULT 'EUR',
  `verified` tinyint(1) DEFAULT '0',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Eliminarea datelor din tabel `payout_profiles`
--

INSERT INTO `payout_profiles` (`user_id`, `holder_name`, `iban`, `currency`, `verified`, `created_at`, `updated_at`) VALUES
(7, 'Tomozei Mihaita', 'BE76967182285695', 'EUR', 0, '2025-10-30 18:01:17', '2025-10-30 18:24:31');
