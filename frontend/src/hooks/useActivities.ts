//? Hook: useActivities
//@ Custom Hook สำหรับดึงข้อมูลกิจกรรมทั้งหมด พร้อม filter
//
//! สาเหตุของ ESLint warning "React Hook useCallback has a missing dependency: 'filters'"
//  → filters เป็น object ที่ถูกสร้างใหม่ทุก render (reference เปลี่ยนเสมอ)
//  → ถ้าใส่ filters ทั้ง object ใน dependency array → fetchActivities จะถูกสร้างใหม่ทุก render
//  → ทำให้ useEffect เรียกซ้ำไม่หยุด (infinite loop)
//
//@ วิธีแก้ที่ถูกต้อง: รับค่า primitive แยกแต่ละตัวแทนการรับ object
//  เพราะ primitive (string | undefined) เปรียบค่า === ได้ → useCallback จะ stable

import { useState, useCallback, useEffect } from 'react';
import { ActivityService }                   from '@/services/ActivityService';

//@ กำหนด type ของ Activity ที่รับมาจาก API
export interface ActivityItem {
  id:           number;
  title:        string;
  description?: string;
  category?:    string;
  event_name:   string;
  start_at:     string;
  end_at:       string;
  status:       'UPCOMING' | 'ACTIVE' | 'ENDED';
  creator_name: string;
  photo_count:  number;
  vote_count:   number;
  created_at:   string;
}

//@ รับ filter แต่ละตัวแบบ primitive แยกกัน
//  แทนการรับเป็น object เดียว เพื่อป้องกัน infinite re-render
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

  //* ฟังก์ชัน fetch ที่ wrapped ด้วย useCallback
  //  เนื่องจาก dependency ทุกตัวเป็น primitive (string | undefined)
  //  React จึงเปรียบค่าด้วย === ได้ → useCallback stable → ไม่เกิด infinite loop
  const fetchActivities = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      //@ รวม primitive กลับเป็น object ตอนส่ง API
      const res = await ActivityService.getAll({
        keyword,
        category,
        status,
        dateFrom,
        dateTo,
      });
      setActivities(res.data || []);
    } catch (err: unknown) {
      //@ ใช้ unknown แทน any แล้ว type-narrow ก่อนใช้งาน
      const message =
        err instanceof Error
          ? err.message
          : (
              err as { response?: { data?: { message?: string } } }
            )?.response?.data?.message ?? 'โหลดกิจกรรมไม่สำเร็จ';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [
    //! สำคัญ: ทุกค่าที่ใส่ที่นี่ต้องเป็น primitive เท่านั้น
    //  ห้ามใส่ object/array เพราะ reference เปลี่ยนทุก render → infinite loop
    keyword,
    category,
    status,
    dateFrom,
    dateTo,
  ]);

  //@ เรียก fetch เมื่อ fetchActivities เปลี่ยน (= เมื่อ filter ใด filter หนึ่งเปลี่ยน)
  useEffect(() => {
    fetchActivities();
  }, [fetchActivities]);

  return { activities, loading, error, refetch: fetchActivities };
};