# 실시간 강의실 예약 시스템

Node.js + Express + MySQL 백엔드와 React + Tailwind CSS 프론트엔드를 Monorepo 구조로 구축한 실시간 강의실 예약 시스템입니다.

## 주요 기능

### 인증

- 학생(Student)과 관리자(Admin) 역할 구분
- JWT 토큰 기반 인증
- 회원가입, 로그인, 로그아웃

### 강의실 관리 (Admin 전용)

- 강의실 CRUD (이름, 위치, 수용인원)
- 비품 정보 등록 (프로젝터, 화이트보드)

### 예약 시스템

- 실시간 예약 생성 및 조회
- 예약 겹침 검증
- 과거 시간 예약 차단
- 1시간 단위 정시 예약
- 개인당 최대 3개 활성 예약 제한
- 7일 이내 예약만 가능
- 그룹 예약 (참여자 추가)

### 검색 및 필터링

- 빈 강의실 검색
- 수용인원, 프로젝터, 화이트보드 필터링

### 대기열

- 예약 꽉 찬 시간대 대기 신청
- 예약 취소 시 1순위 자동 할당

### 실시간 업데이트

- Socket.io를 통한 실시간 예약 현황 업데이트
- 예약 생성/취소 시 즉시 반영

### 알림

- 예약 30분 전 자동 알림 (node-cron)
- 알림 읽음 처리

### 통계 (Admin 전용)

- 인기 강의실 Top 5

## 기술 스택

### Backend

- Node.js + Express
- TypeScript
- MySQL (mysql2)
- Socket.io
- JWT (jsonwebtoken)
- bcryptjs
- node-cron

### Frontend

- React + TypeScript
- Vite
- Tailwind CSS
- React Router v6
- Socket.io-client
- Axios

## 설치 및 실행

### Prerequisites

- Node.js (v18 이상)
- MySQL (v8 이상)

### Database 설정

1. MySQL 데이터베이스 생성:

```sql
CREATE DATABASE classroom_reservation;
```

2. 환경 변수 설정 (`backend/.env`):

```env
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=classroom_reservation

JWT_SECRET=your-super-secret-key
JWT_EXPIRES_IN=24h

PORT=8000
```

### Backend 실행

```bash
cd backend
npm install
npm run dev
```

서버는 http://localhost:8000 에서 실행됩니다.

초기 관리자 계정:

- 학번: `admin`
- 비밀번호: `admin123`

### Frontend 실행

```bash
cd frontend
npm install
npm run dev
```

프론트엔드는 http://localhost:5173 에서 실행됩니다.

### 테스트 데이터 삽입 (선택사항)

테스트를 위한 샘플 데이터가 필요하다면:

```bash
# MySQL 접속
mysql -u root -p classroom_reservation

# 시드 데이터 실행
source backend/src/config/seed.sql
```

또는:

```bash
mysql -u root -p classroom_reservation < backend/src/config/seed.sql
```

테스트 계정:

- 학생: 학번 `2023001`~`2023005`, 비밀번호 `test1234`
- 강의실: 10개 (101호~토의실)
- 예약: 오늘, 내일, 모레 등 다양한 날짜의 예약 데이터
- 대기열: 일부 대기 신청 데이터

## API 엔드포인트

### 인증

- `POST /api/auth/register` - 회원가입
- `POST /api/auth/login` - 로그인
- `POST /api/auth/logout` - 로그아웃

### 강의실 (인증 필요)

- `GET /api/classrooms` - 전체 강의실 조회
- `GET /api/classrooms/:id` - 특정 강의실 조회
- `GET /api/classrooms/available` - 빈 강의실 검색 (필터링)

### 강의실 관리 (Admin 전용)

- `POST /api/classrooms` - 강의실 생성
- `PUT /api/classrooms/:id` - 강의실 수정
- `DELETE /api/classrooms/:id` - 강의실 삭제

### 예약 (인증 필요)

- `POST /api/reservations` - 예약 생성
- `GET /api/reservations/my` - 내 예약 목록
- `GET /api/reservations/classroom/:id` - 강의실 타임라인 조회
- `DELETE /api/reservations/:id` - 예약 취소

### 대기열 (인증 필요)

- `POST /api/waitlist` - 대기 신청
- `GET /api/waitlist/my` - 내 대기 목록

### 알림 (인증 필요)

- `GET /api/notifications` - 내 알림 목록
- `PUT /api/notifications/:id/read` - 알림 읽음 처리

### 통계 (Admin 전용)

- `GET /api/statistics/top-classrooms` - 인기 강의실 Top 5

## Socket.io 이벤트

### 클라이언트 → 서버

- `subscribe:classroom` - 강의실 구독
- `unsubscribe:classroom` - 강의실 구독 해제

### 서버 → 클라이언트

- `reservation:created` - 예약 생성 알림
- `reservation:cancelled` - 예약 취소 알림
- `waitlist:assigned` - 대기열 할당 알림

## 프로젝트 구조

```
.
├── backend/
│   ├── src/
│   │   ├── config/
│   │   │   ├── database.ts
│   │   │   ├── jwt.ts
│   │   │   ├── init.sql
│   │   │   ├── init.ts
│   │   │   └── seed.sql
│   │   ├── middleware/
│   │   │   └── auth.ts
│   │   ├── routes/
│   │   │   ├── auth.routes.ts
│   │   │   ├── classroom.routes.ts
│   │   │   ├── reservation.routes.ts
│   │   │   ├── waitlist.routes.ts
│   │   │   ├── notification.routes.ts
│   │   │   └── statistics.routes.ts
│   │   ├── controllers/
│   │   │   ├── auth.controller.ts
│   │   │   ├── classroom.controller.ts
│   │   │   ├── reservation.controller.ts
│   │   │   ├── waitlist.controller.ts
│   │   │   ├── notification.controller.ts
│   │   │   └── statistics.controller.ts
│   │   ├── services/
│   │   │   └── waitlist.service.ts
│   │   ├── utils/
│   │   │   ├── validation.ts
│   │   │   └── scheduler.ts
│   │   ├── types/
│   │   │   └── index.ts
│   │   └── server.ts
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Auth/
│   │   │   │   ├── LoginForm.tsx
│   │   │   │   └── RegisterForm.tsx
│   │   │   ├── Classroom/
│   │   │   │   ├── ClassroomManagement.tsx
│   │   │   │   └── ClassroomTimeline.tsx
│   │   │   ├── Reservation/
│   │   │   │   └── ReservationForm.tsx
│   │   │   └── Layout/
│   │   │       └── Header.tsx
│   │   ├── pages/
│   │   │   ├── Dashboard.tsx
│   │   │   ├── MyReservations.tsx
│   │   │   ├── Search.tsx
│   │   │   ├── Notifications.tsx
│   │   │   └── Statistics.tsx
│   │   ├── context/
│   │   │   ├── AuthContext.tsx
│   │   │   └── SocketContext.tsx
│   │   ├── services/
│   │   │   ├── api.ts
│   │   │   └── socket.ts
│   │   ├── types/
│   │   │   └── index.ts
│   │   ├── App.tsx
│   │   └── main.tsx
│   └── package.json
└── README.md
```

## 예약 정책

1. 과거 시간 예약 불가
2. 1시간 단위 정시 예약만 가능 (14:00~15:00, 15:00~16:00 등)
3. 개인당 활성 예약 최대 3개
4. 최대 7일 전까지만 예약 가능
5. 시간 겹침 검증 (예: 14:00~16:00 예약이 있을 때 15:00~17:00 차단)

## 프론트엔드 화면

- ✅ 로그인/회원가입 화면
- ✅ 메인 대시보드
- ✅ 강의실 관리 화면 (Admin)
- ✅ 실시간 타임라인 화면
- ✅ 예약 생성 및 내 예약 목록 화면
- ✅ 빈 강의실 검색 화면
- ✅ 알림 목록 화면
- ✅ 통계 화면 (Admin)

## 라이선스

MIT
