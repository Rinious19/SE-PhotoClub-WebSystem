USE photoclub_db;

--? Table: history_logs
--@ บันทึก audit log ระดับระบบ (Admin actions, User management)
--  แยกจาก photo_audit_logs ที่ใช้เฉพาะรูปภาพ
CREATE TABLE IF NOT EXISTS history_logs (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    actor_id    INT          NULL,                        -- ผู้กระทำ (อาจเป็น NULL ถ้า user ถูกลบ)
    action      VARCHAR(50)  NOT NULL,                   -- เช่น CHANGE_ROLE | CREATE_USER | DELETE_USER
    target_type VARCHAR(30)  NOT NULL,                   -- USER | PHOTO | ACTIVITY | SYSTEM
    target_id   INT          NULL,                       -- id ของ target ที่ถูกกระทำ
    detail      TEXT         NULL,                       -- รายละเอียดเพิ่มเติม (JSON string)
    created_at  TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (actor_id) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_actor_id    (actor_id),
    INDEX idx_action      (action),
    INDEX idx_target_type (target_type),
    INDEX idx_created_at  (created_at)
);