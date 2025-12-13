
-- --------------------------------------------------------

--
-- Structură tabel pentru tabel `bet_groups`
--

CREATE TABLE `bet_groups` (
  `id` int NOT NULL,
  `group_uid` varchar(50) DEFAULT NULL,
  `event` varchar(255) NOT NULL,
  `sport` varchar(100) DEFAULT NULL,
  `league_name` varchar(120) DEFAULT NULL,
  `selection_name` varchar(255) DEFAULT NULL,
  `odds` decimal(6,2) NOT NULL,
  `stake_cents` int NOT NULL,
  `currency` varchar(10) DEFAULT 'eur',
  `event_at` datetime NOT NULL,
  `notes` text,
  `status` enum('pending','won','lost','void','half_won','half_lost') DEFAULT 'pending',
  `score` varchar(50) DEFAULT NULL,
  `profit_net_cents` int DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Eliminarea datelor din tabel `bet_groups`
--

INSERT INTO `bet_groups` (`id`, `group_uid`, `event`, `sport`, `league_name`, `selection_name`, `odds`, `stake_cents`, `currency`, `event_at`, `notes`, `status`, `score`, `profit_net_cents`, `created_at`, `updated_at`) VALUES
(1, '1', 'Romania - Italia', 'Fotbal', 'UEFA', 'Romania castiga', 2.00, 10000, 'eur', '2025-10-19 21:18:00', 'note test', 'won', '2-1', 9000, '2025-10-19 22:18:58', '2025-10-19 22:20:08'),
(2, '2', 'BC Zenit Saint Petersburg - Uralmash Ekaterinburg', 'Baschet', 'VTB United League 2025/2026', 'Under 166.5', 1.90, 6900, 'eur', '2025-10-20 12:45:00', '', 'lost', '91 : 86', -6900, '2025-10-20 12:45:00', '2025-10-20 12:45:00'),
(3, '3', 'Bordo Sportif RS - Cayirova Belediyesi', 'Baschet', 'TBL 2025/2026', 'Asian hcp -1.5 (Cayirova Belediyesi)', 2.04, 5100, 'eur', '2025-10-20 19:00:00', '', 'won', '63 : 77', 4774, '2025-10-20 23:36:10', '2025-10-20 23:36:41'),
(4, '4', 'Arka Gdynia (W) - USK Praha (W)', 'Baschet', 'Euroleague Women 2025/2026', 'Asian hcp -8 (USK Praha (W)) - 1st Half', 1.92, 3400, 'eur', '2025-10-22 18:00:00', '', 'won', '51 : 97', 2815, '2025-10-22 21:53:01', '2025-10-22 21:54:53'),
(5, 'BG-2025-10-22-BBC2', 'Unics Kazan - BC Avtodor Saratov', 'Baschet', 'VTB United League 2025/2026', 'Over 161', 1.93, 4800, 'eur', '2025-10-22 22:59:00', '', 'won', NULL, 4018, '2025-10-22 22:01:19', '2025-10-25 23:55:48'),
(6, 'BG-2025-10-22-6595', 'Unics Kazan - BC Avtodor Saratov', 'Baschet', 'VTB United League 2025/2026', 'Over 161', 1.93, 4800, 'eur', '2025-10-22 19:00:00', '', 'lost', '87 : 68', -4800, '2025-10-22 22:02:53', '2025-10-22 22:03:34'),
(7, 'BG-2025-10-25-95C0', 'Legnano Basket - Fulgor Fidenza', 'Baschet', 'Serie B 2025/2026', 'Asian hcp -19.5 (Legnano Basket)', 1.97, 4800, 'eur', '2025-10-25 20:30:00', '', 'lost', '75 : 64', -4800, '2025-10-26 00:09:17', '2025-11-26 22:53:36'),
(8, 'BG-2025-11-26-3424', 'Romania - Italia', 'Fotbal', 'UEFA', 'Romania castiga', 2.00, 10000, 'eur', '2025-11-26 23:54:00', '', 'won', NULL, 9000, '2025-11-26 22:54:50', '2025-11-26 22:55:32'),
(9, 'BG-2025-11-27-2166', 'Prescot Cables - Hyde United FC', 'Fotbal', 'FA Cup 2025/2026', 'Peste 1.5 goluri', 2.00, 250, 'eur', '2025-11-27 21:22:00', '', 'lost', NULL, -250, '2025-11-27 20:22:54', '2025-11-27 20:23:22'),
(10, 'BG-2025-11-27-F722', 'Osasuna B - Ourense CF', 'Fotbal', 'Spain: Primera Federacion 2025/2026', 'Peste 1.5 goluri', 2.00, 7000, 'eur', '2025-11-27 21:41:00', '', 'won', NULL, 6300, '2025-11-27 20:42:32', '2025-11-27 20:42:45');
