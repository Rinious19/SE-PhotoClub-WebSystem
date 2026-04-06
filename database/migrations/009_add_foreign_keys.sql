USE photoclub_db;

-- เพิ่ม FK ใหม่
ALTER TABLE `photos`
  ADD CONSTRAINT `fk_photos_event_new`
  FOREIGN KEY (`event_id`) REFERENCES `events` (`id`)
  ON DELETE SET NULL ON UPDATE CASCADE;