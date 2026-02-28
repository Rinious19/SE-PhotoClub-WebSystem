export interface Photo {
  id?: number;
  title: string;
  description?: string;
  image_url: string;
  user_id: number;
  created_at?: Date;
}