USE photoclub_db;

CREATE TABLE users (
  id int(11) NOT NULL AUTO_INCREMENT,
  username varchar(50) NOT NULL,
  password_hash varchar(255) NOT NULL,
  role enum('GUEST','EXTERNAL_USER','ADMIN','CLUB_PRESIDENT') DEFAULT 'EXTERNAL_USER',
  created_at timestamp NOT NULL DEFAULT current_timestamp(),
  updated_at timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (id),
  UNIQUE KEY username (username)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;