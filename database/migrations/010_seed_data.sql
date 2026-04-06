USE photoclub_db;

INSERT INTO `users` (`id`, `username`, `password_hash`, `role`, `created_at`, `updated_at`) VALUES
(1, 'cp', '$2b$10$MI7pplickbuchTpTzIgcdeTbHGlbAnc9PysQoUDpPLW3eLcoxzL6e', 'CLUB_PRESIDENT', '2026-03-09 06:06:19', '2026-03-25 11:13:34'),
(2, 'admin', '$2b$10$MI7pplickbuchTpTzIgcdeTbHGlbAnc9PysQoUDpPLW3eLcoxzL6e', 'ADMIN', '2026-03-09 06:02:45', '2026-03-25 05:13:56'),
(3, 'user1', '$2b$10$8PiTADEGkJuliDKn7SsNQ.gC2Muiuc.Lk9nB0hTyUJQbG5/Wu4KC2', 'EXTERNAL_USER', '2026-03-25 11:36:14', '2026-03-31 17:30:22'),
(4, 'User2', '$2b$10$X9ZoDtpVkm1DU36H5E4e3u72F6.NfO3KgOpP6caXIfxzs2lLGOvA2', 'EXTERNAL_USER', '2026-03-31 17:19:27', '2026-03-31 18:11:39'),
(5, 'User3', '$2b$10$wXO8j/XJAPAZHKIYMzsRDeWDamnX8ipziYt7copjf7hq2u1mjrv3O', 'EXTERNAL_USER', '2026-03-31 17:19:38', '2026-03-31 17:52:02');

