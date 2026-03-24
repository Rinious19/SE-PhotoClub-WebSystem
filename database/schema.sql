--? Schema: PhotoClub WebSystem — Full Database Schema
--@ รวม DDL ทั้งหมดสำหรับ setup ครั้งแรก หรือ reset ฐานข้อมูล

SOURCE database/migrations/001_create_users.sql;
SOURCE database/migrations/002_create_photos.sql;
SOURCE database/migrations/003_create_activities.sql;
SOURCE database/migrations/004_create_votes.sql;
SOURCE database/migrations/005_create_history_logs.sql;