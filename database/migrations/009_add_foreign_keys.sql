USE photoclub_db;

-- ลบ FK เดิมก่อน (กัน error ถ้ามีอยู่แล้ว)
ALTER TABLE `photos`
  DROP FOREIGN KEY IF EXISTS `fk_photos_event_new`;

-- เพิ่ม FK ใหม่
ALTER TABLE `photos`
  ADD CONSTRAINT `fk_photos_event_new`
  FOREIGN KEY (`event_id`) REFERENCES `events` (`id`)
  ON DELETE SET NULL ON UPDATE CASCADE;