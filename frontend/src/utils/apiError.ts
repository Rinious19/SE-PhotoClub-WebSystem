//? Util: API Error Parser (Frontend)
//@ แปล axios/fetch error เป็นข้อความไทยที่ชัดเจน ใช้ร่วมกันทุก page

export const parseApiError = (err: any, fallback = 'เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง'): string => {
  // Backend ส่ง message กลับมา (axios error response)
  const serverMsg: string | undefined = err?.response?.data?.message;
  if (serverMsg) return serverMsg;

  // Network error (ไม่มี response เลย)
  if (err?.code === 'ERR_NETWORK' || !err?.response) {
    return 'ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้ — กรุณาตรวจสอบการเชื่อมต่อ';
  }

  // HTTP status ที่รู้จัก
  const status: number | undefined = err?.response?.status;
  if (status === 400) return serverMsg || 'ข้อมูลที่ส่งไม่ถูกต้อง กรุณาตรวจสอบอีกครั้ง';
  if (status === 401) return 'หมดเวลาเข้าสู่ระบบ — กรุณาเข้าสู่ระบบใหม่';
  if (status === 403) return 'คุณไม่มีสิทธิ์ดำเนินการนี้';
  if (status === 404) return 'ไม่พบข้อมูลที่ต้องการ';
  if (status === 409) return serverMsg || 'ข้อมูลซ้ำ — มีอยู่ในระบบแล้ว';
  if (status === 413) return 'ไฟล์มีขนาดใหญ่เกินไป — กรุณาลดขนาดไฟล์ก่อนอัปโหลด';
  if (status === 500) return 'เซิร์ฟเวอร์เกิดข้อผิดพลาด — กรุณาลองใหม่หรือแจ้งผู้ดูแลระบบ';

  // JavaScript error
  if (err?.message) return err.message;

  return fallback;
};