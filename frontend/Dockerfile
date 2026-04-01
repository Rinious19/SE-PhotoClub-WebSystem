# Stage 1: Build (สร้างไฟล์ Static จาก React)
FROM node:20-alpine AS builder

# กำหนดโฟลเดอร์ทำงาน
WORKDIR /app

# ก๊อปปี้ package.json และติดตั้ง dependencies
COPY package*.json ./
RUN npm install

# ก๊อปปี้โค้ดทั้งหมดเข้าไปและสั่ง Build
COPY . .
RUN npm run build

# Stage 2: Serve (นำไฟล์ไปรันบน Nginx Server)
FROM nginx:alpine

# ก๊อปปี้ไฟล์ที่ Build เสร็จแล้วจาก Stage 1 มาใส่ในโฟลเดอร์ของ Nginx
COPY --from=builder /app/dist /usr/share/nginx/html

# ก๊อปปี้ไฟล์ตั้งค่า Nginx เข้าไป (สำคัญมากสำหรับ React Router เพื่อไม่ให้หน้าเว็บพังตอน Refresh)
COPY nginx.conf /etc/nginx/conf.d/default.conf

# เปิดพอร์ต 80 สำหรับ HTTP
EXPOSE 80

# รัน Nginx
CMD ["nginx", "-g", "daemon off;"]