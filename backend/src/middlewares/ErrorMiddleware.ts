//? Middleware: Global Error Handler
//@ ดักจับ Error ทุกตัวที่ไม่ถูกจัดการ — ต้องใส่ไว้ท้ายสุดใน app.ts

import type { Request, Response, NextFunction } from 'express';

export const ErrorMiddleware = (
  err:  Error,
  _req: Request,
  res:  Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction
): void => {
  console.error('[GlobalError]', err.message);

  // Multer error (file upload)
  if (err.name === 'MulterError') {
    res.status(400).json({ success: false, message: `Upload error: ${err.message}` });
    return;
  }

  // JWT error
  if (err.name === 'JsonWebTokenError') {
    res.status(401).json({ success: false, message: 'Token ไม่ถูกต้อง' });
    return;
  }
  if (err.name === 'TokenExpiredError') {
    res.status(401).json({ success: false, message: 'Token หมดอายุ' });
    return;
  }

  // Default
  res.status(500).json({
    success: false,
    message: err.message ?? 'เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์',
  });
};