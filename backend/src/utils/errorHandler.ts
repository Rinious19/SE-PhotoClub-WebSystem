//? Util: Error Handler
//@ แปล SQL error code และ HTTP error เป็นข้อความภาษาไทยที่ชัดเจน

export interface AppError {
  status: number;
  message: string;
  detail?: string;
}

// แปล MySQL error code → ข้อความไทยที่อ่านเข้าใจ
const mysqlErrorMap: Record<number, string> = {
  1062: 'ข้อมูลซ้ำ — มีรายการนี้อยู่ในระบบแล้ว',
  1048: 'ข้อมูลไม่ครบ — มีฟิลด์ที่จำเป็นแต่ไม่ได้ส่งมา',
  1054: 'ชื่อคอลัมน์ไม่ถูกต้องในฐานข้อมูล',
  1064: 'SQL syntax error — กรุณาแจ้งผู้ดูแลระบบ',
  1146: 'ไม่พบตารางในฐานข้อมูล — กรุณาแจ้งผู้ดูแลระบบ',
  1153: 'ไฟล์มีขนาดใหญ่เกินไป (เกิน max_allowed_packet) — กรุณาลดขนาดไฟล์',
  1265: 'ข้อมูลถูกตัดทอน — ค่าที่ส่งมาไม่ตรงกับประเภทข้อมูลในฐานข้อมูล',
  1292: 'รูปแบบวันที่ไม่ถูกต้อง — กรุณาใช้รูปแบบ YYYY-MM-DD',
  1366: 'ประเภทข้อมูลไม่ตรง — ค่าที่ส่งมาไม่ตรงกับชนิดของฟิลด์',
  1406: 'ข้อมูลยาวเกินไป — กรุณาลดความยาวของข้อความ',
  1451: 'ไม่สามารถลบได้ — มีข้อมูลอื่นที่อ้างอิงอยู่',
  1452: 'ข้อมูลอ้างอิงไม่พบ — Foreign key constraint failed',
};

export const resolveError = (error: any): AppError => {
  // MySQL error (มี errno / sqlMessage)
  if (error?.errno && mysqlErrorMap[error.errno]) {
    return {
      status: 400,
      message: mysqlErrorMap[error.errno],
      detail: error.sqlMessage,
    };
  }

  // MySQL error ที่ไม่รู้จัก
  if (error?.sqlMessage) {
    return {
      status: 500,
      message: `ข้อผิดพลาดจากฐานข้อมูล (${error.code || 'UNKNOWN'})`,
      detail: error.sqlMessage,
    };
  }

  // Application error ที่ throw เอง
  if (error?.message) {
    return {
      status: 500,
      message: error.message,
    };
  }

  return { status: 500, message: 'เกิดข้อผิดพลาดที่ไม่ทราบสาเหตุ' };
};

// Helper สำหรับใช้ใน controller
export const sendError = (res: any, error: any, fallbackMsg?: string): void => {
  const resolved = resolveError(error);
  if (fallbackMsg && resolved.status === 500 && !error?.sqlMessage) {
    resolved.message = fallbackMsg;
  }
  console.error(`[ERROR] ${resolved.message}`, error?.sqlMessage || error?.message || '');
  res.status(resolved.status).json({
    success: false,
    message: resolved.message,
    ...(resolved.detail ? { detail: resolved.detail } : {}),
  });
};