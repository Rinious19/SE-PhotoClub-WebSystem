# 1. เลือก Base Image เป็น Node.js (เปรียบเหมือนการเลือกระบบปฏิบัติการที่มี Node ติดตั้งมาให้แล้ว)
FROM node:20-alpine

# 2. กำหนดโฟลเดอร์ทำงานภายใน Container
WORKDIR /app

# 3. ก๊อปปี้ไฟล์ package.json และ package-lock.json เข้าไปก่อน
COPY package*.json ./

# 4. ติดตั้ง Dependencies ตาม package.json
RUN npm install

# 5. ก๊อปปี้โค้ดทั้งหมดในโฟลเดอร์ backend ของเรา เข้าไปใน Container
COPY . .

# 6. ทำการ Build TypeScript ให้กลายเป็น JavaScript (เพราะ Node รัน TS โดยตรงไม่ได้)
RUN npm run build

# 7. เปิดพอร์ต 10000 (Render แนะนำให้ใช้พอร์ตนี้)
EXPOSE 10000

# 8. คำสั่งสำหรับรันตอนเริ่มเปิด Container
CMD ["node", "dist/app.js"]