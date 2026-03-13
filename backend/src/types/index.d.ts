import * as express from 'express';

declare global {
  namespace Express {
    interface Request {
      //? กำหนดให้ Request ทุกตัวในโปรเจคมี property user
      user?: any;
    }
  }
}