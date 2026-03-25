//? Observer: ActivityObserver
//@ Interface กลางของ Observer Pattern สำหรับกิจกรรม
//  ทุก Observer ที่ต้องการรับ event ต้อง implement interface นี้

import { ActivityClosedObserver } from './ActivityClosedObserver';

//@ Interface ที่ Observer ทุกตัวต้อง implement
export interface IActivityObserver {
  onActivityClosed(activityId: number): Promise<void>;
}

//@ ActivityObserverManager — จัดการ Observer ทั้งหมด
//  เป็น Singleton ที่ใช้ notify ทุก Observer เมื่อกิจกรรมสิ้นสุด
export class ActivityObserverManager {
  private static instance: ActivityObserverManager;
  //* list ของ observer ทั้งหมดที่ register ไว้
  private observers: IActivityObserver[] = [];

  private constructor() {
    // register observer เริ่มต้น
    this.observers.push(new ActivityClosedObserver());
  }

  //@ Singleton pattern — ใช้ instance เดียวตลอด
  static getInstance(): ActivityObserverManager {
    if (!ActivityObserverManager.instance) {
      ActivityObserverManager.instance = new ActivityObserverManager();
    }
    return ActivityObserverManager.instance;
  }

  //@ เพิ่ม observer ใหม่
  register(observer: IActivityObserver): void {
    this.observers.push(observer);
  }

  //@ แจ้งให้ observer ทุกตัวทราบว่ากิจกรรมสิ้นสุดแล้ว
  async notifyActivityClosed(activityId: number): Promise<void> {
    for (const observer of this.observers) {
      //@ เรียก observer ทีละตัว ถ้า observer ตัวไหน error ไม่ให้กระทบตัวอื่น
      try {
        await observer.onActivityClosed(activityId);
      } catch (err) {
        console.error('[ActivityObserverManager] Observer error:', err);
      }
    }
  }
}