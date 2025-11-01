# 실시간 강의실 예약 시스템 개발 계획서

## 📋 프로젝트 개요

Node.js + Express + MySQL 백엔드와 React + Tailwind CSS 프론트엔드로 구축하는 실시간 강의실 예약 시스템입니다. Socket.io를 통한 실시간 업데이트, 대기열 시스템, 자동 알림 기능 등을 포함합니다.

## ✅ 완료된 기능

### 백엔드 (Backend)
- ✅ Express 서버 구성 및 TypeScript 설정
- ✅ MySQL 데이터베이스 연결 및 초기화
- ✅ JWT 기반 인증 시스템
- ✅ Socket.io 실시간 통신 설정
- ✅ 인증 API (회원가입, 로그인, 로그아웃)
- ✅ 강의실 CRUD API (조회, 생성, 수정, 삭제)
- ✅ 강의실 검색 및 필터링 API
- ✅ 예약 API (생성, 조회, 취소)
- ✅ 대기열 API (신청, 조회)
- ✅ 알림 API (조회, 읽음 처리)
- ✅ 통계 API (인기 강의실 Top 5)
- ✅ 예약 겹침 검증 로직
- ✅ 개인당 최대 3개 활성 예약 제한
- ✅ 7일 이내 예약 제한
- ✅ 대기열 자동 할당 로직
- ✅ 예약 30분 전 알림 스케줄러 (node-cron)
- ✅ 기본 관리자 계정 생성

### 프론트엔드 (Frontend)
- ✅ React + TypeScript + Vite 설정
- ✅ Tailwind CSS 설정
- ✅ React Router v6 라우팅
- ✅ AuthContext 및 SocketContext 구현
- ✅ 로그인 화면 구현
- ✅ 회원가입 화면 구현
- ✅ 기본 대시보드 화면 구현
- ✅ API 클라이언트 설정 (Axios)
- ✅ Socket.io 클라이언트 설정

## 🚧 진행 중 / 미완료 기능

### 프론트엔드 UI 구현 필요
1. **레이아웃 컴포넌트**
   - 네비게이션 바 (로그아웃, 사용자 정보)
   - 사이드바 (메뉴)
   - 관리자/학생 권한별 메뉴 구분

2. **강의실 관리 화면 (Admin 전용)**
   - 강의실 목록 조회
   - 강의실 추가 폼
   - 강의실 수정 폼
   - 강의실 삭제 기능

3. **예약 관련 화면**
   - 강의실 타임라인 화면 (시간대별 예약 현황)
   - 예약 생성 폼
   - 내 예약 목록
   - 예약 취소 기능
   - 실시간 예약 현황 업데이트 (Socket.io 연동)

4. **검색 및 필터 화면**
   - 빈 강의실 검색
   - 수용인원 필터
   - 프로젝터 필터
   - 화이트보드 필터

5. **대기열 화면**
   - 대기 신청 기능
   - 내 대기 목록 조회
   - 대기 순서 표시

6. **알림 화면**
   - 알림 목록 조회
   - 읽지 않은 알림 표시
   - 알림 읽음 처리
   - 실시간 알림 수신

7. **통계 화면 (Admin 전용)**
   - 인기 강의실 Top 5 차트

8. **대시보드 개선**
   - 최근 예약 목록
   - 다가오는 예약
   - 알림 요약

## 🎯 우선순위별 개발 계획

### Phase 1: 기본 레이아웃 및 강의실 관리 (1-2주)
- [ ] 공통 레이아웃 컴포넌트 구현
  - NavigationBar
  - Sidebar
  - 공통 스타일링
- [ ] 강의실 목록 화면 구현
- [ ] 강의실 추가/수정/삭제 기능 구현
- [ ] 관리자 권한 확인 및 라우트 보호

### Phase 2: 예약 시스템 구현 (2-3주)
- [ ] 강의실 타임라인 화면 구현
  - 시간대별 예약 상태 표시
  - 실시간 업데이트 연동
- [ ] 예약 생성 폼 구현
  - 날짜/시간 선택
  - 참여자 추가
  - 검증 로직
- [ ] 내 예약 목록 화면 구현
- [ ] 예약 취소 기능 구현

### Phase 3: 검색 및 필터링 (1주)
- [ ] 빈 강의실 검색 화면 구현
- [ ] 필터 옵션 UI 구현
- [ ] 검색 결과 표시

### Phase 4: 대기열 시스템 (1주)
- [ ] 대기 신청 화면 구현
- [ ] 대기 목록 화면 구현
- [ ] 대기 할당 알림 연동

### Phase 5: 알림 시스템 (1주)
- [ ] 알림 목록 화면 구현
- [ ] 알림 읽음 처리
- [ ] 실시간 알림 수신
- [ ] 알림 뱃지 표시

### Phase 6: 통계 및 개선 (1주)
- [ ] 통계 화면 구현 (차트)
- [ ] 대시보드 개선
- [ ] 반응형 디자인 최적화
- [ ] 에러 핸들링 개선

## 🛠 기술 스택

### Backend
- **Runtime**: Node.js
- **Framework**: Express
- **Language**: TypeScript
- **Database**: MySQL (mysql2)
- **Real-time**: Socket.io
- **Authentication**: JWT (jsonwebtoken)
- **Password**: bcryptjs
- **Scheduler**: node-cron
- **CORS**: cors
- **Environment**: dotenv

### Frontend
- **Framework**: React 19
- **Language**: TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS 4
- **Routing**: React Router v7
- **HTTP Client**: Axios
- **Real-time**: Socket.io-client
- **Code Quality**: ESLint

## 📁 프로젝트 구조

```
.
├── backend/
│   ├── src/
│   │   ├── config/          # DB, JWT 설정
│   │   ├── controllers/     # 컨트롤러
│   │   ├── middleware/      # 인증 미들웨어
│   │   ├── routes/          # 라우트 정의
│   │   ├── services/        # 비즈니스 로직
│   │   ├── utils/           # 유틸리티 (검증, 스케줄러)
│   │   ├── types/           # 타입 정의
│   │   └── server.ts        # 서버 진입점
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── components/      # 컴포넌트
│   │   │   ├── Auth/       # 인증 관련 (완료)
│   │   │   ├── Layout/     # 레이아웃 (예정)
│   │   │   ├── Classroom/  # 강의실 관리 (예정)
│   │   │   ├── Reservation/# 예약 (예정)
│   │   │   ├── Notification/# 알림 (예정)
│   │   │   └── Statistics/ # 통계 (예정)
│   │   ├── context/         # Context API (완료)
│   │   ├── services/        # API, Socket 서비스 (완료)
│   │   ├── types/           # 타입 정의
│   │   ├── App.tsx          # 메인 앱
│   │   └── main.tsx         # 진입점
│   └── package.json
│
└── README.md
```

## 🔐 주요 비즈니스 로직

### 예약 정책
1. 과거 시간 예약 불가
2. 1시간 단위 정시 예약만 가능 (14:00~15:00, 15:00~16:00 등)
3. 개인당 활성 예약 최대 3개
4. 최대 7일 전까지만 예약 가능
5. 시간 겹침 검증 (예: 14:00~16:00 예약이 있을 때 15:00~17:00 차단)

### 대기열 정책
1. 예약이 꽉 찬 시간대에 대기 신청 가능
2. 예약 취소 시 대기열 1순위 자동 할당
3. 대기열 순서는 선착순

### 알림 정책
1. 예약 30분 전 자동 알림
2. 대기열 할당 시 알림
3. 알림 읽음 처리

## 🧪 테스트 계획 (추후)

- [ ] 백엔드 단위 테스트 (각 API 엔드포인트)
- [ ] 프론트엔드 컴포넌트 테스트
- [ ] 통합 테스트
- [ ] E2E 테스트

## 🚀 배포 계획 (추후)

- [ ] Backend: Railway, AWS, 또는 Heroku
- [ ] Frontend: Vercel, Netlify, 또는 AWS S3
- [ ] Database: MySQL 호스팅 (AWS RDS, PlanetScale 등)

## 📝 참고사항

### 초기 관리자 계정
- 학번: `admin`
- 비밀번호: `admin123`

### 실행 방법
```bash
# Backend
cd backend
npm install
npm run dev  # http://localhost:5000

# Frontend
cd frontend
npm install
npm run dev  # http://localhost:5173
```

## 📌 다음 단계

1. 공통 레이아웃 컴포넌트 구현 시작
2. 강의실 관리 화면 구현
3. 예약 시스템 UI 구현
4. 실시간 업데이트 연동
5. 알림 시스템 UI 구현

