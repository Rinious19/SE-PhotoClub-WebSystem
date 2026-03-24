USE photoclub_db;

--? Seed: ข้อมูลตั้งต้นสำหรับ Development / Testing
--! รหัสผ่านทุกบัญชีคือ "password123" (bcrypt hash ด้านล่าง)
--  สร้าง hash ด้วย: bcrypt.hash("password123", 10)

INSERT IGNORE INTO users (username, password_hash, role) VALUES
-- Admin หลัก
('admin',
 '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
 'ADMIN'),

-- ประธานชมรม
('president',
 '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
 'CLUB_PRESIDENT'),

-- สมาชิกทั่วไป
('member01',
 '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
 'EXTERNAL_USER'),

('member02',
 '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
 'EXTERNAL_USER');

--@ ตัวอย่าง Event สำหรับ Dev
INSERT IGNORE INTO events (event_name, event_date) VALUES
('ทริปถ่ายภาพเขาใหญ่ 2567',  '2024-12-15'),
('งานรับน้องถ่ายภาพ 2567',    '2024-08-20'),
('Photo Walk กรุงเทพ 2567',   '2024-10-05');