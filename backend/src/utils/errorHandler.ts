import { Response } from "express";

export const sendError = (
  res: Response,
  error: unknown,
  message = "Internal Server Error",
  statusCode = 500
) => {
  console.error("❌ Error:", error);

  // แปลง error ให้เป็นข้อความ
  let errorMessage = "Unknown error";

  if (error instanceof Error) {
    errorMessage = error.message;
  }

  return res.status(statusCode).json({
    success: false,
    message,
    error: errorMessage,
  });
};