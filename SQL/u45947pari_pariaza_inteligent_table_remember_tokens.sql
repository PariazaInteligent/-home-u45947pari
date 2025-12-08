
-- --------------------------------------------------------

--
-- Structură tabel pentru tabel `remember_tokens`
--

CREATE TABLE `remember_tokens` (
  `id` bigint UNSIGNED NOT NULL,
  `user_id` bigint UNSIGNED NOT NULL,
  `selector` varchar(64) COLLATE utf8mb4_unicode_ci NOT NULL,
  `validator_hash` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `expires_at` datetime NOT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `user_agent` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `ip` varchar(45) COLLATE utf8mb4_unicode_ci DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Eliminarea datelor din tabel `remember_tokens`
--

INSERT INTO `remember_tokens` (`id`, `user_id`, `selector`, `validator_hash`, `expires_at`, `created_at`, `user_agent`, `ip`) VALUES
(1, 1, 'FHvd7yzLdGNo', '$2y$12$u2.dX9F2x1je0tybamn8GufbNhadwCgMK4fBJNl0BOmAqUulpFoU6', '2025-11-11 19:02:34', '2025-10-12 20:02:34', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36', '109.52.51.216'),
(4, 1, 'H0TtMNnFtNnp', '$2y$12$sCvnEAMbkCZBke7ykPLycORi3Ec1GK9CQlRQI1O1RjpDco1QBn1/y', '2025-11-11 19:16:38', '2025-10-12 20:16:38', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36', '109.52.51.216'),
(24, 7, 'YyTWmmarrRBA', '$2y$12$0CigFcB1SQKWURTS60Ho9OOPx1YDdKpBqFIEdAcXePIcZfoMFXwk.', '2025-11-13 18:47:17', '2025-10-14 19:47:17', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36', '109.52.110.136'),
(26, 7, 'c91KQiQjMadX', '$2y$12$FCPVOY1rBLlv1D.c.uweS.AHdZoaBGlt8hFepWNfL.HXIFLhP/UPG', '2025-11-13 19:12:28', '2025-10-14 20:12:28', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36', '109.52.110.136'),
(27, 7, 'DjW-5E_4LdSG', '$2y$12$3wubl054Yc7cxaX2aNMLVOwt03LGh/Yx/vYL6VadC0yyuWD.mzbUK', '2025-11-13 19:24:21', '2025-10-14 20:24:21', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36', '109.52.110.136'),
(28, 7, 'giGZtz8ISBRQ', '$2y$12$TcuUTIpB8p56AW2oN7pY/eBk8SS/1jQR3xvaKOjyYjyxGpiCVipRq', '2025-11-13 19:25:40', '2025-10-14 20:25:40', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36', '109.52.110.136'),
(29, 7, 'fj_1CR9uJ3my', '$2y$12$nFL97zFez9j2Jvg1udaEA.idsrrplqPPGqMLW66.Occs0gy0IARm6', '2025-11-13 20:26:01', '2025-10-14 21:26:01', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36', '109.52.110.136'),
(30, 7, 'Hc6E931hE_Fa', '$2y$12$PWm9iiKNAX.RDBpEjMkN8.bRsVaw7pVNNmdRS9M6HEsTH9Ke1y9c6', '2025-11-14 05:32:03', '2025-10-15 06:32:03', 'Mozilla/5.0 (Android 15; Mobile; rv:143.0) Gecko/143.0 Firefox/143.0', '109.55.241.129'),
(31, 7, 'jl2QcKSfwes1', '$2y$12$5EstfBuJ57irGe3HAnd92u1M9C5/WOrnWDZguoLCLytB2PLzY7slK', '2025-11-15 19:52:43', '2025-10-16 20:52:43', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36', '109.52.103.151'),
(32, 7, 'h8Fdn0HOlJTp', '$2y$12$5wohiO//s0wYQRxGumTCdetrIBiMiSeCv3eAGtbLEZ9lOJgx11aEO', '2025-11-15 20:06:12', '2025-10-16 21:06:12', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36', '109.52.103.151'),
(33, 7, 'dalcc48l699s', '$2y$12$cTSjtS8wa37cKL2UpMFA8u4FbkV09MLgfChclZEYq7U8T8eQs8tVe', '2025-11-15 21:07:03', '2025-10-16 22:07:03', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36', '109.52.103.151'),
(34, 7, '6PH3TdWImR4m', '$2y$12$3L/XVBNNbqjV838ACPnNROsfRkf46tUOaUsCGsgtpgT79ZqlFEg1i', '2025-11-16 05:46:11', '2025-10-17 06:46:11', 'Mozilla/5.0 (Android 15; Mobile; rv:143.0) Gecko/143.0 Firefox/143.0', '2.195.134.25'),
(35, 7, 'knb3VL7vNNdM', '$2y$12$/BEsvwvOGfft99VFv0m9v.QbJL6pVE6TPzk/IIxNUbq3nBWm3smd6', '2025-11-16 19:41:05', '2025-10-17 20:41:05', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36', '109.55.228.159'),
(36, 7, 'CJr3iAhABV3v', '$2y$12$fKsqhV.xAzwZ4iMZ1ZmhxeAjfakzsD4E.NWsHahijxsdmS..KJauG', '2025-11-16 22:08:27', '2025-10-17 23:08:27', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36', '109.55.228.159'),
(37, 7, 'WoJ-XqH2dyNa', '$2y$12$8ZKppvRKaKOlXQcxZHq68ONqCn73gS/gUZ3nN4pdfnbbSvZ2hFNPy', '2025-11-17 21:27:08', '2025-10-18 22:27:08', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36', '217.201.20.175'),
(38, 7, '1bX_7IwccKZT', '$2y$12$DSwLCtUNzBP3SQ9RLq5T8eeYDJvvGMdZwslKzU6Ki2f42VT.K8VBS', '2025-11-17 23:22:38', '2025-10-19 00:22:38', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36', '217.201.20.175'),
(39, 7, 'OofDF7239nNn', '$2y$12$YJNgndLPy7EyexXjulX1XO3TG6XmsQ/obgzJtKnKVEn9IKfyB81My', '2025-11-17 23:49:47', '2025-10-19 00:49:47', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36', '217.201.20.175'),
(40, 7, 'UysJDfAb67jl', '$2y$12$H2ZCecS/YwIWw9pE0opmZODVEHtT3mNkYdyDsq9uDr1wmHx.XtC8C', '2025-11-18 02:11:51', '2025-10-19 03:11:51', 'Mozilla/5.0 (Android 15; Mobile; rv:144.0) Gecko/144.0 Firefox/144.0', '217.201.20.175'),
(41, 7, 'c0JAbwvtXaGJ', '$2y$12$QEuUKTOsyJNT5Gfj2a.4k.R0HuA6HXgjdQZ1gq.ugpowSp/9FV14a', '2025-11-18 15:51:43', '2025-10-19 16:51:43', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36', '109.52.104.48'),
(42, 7, 'm63-SI4hEY1V', '$2y$12$XEOuNOXhdLykapovbt0tXeXRbEjWxdcbmGK9NQvSWZGA9mmwzk5xC', '2025-11-18 16:02:55', '2025-10-19 17:02:55', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36', '109.52.104.48'),
(43, 7, 'YIFPOuQ7Juru', '$2y$12$n6Y8/SjQXsaNoSud8OyQ2egIV.uLXY93uMe.h8kNFMSqQyNhsqlQq', '2025-11-18 20:03:19', '2025-10-19 21:03:19', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36', '109.52.104.48'),
(44, 1, '0WZiclmHeu3t', '$2y$12$BEnMn0LxuLaBaAuMBZdGBOE8dFLc9MVGp75cAA.uW7nDisrveiHPu', '2025-11-18 20:04:46', '2025-10-19 21:04:46', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36', '109.52.104.48'),
(45, 7, 'tZ192smo5dw1', '$2y$12$R2Z9aIpSi5CKJu2YBdwYiuIvBiiPcuBhGdjWpUM0isju7.XkOtz42', '2025-11-18 20:11:37', '2025-10-19 21:11:37', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36', '109.52.104.48'),
(46, 7, '-JzL4RMj6xgW', '$2y$12$tgHfsQstcZZ7heobd.CPYeCTvMbktpk6z51aIQmswV3.7Qh8ULNA6', '2025-11-18 20:36:37', '2025-10-19 21:36:37', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36', '109.52.104.48'),
(47, 1, 'vAir9mC3NVYJ', '$2y$12$g.DGotfqmXECOe1CMsVzKuLmEbmqJ9BEzFIZV5Ao5hxThxAFlsGbW', '2025-11-18 21:17:09', '2025-10-19 22:17:09', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36', '109.52.104.48'),
(48, 7, 'lbfN_rgdmONO', '$2y$12$fGwtvMVPqR0siHZtfOTrxeU4OnOZaj.Lq05J4Yz9DvzSi0ooC/1mS', '2025-11-19 18:26:27', '2025-10-20 19:26:27', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36', '109.52.54.119'),
(49, 1, 'bN7ebnIQ29tO', '$2y$12$tY3ZCNORYzpl9JfM.BpTv.7RXTu4jJzP5bxn8WmUd9K3N5JXRw0U.', '2025-11-19 20:41:52', '2025-10-20 21:41:52', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36', '109.52.54.119'),
(50, 7, 'KX5Eq9V5BDV1', '$2y$12$sIyOaIZVsiSoiGhNmdEuYePH4g/xu3Y8CD4AY0ibR.FfkUA5/bl9G', '2025-11-20 18:03:31', '2025-10-21 19:03:31', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36', '109.52.251.174'),
(51, 7, '02ar4vD6LRVg', '$2y$12$UYILLJdZ0yWkYWoOhqxm5OQF2HKMbrKUpo/KLZz0VMhILAAbL66w2', '2025-11-21 18:44:21', '2025-10-22 19:44:21', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36', '2.196.142.78'),
(52, 7, 'OD2d8vK2PLYh', '$2y$12$CCvpbfxkz.vlNXUvvWCUzOG3W3eyUsGbW2U0qgWCEgaWqlneq2lJG', '2025-11-21 19:31:47', '2025-10-22 20:31:47', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36', '2.196.142.78'),
(53, 1, 'MG2rS7p-8Yhy', '$2y$12$veN1yHRrk80N05DUKNPhzet.krl9ULepriD/y8BJ1F.vGnWag68sW', '2025-11-21 20:41:16', '2025-10-22 21:41:16', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36', '2.196.142.78'),
(54, 7, 'hLHK4zuXEg-u', '$2y$12$6Z5beR.64eDpg604mQmfaO3/2MCnQmq62T/wjt8Ecg7Nqjm7Gl3uS', '2025-11-24 21:21:47', '2025-10-25 22:21:47', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36', '109.55.230.169'),
(55, 7, 'dyI9VWXGnXrs', '$2y$12$eXIf2mqUjIe/bQGx3HciJOrb2.RRNCncCviHPKkJeQIorszxO6k2e', '2025-11-24 22:05:14', '2025-10-25 23:05:14', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36', '109.55.230.169'),
(56, 8, 'V4JYWtWnc7nd', '$2y$12$In3xqM5AozcOBMSJnMeDuupH.paq4F.GzjSUqjMVrD6Rivj5NitbO', '2025-11-24 22:46:07', '2025-10-25 23:46:07', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36', '109.55.230.169'),
(57, 1, 'F4BP5R-U200o', '$2y$12$M94JLOt4rGPRBAY9Pout/uogLn6tV3ueB9XTza1UVUjqpQHWei6Xa', '2025-11-24 22:53:12', '2025-10-25 23:53:12', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36', '109.55.230.169'),
(58, 7, 'JjYvXQ4xhVHx', '$2y$12$VqAU2vQ9p.O8T3Bi6C4h3.navCJmOyOBMNW6pBNsAK63lPbYbgjAS', '2025-12-30 22:38:26', '2025-11-30 22:38:26', 'Mozilla/5.0 (Android 15; Mobile; rv:145.0) Gecko/145.0 Firefox/145.0', '109.52.252.151'),
(59, 7, 'SmD7AvlHX6N7', '$2y$12$2lUBDafDKwCEX4Lmev8YzOf0Zty5rn5aAelbgk25aX2bFn4eRS9xm', '2025-12-30 22:38:43', '2025-11-30 22:38:43', 'Mozilla/5.0 (Android 15; Mobile; rv:145.0) Gecko/145.0 Firefox/145.0', '109.52.252.151'),
(60, 7, 'liDbiVoEoZr_', '$2y$12$CRL1bS5n7etFPhr6eCQSX.1v2v/SMhuQ1mQw4oaiqdtdTKObpgKCW', '2025-12-31 22:37:11', '2025-12-01 22:37:11', 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) SamsungBrowser/29.0 Chrome/136.0.0.0 Mobile Safari/537.36', '2.195.143.120'),
(61, 7, 'tJZkPD3h1kyN', '$2y$12$/n9UVlIFXBIjzSBP7FMPreOkJSo9uoai6q6ri12u8jopDBZRQZNSy', '2025-12-31 23:39:03', '2025-12-01 23:39:03', 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) SamsungBrowser/29.0 Chrome/136.0.0.0 Mobile Safari/537.36', '2.195.143.120'),
(62, 7, '2uuCs7ex17US', '$2y$12$q2IeNVjIJORmMy5jOtzRLeMiW6hcTkA/e042XVcN3EzTHArCSLUdq', '2025-12-31 23:39:30', '2025-12-01 23:39:30', 'Mozilla/5.0 (Android 15; Mobile; rv:145.0) Gecko/145.0 Firefox/145.0', '2.195.143.120'),
(63, 7, '0gSVLY4UnuF0', '$2y$12$mfPSQ0cj7b1nmCPd3ZlZfuvbASKc2UGke68kwDuTjxCIKZjbh3vMW', '2026-01-01 06:42:06', '2025-12-02 06:42:06', 'Mozilla/5.0 (Android 15; Mobile; rv:145.0) Gecko/145.0 Firefox/145.0', '2.195.143.120'),
(64, 7, '4di6fkloVbfX', '$2y$12$3OSG3Sb9lKXusOfV40pyh.JSe/tNs.9gTK1ZT1N0XT/oyWz0aH4Ky', '2026-01-04 18:58:15', '2025-12-05 18:58:15', 'Mozilla/5.0 (Android 15; Mobile; rv:145.0) Gecko/145.0 Firefox/145.0', '109.52.65.106'),
(65, 7, 'zriqE6D61lKi', '$2y$12$aMruDkCLoyPNzWsv.bDzIeJLwjql3FZ5TV9lPwUezav6XKD5BQdf2', '2026-01-07 02:38:36', '2025-12-08 02:38:36', 'Mozilla/5.0 (Android 15; Mobile; rv:145.0) Gecko/145.0 Firefox/145.0', '109.52.103.153');
