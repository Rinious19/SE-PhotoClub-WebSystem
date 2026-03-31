import { useState, useCallback, useEffect } from 'react';
import { ActivityService } from '@/services/ActivityService';

/**
 * @interface ActivityItem 
 * กำหนดโครงสร้างข้อมูลกิจกรรมที่รับมาจาก API ให้ตรงกับ Database ที่ปรับปรุงใหม่
 */
export interface ActivityItem {
  id:           number;
  title:        string;
  description?: string;
  category?:    string;     // เพิ่มรองรับจาก alter_for_voting.sql
  event_name:   string;     // เพิ่มรองรับจาก alter_for_voting.sql
  start_at:     string;     // เพิ่มรองรับจาก alter_for_voting.sql
  end_at:       string;     // เพิ่มรองรับจาก alter_for_voting.sql
  status:       'UPCOMING' | 'ACTIVE' | 'ENDED'; // แก้ไข enum ตาม SQL ใหม่
  creator_name: string;
  photo_count:  number;
  vote_count:   number;
  created_at:   string;
}

/**
 * @interface ActivityFilters
 * แก้ไขปัญหา "Unexpected any" โดยการกำหนด Type สำหรับ Filter
 */
interface ActivityFilters {
  keyword?:  string;
  category?: string;
  status?:   string;
  dateFrom?: string;
  dateTo?:   string;
}

/**
 * @hook useActivities
 * รับค่าแบบ Primitive แยกกัน เพื่อให้ useCallback ตรวจสอบค่าได้แม่นยำ (Stable Reference)
 * ป้องกันอาการหน้าเว็บกะพริบสลับสถานะ
 */
export const useActivities = (
  keyword?:  string,
  category?: string,
  status?:   string,
  dateFrom?: string,
  dateTo?:   string,
) => {
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState<string | null>(null);

  const fetchActivities = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // สร้าง Object ที่มี Type ชัดเจน แทนการใช้ any
      const whitelistFilters: ActivityFilters = {};

      if (keyword) whitelistFilters.keyword = keyword;
      
      // ตรวจสอบค่า 'all' เพื่อไม่ให้ส่งค่าว่างไปที่ API ซึ่งอาจเกิด Error 400
      if (category && category !== 'all') {
        whitelistFilters.category = category;
      }
      
      if (status && status !== 'all') {
        whitelistFilters.status = status;
      }

      if (dateFrom) whitelistFilters.dateFrom = dateFrom;
      if (dateTo)   whitelistFilters.dateTo   = dateTo;

      // เรียก Service โดยส่ง Object ที่กรองแล้ว
      const res = await ActivityService.getAll(whitelistFilters);
      
      setActivities(res.data || []);
    } catch (err: unknown) {
      // การทำ Type Narrowing เพื่อความปลอดภัยของข้อมูล
      let message = 'โหลดกิจกรรมไม่สำเร็จ';
      
      if (err instanceof Error) {
        message = err.message;
      } else if (typeof err === 'object' && err !== null) {
        const errorObj = err as { response?: { data?: { message?: string } } };
        message = errorObj.response?.data?.message || message;
      }
      
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [keyword, category, status, dateFrom, dateTo]); // Dependency เป็นค่าคงที่ (Primitive) ป้องกัน Loop

  useEffect(() => {
    fetchActivities();
  }, [fetchActivities]);

  return { activities, loading, error, refetch: fetchActivities };
};