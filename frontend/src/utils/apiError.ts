export const parseApiError = (err: unknown, fallback = 'เกิดข้อผิดพลาด กรุณาลองใหม่'): string => {
  // บอก TypeScript ว่า err น่าจะมีหน้าตา (Type) ประมาณนี้นะ
  const e = err as {
    code?: string;
    message?: string;
    response?: {
      status?: number;
      data?: {
        message?: string;
      };
    };
  };

  const status = e?.response?.status;
  const serverMsg = e?.response?.data?.message;

  // Network error (ไม่มี response กลับมา)
  if (e?.code === 'ERR_NETWORK' || !e?.response) {
    return 'ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้ - กรุณาตรวจสอบอินเทอร์เน็ต';
  }

  // HTTP status
  if (status === 400) return serverMsg || 'ข้อมูลไม่ถูกต้อง';
  if (status === 401) return 'เซสชั่นหมดอายุ กรุณาเข้าสู่ระบบใหม่';
  if (status === 403) return 'ไม่มีสิทธิ์เข้าถึง - กรุณาตรวจสอบสิทธิ์';
  if (status === 404) return 'ไม่พบข้อมูลในระบบ - กรุณาลองใหม่อีกครั้ง';

  // Backend ส่ง message กลับมา
  if (serverMsg) return serverMsg;

  if (status === 422) return 'ข้อมูลไม่ถูกต้อง กรุณาตรวจสอบอีกครั้ง';
  if (status === 500) return 'เกิดข้อผิดพลาดที่เซิร์ฟเวอร์';
  if (status === 409) return 'ข้อมูลซ้ำ - มีอยู่ในระบบแล้ว';

  // JavaScript error
  if (e?.message) return e.message;

  return fallback;
};