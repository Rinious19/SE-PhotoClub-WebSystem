-- สร้างฐานข้อมูลใหม่
CREATE DATABASE IF NOT EXISTS photoclub_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- เลือกใช้ฐานข้อมูลนี้
USE photoclub_db;

-- สร้างตาราง users (อ้างอิงจากไฟล์ 001_create_users.sql)
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role ENUM('GUEST', 'EXTERNAL_USER', 'ADMIN', 'CLUB_PRESIDENT') DEFAULT 'EXTERNAL_USER',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);