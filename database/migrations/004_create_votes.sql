USE photoclub_db;

--? Table: activities
--@ กิจกรรมประกวดภาพถ่าย (ต่างจาก events — activities คือการโหวต)
CREATE TABLE IF NOT EXISTS activities (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    title       VARCHAR(255) NOT NULL,
    description TEXT         NULL,
    status      ENUM('OPEN','CLOSED','DRAFT') DEFAULT 'DRAFT',
    start_date  TIMESTAMP    NULL,
    end_date    TIMESTAMP    NULL,
    created_by  INT          NULL,
    created_at  TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    updated_at  TIMESTAMP    DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_status (status)
);

--? Table: votes
--@ บันทึกการโหวตรูปภาพ — 1 user ต่อ 1 activity โหวตได้ 1 ครั้ง
CREATE TABLE IF NOT EXISTS votes (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    activity_id INT NOT NULL,
    photo_id    INT NOT NULL,
    user_id     INT NOT NULL,
    created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (activity_id) REFERENCES activities(id) ON DELETE CASCADE,
    FOREIGN KEY (photo_id)    REFERENCES photos(id)     ON DELETE CASCADE,
    FOREIGN KEY (user_id)     REFERENCES users(id)      ON DELETE CASCADE,

    --! UNIQUE constraint — ป้องกันโหวตซ้ำ (สำคัญมาก ตามที่ระบุใน spec)
    UNIQUE KEY uq_vote (activity_id, user_id),
    INDEX idx_activity_id (activity_id),
    INDEX idx_photo_id    (photo_id)
);