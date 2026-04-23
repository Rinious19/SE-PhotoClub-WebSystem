# 📸 SE-PhotoClub-WebSystem

> ระบบเว็บไซต์สำหรับชมรมถ่ายภาพ — อัปโหลดรูป จัดกิจกรรม โหวต และดูสรุปผลแบบ Real-time

<!-- Frontend -->
![React](https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=flat-square&logo=typescript&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-7-646CFF?style=flat-square&logo=vite&logoColor=white)
![Bootstrap](https://img.shields.io/badge/Bootstrap-5-7952B3?style=flat-square&logo=bootstrap&logoColor=white)
![React Router](https://img.shields.io/badge/React_Router-v7-CA4245?style=flat-square&logo=reactrouter&logoColor=white)
![Axios](https://img.shields.io/badge/Axios-1.13.5-5A29E4?style=flat-square&logo=axios&logoColor=white)
![jwt-decode](https://img.shields.io/badge/jwt--decode-4.0.0-000000?style=flat-square&logo=jsonwebtokens&logoColor=white)
<!-- Backend -->
![Node.js](https://img.shields.io/badge/Node.js-25-339933?style=flat-square&logo=node.js&logoColor=white)
![Express](https://img.shields.io/badge/Express-5-000000?style=flat-square&logo=express&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=flat-square&logo=typescript&logoColor=white)
![JWT](https://img.shields.io/badge/JWT-9-000000?style=flat-square&logo=jsonwebtokens&logoColor=white)
![bcrypt](https://img.shields.io/badge/bcrypt-6-FF6C37?style=flat-square&logo=letsencrypt&logoColor=white)
![dotenv](https://img.shields.io/badge/dotenv-17.3.1-ECD53F?style=flat-square&logo=dotenv&logoColor=black)
![cors](https://img.shields.io/badge/cors-2.8.6-00ADD8?style=flat-square&logo=node.js&logoColor=white)
![multer](https://img.shields.io/badge/multer-2.1.0-FF6C37?style=flat-square&logo=node.js&logoColor=white)
![sharp](https://img.shields.io/badge/sharp-0.34.5-99CC00?style=flat-square&logo=node.js&logoColor=white)
![mysql2](https://img.shields.io/badge/mysql2-3.18.1-4479A1?style=flat-square&logo=mysql&logoColor=white)
<!-- Database -->
![MySQL](https://img.shields.io/badge/MySQL-8-4479A1?style=flat-square&logo=mysql&logoColor=white)
![XAMPP](https://img.shields.io/badge/XAMPP-phpMyAdmin-FB7A24?style=flat-square&logo=xampp&logoColor=white)
<!-- Tools -->
![ESLint](https://img.shields.io/badge/ESLint-9-4B32C3?style=flat-square&logo=eslint&logoColor=white)
![Prettier](https://img.shields.io/badge/Prettier-3-F7B93E?style=flat-square&logo=prettier&logoColor=black)
![Git](https://img.shields.io/badge/Git-Conventional_Commits-F05032?style=flat-square&logo=git&logoColor=white)

---

## 📋 สารบัญ

- [🌟 ภาพรวมโปรเจค](#-ภาพรวมโปรเจค)
- [🛠 Tech Stack](#-tech-stack)
- [🎨 Design Theme](#-design-theme)
- [📁 โครงสร้างโปรเจค](#-โครงสร้างโปรเจค)
- [🧩 Design Patterns](#-design-patterns)
- [👥 การแบ่งหน้าที่ทีม](#-การแบ่งหน้าที่ทีม)
- [🚀 วิธีติดตั้งและรัน](#-วิธีติดตั้งและรัน)
- [☁️ การนำขึ้นระบบ](#-การนำขึ้นระบบ)
- [📡 API Contract](#-api-contract)
- [📐 มาตรฐานการพัฒนา](#-มาตรฐานการพัฒนา)
- [🌿 Git Workflow](#-git-workflow)
- [💬 Comment Style](#-comment-style)
- [📚 เอกสารประกอบ](#-เอกสารประกอบ)
- [👨‍💻 สมาชิกในทีม](#-สมาชิกในทีม)
- [📄 License](#-license)


---

## 🌟 ภาพรวมโปรเจค

**SE-PhotoClub-WebSystem** คือระบบบริหารจัดการชมรมถ่ายภาพ พัฒนาขึ้นเป็นโปรเจควิชา Software Engineering ประกอบด้วยฟีเจอร์หลัก ดังนี้

| ฟีเจอร์ | รายละเอียด |
|--------|-----------|
| 🖼 จัดการภาพถ่าย | อัปโหลด แก้ไข และแสดงผลคอลเลกชันภาพ |
| 🗓 จัดกิจกรรม | สร้าง แก้ไข และติดตามสถานะกิจกรรมของชมรม |
| 🗳 ระบบโหวต | โหวตภาพถ่ายในกิจกรรม พร้อม Strategy Pattern |
| 📊 Dashboard | สรุปผลและประวัติกิจกรรมสำหรับ Admin |
| 🔐 Auth & Role | ระบบ Login / Register พร้อมจัดการสิทธิ์ตาม Role |

---

## 🛠 Tech Stack

### 🟦 Frontend

| Badge | เทคโนโลยี | เหตุผลที่เลือก |
|-------|-----------|--------------|
| ![React](https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react&logoColor=black) | React 19 | Component-based UI, Virtual DOM |
| ![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=flat-square&logo=typescript&logoColor=white) | TypeScript 5 | Type-safe ลด bug จาก type mismatch |
| ![Vite](https://img.shields.io/badge/Vite-7-646CFF?style=flat-square&logo=vite&logoColor=white) | Vite 7 | Build tool เร็ว พร้อม HMR |
| ![Bootstrap](https://img.shields.io/badge/Bootstrap-5-7952B3?style=flat-square&logo=bootstrap&logoColor=white) | Bootstrap 5 | Responsive Design ครบในตัว |
| ![React Router](https://img.shields.io/badge/React_Router-v7-CA4245?style=flat-square&logo=reactrouter&logoColor=white) | React Router v7 | Client-side Routing |
| ![Axios](https://img.shields.io/badge/Axios-1.13.5-5A29E4?style=flat-square&logo=axios&logoColor=white) | Axios 1.13.5 | HTTP Client สำหรับเรียก API |
| ![jwt-decode](https://img.shields.io/badge/jwt--decode-4.0.0-000000?style=flat-square&logo=jsonwebtokens&logoColor=white) | jwt-decode 4.0.0 | Decode JWT token ฝั่ง Frontend |

### 🟥 Backend

| Badge | เทคโนโลยี | เหตุผลที่เลือก |
|-------|-----------|--------------|
| ![Node.js](https://img.shields.io/badge/Node.js-25-339933?style=flat-square&logo=node.js&logoColor=white) | Node.js 25 | JavaScript runtime ฝั่ง server |
| ![Express](https://img.shields.io/badge/Express-5-000000?style=flat-square&logo=express&logoColor=white) | Express 5 | REST API framework ที่เบาและยืดหยุ่น |
| ![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=flat-square&logo=typescript&logoColor=white) | TypeScript 5 | Type-safe ทั้ง Frontend + Backend |
| ![JWT](https://img.shields.io/badge/JWT-9-000000?style=flat-square&logo=jsonwebtokens&logoColor=white) | JWT 9 | Stateless Authentication & Authorization |
| ![bcrypt](https://img.shields.io/badge/bcrypt-6-FF6C37?style=flat-square&logo=letsencrypt&logoColor=white) | bcrypt 6 | Password Hashing ที่ปลอดภัย |
| ![dotenv](https://img.shields.io/badge/dotenv-17.3.1-ECD53F?style=flat-square&logo=dotenv&logoColor=black) | dotenv 17.3.1 | โหลด Environment Variables จาก .env |
| ![cors](https://img.shields.io/badge/cors-2.8.6-00ADD8?style=flat-square&logo=node.js&logoColor=white) | cors 2.8.6 | จัดการ Cross-Origin Resource Sharing |
| ![multer](https://img.shields.io/badge/multer-2.1.0-FF6C37?style=flat-square&logo=node.js&logoColor=white) | multer 2.1.0 | จัดการ File Upload (multipart/form-data) |
| ![sharp](https://img.shields.io/badge/sharp-0.34.5-99CC00?style=flat-square&logo=node.js&logoColor=white) | sharp 0.34.5 | ประมวลผลและ resize รูปภาพ |
| ![mysql2](https://img.shields.io/badge/mysql2-3.18.1-4479A1?style=flat-square&logo=mysql&logoColor=white) | mysql2 3.18.1 | MySQL driver สำหรับ Node.js |

### 🟩 Database & Infrastructure

| Badge | เทคโนโลยี | เหตุผลที่เลือก |
|-------|-----------|--------------|
| ![MySQL](https://img.shields.io/badge/MySQL-8-4479A1?style=flat-square&logo=mysql&logoColor=white) | MySQL 8 | Relational Database พร้อม UNIQUE constraint |
| ![XAMPP](https://img.shields.io/badge/XAMPP-phpMyAdmin-FB7A24?style=flat-square&logo=xampp&logoColor=white) | XAMPP + phpMyAdmin | จัดการ Database ผ่าน GUI ได้ง่าย |

### 🟨 Tools & Linting

| Badge | เครื่องมือ | หน้าที่ |
|-------|----------|--------|
| ![ESLint](https://img.shields.io/badge/ESLint-9-4B32C3?style=flat-square&logo=eslint&logoColor=white) | ESLint 9 | Code quality & linting rules |
| ![Prettier](https://img.shields.io/badge/Prettier-3-F7B93E?style=flat-square&logo=prettier&logoColor=black) | Prettier 3 | Code formatting ให้เหมือนกันทั้งทีม |
| ![Git](https://img.shields.io/badge/Git-Conventional_Commits-F05032?style=flat-square&logo=git&logoColor=white) | Git + Conventional Commits | Version control มาตรฐาน |
| ![Better Comments](https://img.shields.io/badge/Better_Comments-VSCode_Extension-brightgreen?style=flat-square&logo=visualstudiocode&logoColor=white) | Better Comments | Comment style แบบมีสีสัน |

---

## 🎨 Design Theme

### Mood & Tone

- **Minimal + Dark/Neutral + Image-focused + Vote-friendly**
- เรียบ เท่ ศิลป์ — Professional แต่ไม่ทางการเกินไป
- ❌ หลีกเลี่ยงสีฉูดฉาด ที่แย่งความเด่นของภาพถ่าย

### Color Scheme
| ประเภท | สี |
|-------|---|
| สีหลัก | ดำ / เทาเข้ม / ขาว |
| สีรอง | เทาอ่อน |
| Accent (ปุ่มโหวต) | เหลืองทอง / เขียว |

### Typography
- **Title** — ชื่อภาพ (คม ชัด)
- **Subtitle** — ชื่อผู้ถ่าย / คณะ
- **Body** — คำอธิบายภาพ (ไม่แน่นเกิน)

---

## 📁 โครงสร้างโปรเจค

```
📁 photoclub-websystem
├── 📁 backend
├── 📁 database
├── 📁 frontend
├── ⚙️ .env
├── ⚙️ .env.example
├── ⚙️ .gitignore
├── 📝 README.md
├── 🐳 .dockerignore
└── 🐳 docker-compose.yml
```

### 🟦 Frontend

```
📁 frontend
├── 📁 public
│   ├── 🖼️ Logo_PhotoClub_Black.png
│   ├── 🖼️ Logo_PhotoClub_White.png
│   ├── 📄 _redirects
│   └── 🖼️ vite.svg
├── 📁 src
│   ├── 📁 assets
│   │   └── 🖼️ react.svg
│   ├── 📁 components
│   │   ├── 📁 activity
│   │   │   ├── 📄 ActivityCard.tsx
│   │   │   ├── 📄 ActivityTimer.tsx
│   │   │   └── 📄 VoteButton.tsx
│   │   ├── 📁 common
│   │   │   ├── 📄 AlertModal.tsx
│   │   │   ├── 📄 CustomDatePicker.tsx
│   │   │   └── 📄 DateRangeFilter.tsx
│   │   ├── 📁 layout
│   │   │   └── 📄 Navbar.tsx
│   │   └── 📁 photo
│   │       └── 📄 PhotoCard.tsx
│   ├── 📁 context
│   │   └── 📄 AuthContext.tsx
│   ├── 📁 hooks
│   │   ├── 📄 useActivities.ts
│   │   └── 📄 useAuth.ts
│   ├── 📁 layouts
│   │   ├── 📄 DashboardLayout.tsx
│   │   └── 📄 MainLayout.tsx
│   ├── 📁 pages
│   │   ├── 📁 activity
│   │   │   ├── 📄 ActivitiesPage.tsx
│   │   │   ├── 📄 ActivityDetailPage.tsx
│   │   │   ├── 📄 ActivityListPage.tsx
│   │   │   ├── 📄 CreateActivityPage.tsx
│   │   │   ├── 📄 EditActivityPage.tsx
│   │   │   ├── 📄 EventManagementPage.tsx
│   │   │   └── 📄 VotePage.tsx
│   │   ├── 📁 admin
│   │   │   ├── 📄 AdminDashboardPage.tsx
│   │   │   ├── 📄 HistoryPage.tsx
│   │   │   └── 📄 ManageAdminPage.tsx
│   │   ├── 📁 auth
│   │   │   ├── 📄 LoginPage.tsx
│   │   │   ├── 📄 LogoutPage.tsx
│   │   │   └── 📄 RegisterPage.tsx
│   │   ├── 📁 photo
│   │   │   ├── 📄 EditPhotoPage.tsx
│   │   │   ├── 📄 EventPhotosPage.tsx
│   │   │   ├── 📄 PhotoListPage.tsx
│   │   │   └── 📄 UploadPhotoPage.tsx
│   │   └── 📄 HomePage.tsx
│   ├── 📁 routes
│   │   ├── 📄 AdminRoute.tsx
│   │   ├── 📄 AppRouter.tsx
│   │   └── 📄 ProtectedRoute.tsx
│   ├── 📁 services
│   │   ├── 📄 ActivityService.ts
│   │   ├── 📄 AdminService.ts
│   │   ├── 📄 AuthService.ts
│   │   ├── 📄 EventService.ts
│   │   ├── 📄 PhotoService.ts
│   │   └── 📄 VoteService.ts
│   ├── 📁 types
│   │   ├── 📄 Activity.ts
│   │   ├── 📄 Photo.ts
│   │   ├── 📄 User.ts
│   │   └── 📄 Vote.ts
│   ├── 📁 utils
│   │   ├── 📄 apiError.ts
│   │   ├── 📄 dateHelper.ts
│   │   └── 📄 roleChecker.ts
│   ├── 📄 App.tsx
│   ├── 🎨 index.css
│   └── 📄 main.tsx
├── ⚙️ .nvmrc
├── 🐳 Dockerfile
├── 📄 eslint.config.js
├── 🌐 index.html
├── ⚙️ nginx.conf
├── ⚙️ package-lock.json
├── ⚙️ package.json
├── ⚙️ tsconfig.app.json
├── ⚙️ tsconfig.json
├── ⚙️ tsconfig.node.json
├── ⚙️ vercel.json
└── 📄 vite.config.ts
```

> ✅ 1 ไฟล์ = 1 React Function Component
> Path alias ใช้ `@/` แทน `./src/`

### 🟥 Backend

```
📁 backend
├── 📁 src
│   ├── 📁 config
│   │   ├── 📄 Database.ts
│   │   ├── 📄 EnvConfig.ts
│   │   └── 📄 JwtConfig.ts
│   ├── 📁 controllers
│   │   ├── 📄 ActivityController.ts
│   │   ├── 📄 AdminController.ts
│   │   ├── 📄 AuthController.ts
│   │   ├── 📄 EventController.ts
│   │   ├── 📄 PhotoController.ts
│   │   └── 📄 VoteController.ts
│   ├── 📁 dtos
│   │   ├── 📄 CreateActivityDTO.ts
│   │   ├── 📄 CreatePhotoDTO.ts
│   │   ├── 📄 CreateUserDTO.ts
│   │   └── 📄 VoteDTO.ts
│   ├── 📁 enums
│   │   ├── 📄 ActivityStatus.ts
│   │   └── 📄 UserRole.ts
│   ├── 📁 factories
│   │   └── 📄 UserFactory.ts
│   ├── 📁 middlewares
│   │   ├── 📄 AuthMiddleware.ts
│   │   ├── 📄 ErrorMiddleware.ts
│   │   ├── 📄 RoleMiddleware.ts
│   │   └── 📄 UploadMiddleware.ts
│   ├── 📁 models
│   │   ├── 📄 Activity.ts
│   │   ├── 📄 HistoryLog.ts
│   │   ├── 📄 Photo.ts
│   │   ├── 📄 User.ts
│   │   └── 📄 Vote.ts
│   ├── 📁 observers
│   │   ├── 📄 ActivityClosedObserver.ts
│   │   └── 📄 ActivityObserver.ts
│   ├── 📁 repositories
│   │   ├── 📄 ActivityRepository.ts
│   │   ├── 📄 EventRepository.ts
│   │   ├── 📄 HistoryRepository.ts
│   │   ├── 📄 PhotoRepository.ts
│   │   ├── 📄 UserRepository.ts
│   │   └── 📄 VoteRepository.ts
│   ├── 📁 routes
│   │   ├── 📄 ActivityRoutes.ts
│   │   ├── 📄 AdminRoutes.ts
│   │   ├── 📄 AuthRoutes.ts
│   │   ├── 📄 EventRoutes.ts
│   │   ├── 📄 HistoryRoutes.ts
│   │   ├── 📄 PhotoRoutes.ts
│   │   └── 📄 VoteRoutes.ts
│   ├── 📁 services
│   │   ├── 📄 ActivityService.ts
│   │   ├── 📄 AdminService.ts
│   │   ├── 📄 AuthService.ts
│   │   ├── 📄 HistoryService.ts
│   │   ├── 📄 LogService.ts
│   │   ├── 📄 PhotoService.ts
│   │   └── 📄 VoteService.ts
│   ├── 📁 strategies
│   │   ├── 📄 MostVoteStrategy.ts
│   │   ├── 📄 PercentageVoteStrategy.ts
│   │   └── 📄 VoteStrategy.ts
│   ├── 📁 types
│   │   ├── 📄 express.d.ts
│   │   └── 📄 index.d.ts
│   ├── 📁 utils
│   │   ├── 📄 PasswordHasher.ts
│   │   ├── 📄 TokenGenerator.ts
│   │   └── 📄 errorHandler.ts
│   └── 📄 app.ts
├── 📁 uploads
│   ├── 📁 photos
│   │   └── 🖼️ ...
│   └── 📁 thumbnails
│       └── 🖼️ ...
├── 🐳 Dockerfile
├── ⚙️ package-lock.json
├── ⚙️ package.json
└── ⚙️ tsconfig.json
```

> ✅ 1 class ต่อ 1 ไฟล์
> ใช้ MVC + Repository Pattern

### 🟩 Database

```
📁 database
├── 📁 migrations
│   ├── 📄 001_create_users.sql
│   ├── 📄 002_create_photos.sql
│   ├── 📄 003_create_activities.sql
│   ├── 📄 004_create_activity_photos.sql
│   ├── 📄 005_create_votes.sql
│   ├── 📄 006_create_events.sql
│   ├── 📄 007_create_history_logs.sql
│   ├── 📄 008_create_photo_audit_logs.sql
│   ├── 📄 009_add_foreign_keys.sql
│   └── 📄 010_seed_data.sql
└── 📄 schema.sql
```

---

## 🧩 Design Patterns

| Pattern | ใช้ตรงไหน |
|---------|----------|
| **MVC** | `controllers/` + `models/` |
| **Repository** | `repositories/` — แยก data access ออกจาก service |
| **Service Layer** | `services/` — business logic |
| **Strategy** | `strategies/` — ระบบโหวต (MostVote / Percentage) |
| **Factory** | `factories/UserFactory.ts` — สร้าง User ตาม Role |
| **Observer** | `observers/ActivityClosedObserver.ts` — ปิดกิจกรรมอัตโนมัติ |
| **Singleton** | `config/Database.ts` — DB Connection |

---

## 👥 การแบ่งหน้าที่ทีม

### 🔵 คนที่ 1 — Auth & User (Core System)
> ⚠️ ต้องทำก่อน เพราะทุก feature ต้องใช้ระบบ Login

**Backend:** `AuthRoutes` · `AuthController` · `AuthService` · `UserRepository` · `JWT Middleware` · `PasswordHasher`

**Frontend:** `LoginPage` · `RegisterPage` · `AuthContext` · `ProtectedRoute`

---

### 🟢 คนที่ 2 — Photo Feature

**Backend:** `PhotoRoutes` · `PhotoController` · `PhotoService` · `PhotoRepository`

**Frontend:** `PhotoListPage` · `PhotoCard` · `UploadPhotoPage` · `EditPhotoPage`

**เชื่อมกับ:** HistoryService (คนที่ 5)

---

### 🟣 คนที่ 3 — Activity Feature

**Backend:** `ActivityRoutes` · `ActivityController` · `ActivityService` · `ActivityRepository`

**Frontend:** `ActivityListPage` · `ActivityDetailPage` · `CreateActivityPage`

**เชื่อมกับ:** VoteService (คนที่ 4)

---

### 🔴 คนที่ 4 — Voting + Strategy
> ⚠️ ต้องทำ UNIQUE constraint และ validate โหวตซ้ำ

**Backend:** `VoteRoutes` · `VoteController` · `VoteService` · `VoteRepository` · `VoteStrategy` · `MostVoteStrategy` · `ActivityClosedObserver`

**Frontend:** `VotePage` · `VoteButton`

---

### 🟡 คนที่ 5 — Admin + History + System Integrator

**Backend:** `AdminRoutes` · `AdminController` · `AdminService` · `HistoryService` · `HistoryRepository` · `UserFactory`

**Frontend:** `ManageAdminPage` · `HistoryPage`

**Infra:** Migration · Seed · Docker · Database setup

---

### 🧠 Dependency ที่ต้องระวัง

| Feature | ต้องรอใคร |
|---------|---------|
| Vote | ต้องมี Activity ก่อน |
| Activity Close | ต้องมี Vote ก่อน |
| Admin Manage | ต้องมี Auth ก่อน |
| History | ต้องมี Service อื่นๆ ก่อน |

---

## 🚀 วิธีติดตั้งและรัน

### Prerequisites

| เครื่องมือ | ใช้ทำอะไร | Download |
|-----------|----------|---------|
| Node.js >= 18 | รัน Frontend / Backend โดยตรง | [nodejs.org](https://nodejs.org) |
| Git | Clone โปรเจค | [git-scm.com](https://git-scm.com) |
| **Docker Desktop** | รันระบบทั้งหมดผ่าน Container | [docker.com](https://www.docker.com/products/docker-desktop) |
| **Laragon** *(ทางเลือก)* | รัน MySQL + phpMyAdmin บน Windows แทน XAMPP | [laragon.org](https://laragon.org) |
| XAMPP *(ทางเลือก)* | รัน MySQL + phpMyAdmin บน Windows | [apachefriends.org](https://www.apachefriends.org) |

> 💡 เลือกวิธีรันได้ 2 แบบ: **Docker** (แนะนำ — ง่ายที่สุด ไม่ต้องติดตั้งอะไรเพิ่ม) หรือ **แยก Frontend/Backend** (สำหรับ Dev ที่ต้องการ HMR / Debug)

---

### 1. Clone โปรเจค

```bash
git clone https://github.com/Rinious19/SE-PhotoClub-WebSystem.git
cd SE-PhotoClub-WebSystem
```

---

### 2. ตั้งค่า Environment

```bash
cp .env.example .env
```

แก้ไขค่าใน `.env` ตามต้องการ:

```env
# Database
DB_HOST=db
DB_USER=photoclub
DB_PASSWORD=photoclub1234
DB_NAME=photoclub_db
DB_PORT=3306

# JWT
JWT_SECRET=your_super_secret_jwt_key_change_this
JWT_EXPIRES_IN=1d

# App (Backend)
PORT=5000
BASE_URL=http://localhost:5000

# Frontend
VITE_API_URL=http://localhost:5000
```

> **หมายเหตุ:** ไฟล์ `.env` ชุดนี้ใช้ได้ทั้ง Docker และ XAMPP/Laragon จะเปลี่ยนค่าหรือไม่เปลี่ยนก็ได้ เพราะมีค่า Default อยู่ในโค้ด
> - **Docker** — ใช้ค่านี้ได้ทันที ไม่ต้องเปลี่ยนอะไร
> - **XAMPP/Laragon** — ให้เปลี่ยน `DB_HOST=localhost`, `DB_USER=root`, `DB_PASSWORD=` (ว่าง) เพราะ MySQL บน XAMPP/Laragon ใช้ root ไม่มีรหัสผ่านเป็น default

---

## 🐳 วิธีที่ 1 — รันด้วย Docker (แนะนำ)

> ✅ ไม่ต้องติดตั้ง MySQL, Node.js หรือ phpMyAdmin แยก
> ✅ ระบบจะสร้าง Database, ตาราง และ Seed ข้อมูลตัวอย่างให้อัตโนมัติ

### รันระบบ

```bash
docker compose up -d --build
```

### Container ที่จะถูกสร้างขึ้น

| Container | Port | หน้าที่ |
|-----------|------|--------|
| `photoclub_db` | 3306 | MySQL Database Server |
| `photoclub_backend` | 5000 | Express API Server |
| `photoclub_frontend` | 3000 | React App (ผ่าน Nginx) |
| `photoclub_phpmyadmin` | 8080 | phpMyAdmin สำหรับจัดการ DB ผ่าน UI |

### URL หลังรัน

| Service | URL | หมายเหตุ |
|---------|-----|---------|
| 🌐 Frontend | http://localhost:3000 | หน้าเว็บหลัก |
| ⚙️ Backend API | http://localhost:5000 | REST API |
| 🗄️ phpMyAdmin | http://localhost:8080 | จัดการ Database |

### ข้อมูล Login สำหรับทดสอบ (Seed Data)

| Role | Username | Password |
|------|----------|---------|
| CLUB_PRESIDENT | `cp` | `123456` |
| ADMIN | `admin` | `123456` |
| EXTERNAL_USER | `user1` | `123456` |

### คำสั่งที่ใช้บ่อย

```bash
# ดู log แบบ realtime
docker logs -f photoclub_backend

# หยุดระบบ (ข้อมูลยังอยู่)
docker compose down

# หยุดและลบข้อมูลทั้งหมด (reset DB)
docker compose down -v

# รันใหม่หลังแก้โค้ด
docker compose up -d --build
```

> ⚠️ ข้อมูลใน Database จะถูกลบเมื่อใช้ `docker compose down -v` เท่านั้น การ build ใหม่ปกติข้อมูลจะยังคงอยู่

---

## 💻 วิธีที่ 2 — รันแยก Frontend / Backend (สำหรับ Dev)

> ✅ รองรับ Hot Module Replacement (HMR) — เห็นการเปลี่ยนแปลงทันทีโดยไม่ต้อง build ใหม่
> ⚠️ ต้องสร้าง Database และตารางเองผ่าน XAMPP หรือ Laragon ก่อน

### ขั้นตอนที่ 1 — เตรียม Database (ทำครั้งแรกครั้งเดียว)

**ใช้ XAMPP:**
```
1. เปิด XAMPP Control Panel → Start Apache และ MySQL
2. เปิดเบราว์เซอร์ไปที่ http://localhost/phpmyadmin
```

**ใช้ Laragon:**
```
1. เปิด Laragon → Start All
2. เปิดเบราว์เซอร์ไปที่ http://localhost/phpmyadmin
   หรือคลิก Database → phpMyAdmin จาก Laragon Menu
```

**สร้าง Database และตาราง (ทำเหมือนกันทั้ง XAMPP และ Laragon):**
```
1. คลิก "New" ที่แถบซ้าย
2. ตั้งชื่อ Database: photoclub_db → คลิก Create
3. เลือก photoclub_db → คลิกแท็บ "Import"
4. เลือกไฟล์ database/schema.sql → คลิก Go
   (ระบบจะสร้างตารางทั้งหมดให้อัตโนมัติ)
5. (ทำซ้ำขั้นตอน Import) เลือกไฟล์ database/migrations/010_seed_data.sql → คลิก Go
   (ระบบจะเพิ่มข้อมูลตัวอย่างให้)
```

### ขั้นตอนที่ 2 — แก้ไขไฟล์ `.env`

```env
# เปลี่ยนค่าเหล่านี้สำหรับ XAMPP/Laragon
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=
DB_NAME=photoclub_db
DB_PORT=3306
```

### ขั้นตอนที่ 3 — รัน Backend

```bash
cd backend
npm install
npm run dev
```

### ขั้นตอนที่ 4 — รัน Frontend (Terminal ใหม่)

```bash
cd frontend
npm install
npm run dev
```

### URL หลังรัน

| Service | URL | หมายเหตุ |
|---------|-----|---------|
| 🌐 Frontend | http://localhost:5173 | Vite Dev Server (HMR) |
| ⚙️ Backend API | http://localhost:5000 | Express API Server |
| 🗄️ phpMyAdmin | http://localhost/phpmyadmin | XAMPP/Laragon |

---

## 🔄 เปรียบเทียบ 2 วิธี

| | Docker | แยก Frontend/Backend |
|--|--------|---------------------|
| ติดตั้งง่าย | ✅ ง่ายมาก | ⚠️ ต้องตั้งค่าเพิ่ม |
| Hot Reload | ❌ ต้อง build ใหม่ | ✅ HMR ทันที |
| สร้าง DB อัตโนมัติ | ✅ | ❌ ต้อง Import เอง |
| เหมาะสำหรับ | Demo / ทดสอบระบบ | พัฒนา / Debug |

## ☁️ การนำขึ้นระบบ

โปรเจคนี้ได้รับการนำขึ้นทำงานบน Cloud Server จริง ตามโครงสร้างแบบแยกส่วน:

| ส่วน | Platform | ลิงก์ |
|---|---|---|
| **Frontend** | Vercel | 🔗 https://photoclub-web.vercel.app/ |
| **Backend** | Render | 🔗 https://photoclub-backend-api.onrender.com/ |
| **Database** | Railway | 🔒 Private  |

## 📡 API Contract

ตกลง format กลางก่อนทำ Frontend เพื่อให้ทำงานพร้อมกันได้โดยไม่ block กัน

```
POST   /api/auth/login
POST   /api/auth/register

GET    /api/photos
POST   /api/photos
PUT    /api/photos/:id
DELETE /api/photos/:id

GET    /api/activities
POST   /api/activities
PUT    /api/activities/:id

POST   /api/votes
Body: { "activityId": 1, "photoId": 5 }

GET    /api/admin/users
GET    /api/admin/history
```


---

## 📐 มาตรฐานการพัฒนา

### Naming Convention

| ประเภท | รูปแบบ | ตัวอย่าง |
|-------|--------|---------|
| ตัวแปร / ฟังก์ชัน | camelCase | `isLoggedIn`, `calculateTotalPrice` |
| Class / Component | PascalCase | `PhotoCard`, `AuthService` |
| ค่าคงที่ | UPPER_SNAKE_CASE | `MAX_FILE_SIZE`, `API_BASE_URL` |
| ชื่อไฟล์ Component | PascalCase | `PhotoCard.tsx` |
| ชื่อไฟล์ Utility | camelCase | `formatDate.ts` |

### Path Alias (Frontend)

```json
// tsconfig.app.json
"paths": {
  "@/*": ["./src/*"]
}
```

```ts
// vite.config.ts
import path from 'path'

resolve: {
  alias: { '@': path.resolve(__dirname, './src') }
}
```

### Code Quality Rules

- ✅ 1 ฟังก์ชัน = ทำหน้าที่เดียว (Single Responsibility)
- ✅ 1 React file = 1 Function Component
- ✅ 1 Backend class = 1 ไฟล์
- ✅ โค้ดที่ merge เข้า `main` ต้องผ่าน Review (การทำ Pull Request) แล้วเสมอ
- ❌ ห้าม push โดยตรงเข้า `main`
- ❌ ห้ามเขียนฟังก์ชันที่ทำหลายหน้าที่ในตัวเดียว

---

## 🌿 Git Workflow

### Branch Naming

```
feature/<ชื่อฟีเจอร์>    →  feature/login, feature/photo-upload
bugfix/<สิ่งที่แก้>      →  bugfix/navbar, bugfix/auth-error
hotfix/<urgent-fix>      →  hotfix/vote-duplicate
```

### Flow การทำงาน

```
1. สร้าง branch ใหม่จาก main
2. พัฒนาใน branch ของตัวเอง
3. Commit ด้วย Conventional Commits
4. Push ขึ้น GitHub
5. เปิด Pull Request
6. ให้เพื่อนร่วมทีม Review
7. Merge เข้า main หลัง approve
```

### Commit Message (Conventional Commits)

```
feat: add login validation
fix: resolve auth error on token expiry
docs: update API contract in README
refactor: extract vote logic to VoteService
style: format PhotoCard component
test: add unit tests for AuthService
chore: update dependencies
```

### ตัวอย่าง Commit จริง

```bash
git commit -m "feat: add photo upload with file size validation"
git commit -m "fix: prevent duplicate vote in same activity"
git commit -m "refactor: move vote calculation to MostVoteStrategy"
```

---

## 💬 Comment Style

ใช้ [Better Comments](https://marketplace.visualstudio.com/items?itemName=aaron-bond.better-comments) — **เขียน Comment เป็นภาษาไทย**

```ts
//? หัวข้อหลัก (Heading 1)
//@ หัวข้อรอง (Heading 2)
//* เนื้อหาสำคัญ / context
// คำอธิบายทั่วไป
//! สิ่งสำคัญมาก / คำเตือน / ข้อควรระวัง
```

**ตัวอย่างการใช้งาน:**

```ts
//? Auth Service
//@ ฟังก์ชันหลักสำหรับ Login

//* ตรวจสอบ password ด้วย bcrypt ก่อน generate token เสมอ
async login(email: string, password: string): Promise<string> {
  // หา user จาก database ด้วย email
  const user = await this.userRepository.findByEmail(email);

  //! ถ้าไม่พบ user ให้ throw error ทันที ห้าม return null
  if (!user) throw new UnauthorizedException('ไม่พบผู้ใช้งาน');

  const isMatch = await PasswordHasher.compare(password, user.passwordHash);
  if (!isMatch) throw new UnauthorizedException('รหัสผ่านไม่ถูกต้อง');

  return TokenGenerator.generate(user);
}
```

---

## 📚 เอกสารประกอบ

เอกสารที่เกี่ยวข้องกับโปรเจค SE-PhotoClub-WebSystem

| เอกสาร | ลิงก์ |
|--------|------|
| 📋 SRS (Software Requirements Specification) | [ดูเอกสาร SRS](https://docs.google.com/document/d/1YK2DgzR5SJJrx-wJA_qQ6HHewsiyXZMehbVI2qO2nl0/edit?tab=t.tlcjalggt3ws) |
| 📖 User Manual | [ดูคู่มือผู้ใช้](https://docs.google.com/document/d/14AbnEyj28UkdfLPUsh3Xd549t-Jb8UQi5K1NAGJX1Jo/edit?tab=t.0) |
| 💻 Code Manual | [ดูคู่มือโค้ด](https://docs.google.com/document/d/1k-8NojLRzFgZZLm3cJI7bEq4oFYBxPqTlG0f3E_Y5Zg/edit?tab=t.0) |

---

## 👨‍💻 สมาชิกในทีม

| รหัสนักศึกษา | ชื่อ - นามสกุล |
|-------------|----------------|
| 6704062612049 | นายกันตธี ตระกูลเงิน |
| 6704062612138 | นายกรินทร์ สุขสอาด |
| 6704062612146 | นายพีชกร เกษมเนตร |
| 6704062612308 | นายทศพร เพ็ญธิสาร |
| 6704062612341 | นายพัสกร วิเชษฐ์พันธุ์ |

---

## 📄 License

โปรเจคนี้เป็นส่วนหนึ่งของวิชา Software Engineering — เพื่อการศึกษาเท่านั้น

---

<div align="center">
  <sub>Made with ❤️ by SE-PhotoClub Team</sub>
</div>
