// frontend/src/utils/apiError.ts
export const parseApiError = (
  err: unknown,
  fallback = 'เกิดข้อผิดพลาด กรุณาลองใหม่'
): string => {
  if (typeof err !== 'object' || err === null) return fallback;
  const e = err as Record<string, unknown>;
  const status  = (e?.response as Record<string, unknown>)?.status  as number | undefined;
  const message = ((e?.response as Record<string, unknown>)?.data as Record<string, unknown>)?.message as string | undefined;

  if (!e?.response)  return 'ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้';
  if (status === 401) return 'หมดเวลาเข้าสู่ระบบ — กรุณาเข้าสู่ระบบใหม่';
  if (status === 403) return 'คุณไม่มีสิทธิ์ดำเนินการนี้';
  if (status === 413) return 'ไฟล์มีขนาดใหญ่เกินไป';
  if (status === 500) return 'เซิร์ฟเวอร์เกิดข้อผิดพลาด';
  if (message)        return message;
  return fallback;
};