// src/utils/dateHelper.ts

/**
 * 🛠️ ฟังก์ชันแปลงเวลาจาก Database (UTC) ให้เป็นเวลาไทย (+7) และปี พ.ศ.
 * ใช้สำหรับแสดงผลในหน้า History, Dashboard และ Card ต่างๆ
 */
export const formatThaiDateTime = (dateStr: string | null | undefined) => {
  if (!dateStr) return '—';

  try {
    // 💡 Logic: เติม Z เพื่อบอกว่าเป็น UTC และเปลี่ยนช่องว่างเป็น T ให้เป็น ISO Format
    const utcDate = dateStr.includes('Z') || dateStr.includes('+') 
      ? new Date(dateStr) 
      : new Date(`${dateStr.replace(' ', 'T')}Z`);

    return utcDate.toLocaleString('th-TH', {
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    });
  } catch (error) {
    return dateStr;
  }
};

/**
 * 🛠️ ฟังก์ชันสำหรับเช็ค Status กิจกรรมแบบ Real-time (Logic)
 * ใช้เปรียบเทียบว่าตอนนี้กิจกรรมเริ่มหรือยัง โดยใช้มาตรฐาน UTC
 */
export const getRealTimeStatus = (startAt: string, endAt: string) => {
  const now = new Date().getTime();
  
  const start = new Date(`${startAt.replace(' ', 'T')}Z`).getTime();
  const end = new Date(`${endAt.replace(' ', 'T')}Z`).getTime();

  if (now < start) return 'UPCOMING';
  if (now > end) return 'ENDED';
  return 'ACTIVE';
};