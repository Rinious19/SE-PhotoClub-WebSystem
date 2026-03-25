<<<<<<< HEAD
USE photoclub_db;

--? Table: photos
--@ เก็บข้อมูลรูปภาพทั้งหมด รวม faculty/academic_year/file_hash ที่ใช้จริง
CREATE TABLE IF NOT EXISTS photos (
    id            INT AUTO_INCREMENT PRIMARY KEY,
    title         VARCHAR(255)   NOT NULL,                -- ชื่ออีเว้นท์ (FK เชิง logic กับ events.event_name)
    event_date    DATE           NULL,
    description   TEXT           NULL,
    image_url     TEXT           NOT NULL,
    thumbnail_url TEXT           NULL,
    faculty       VARCHAR(100)   NULL,
    academic_year VARCHAR(10)    NULL,
    file_hash     VARCHAR(32)    NULL,                    -- MD5 hash ป้องกันรูปซ้ำใน event เดียวกัน
    user_id       INT            NOT NULL,
    created_by    INT            NULL,
    updated_by    INT            NULL,
    deleted_at    TIMESTAMP      NULL,
    deleted_by    INT            NULL,
    created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (user_id)    REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_title      (title),
    INDEX idx_deleted_at (deleted_at),
    INDEX idx_file_hash  (title, file_hash)
);

--? Table: photo_audit_logs
--@ บันทึก audit trail ของทุก action ที่เกิดกับรูปภาพ (ใช้ใน PhotoRepository.logAction)
CREATE TABLE IF NOT EXISTS photo_audit_logs (
    id         INT AUTO_INCREMENT PRIMARY KEY,
    photo_id   INT          NOT NULL,
    action     VARCHAR(20)  NOT NULL,                    -- UPLOAD | EDIT | DELETE
    user_id    INT          NOT NULL,
    details    TEXT         NULL,
    created_at TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_photo_id (photo_id),
    INDEX idx_user_id  (user_id),
    INDEX idx_action   (action)
=======
CREATE TABLE IF NOT EXISTS photos (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    image_url TEXT NOT NULL,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
>>>>>>> fe687ab4973be30cfd7184d885fc117760ffb180
);