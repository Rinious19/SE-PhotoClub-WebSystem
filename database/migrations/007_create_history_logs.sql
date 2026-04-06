USE photoclub_db;

CREATE TABLE `history_logs` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `actor_id` int(11) DEFAULT NULL,
  `action` varchar(50) NOT NULL,
  `target_type` varchar(30) NOT NULL,
  `target_id` int(11) DEFAULT NULL,
  `detail` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_actor_id` (`actor_id`),
  KEY `idx_action` (`action`),
  KEY `idx_target_type` (`target_type`),
  KEY `idx_created_at` (`created_at`),
  CONSTRAINT `history_logs_ibfk_1` FOREIGN KEY (`actor_id`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;