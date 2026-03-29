USE photoclub_db;

--? Table: events
--@ เก็บข้อมูลกิจกรรม/อีเว้นท์ของชมรม (ใช้จริงใน EventRepository)
CREATE TABLE IF NOT EXISTS events (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    event_name  VARCHAR(255) NOT NULL UNIQUE,
    event_date  DATE         NOT NULL,
    created_at  TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    updated_at  TIMESTAMP    DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_event_date (event_date)
);