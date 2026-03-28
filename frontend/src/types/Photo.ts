export interface GalleryGroup {
  event_name: string;
  photo_count: number;
  preview_urls: string[]; // เพิ่มบรรทัดนี้แทน thumbnail_url เดิม
  latest_upload: string;
}