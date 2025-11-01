import express from 'express';
import http from 'http';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { Server, Socket } from 'socket.io';

// 프로젝트 루트 경로 설정 (현재 작업 디렉토리에서 한 단계 위로)
const projectRoot = path.resolve(process.cwd(), '..');
import pool from './config/database';
import jwt from 'jsonwebtoken';
import { JWT_SECRET } from './config/jwt';
import authRoutes from './routes/auth.routes';
import classroomRoutes from './routes/classroom.routes';
import reservationRoutes from './routes/reservation.routes';
import waitlistRoutes from './routes/waitlist.routes';
import statisticsRoutes from './routes/statistics.routes';
import notificationRoutes from './routes/notification.routes';
import { startNotificationScheduler } from './utils/scheduler';

dotenv.config();

const app = express();
const server = http.createServer(app);

// Socket.IO 서버 초기화
export const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
    credentials: true
  },
  transports: ['polling', 'websocket'],
  allowEIO3: true
});

// Socket.IO JWT 인증 미들웨어
io.use(async (socket: Socket, next) => {
  try {
    const token = socket.handshake.auth.token;
    if (!token) {
      return next(new Error('Authentication error'));
    }
    const decoded = jwt.verify(token, JWT_SECRET) as { id: number; role: string };
    (socket as any).data.userId = decoded.id;
    next();
  } catch (error) {
    next(new Error('Authentication error'));
  }
});

// Socket.IO 연결 핸들러
io.on('connection', (socket: Socket) => {
  // 강의실 구독
  socket.on('subscribe:classroom', (classroomId: number) => {
    socket.join(`classroom:${classroomId}`);
  });

  // 강의실 구독 해제
  socket.on('unsubscribe:classroom', (classroomId: number) => {
    socket.leave(`classroom:${classroomId}`);
  });
});

// 미들웨어
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 정적 파일 서빙 (프론트엔드 빌드 파일) - API 라우트보다 먼저 설정
app.use(express.static(path.join(projectRoot, 'frontend/dist')));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// 라우트 연결
app.use('/api/auth', authRoutes);
app.use('/api/classrooms', classroomRoutes);
app.use('/api/reservations', reservationRoutes);
app.use('/api/waitlist', waitlistRoutes);
app.use('/api/statistics', statisticsRoutes);
app.use('/api/notifications', notificationRoutes);

// SPA 라우팅 - API 경로가 아닌 모든 요청을 프론트엔드로
app.use((req: express.Request, res: express.Response, next: express.NextFunction) => {
  // API 경로나 health check는 제외
  if (req.path.startsWith('/api') || req.path.startsWith('/health')) {
    return next();
  }
  // 정적 파일 요청도 제외 (이미 express.static이 처리)
  if (req.path.includes('.')) {
    return next();
  }
  // 그 외 모든 경로는 프론트엔드 index.html 반환 (SPA 라우팅)
  res.sendFile(path.join(projectRoot, 'frontend/dist/index.html'));
});

// 404 핸들러 (API 경로 매칭 실패 시)
app.use('/api', (req: express.Request, res: express.Response) => {
  res.status(404).json({ 
    error: 'Not Found',
    path: req.originalUrl,
    method: req.method
  });
});

// 에러 핸들러
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  res.status(500).json({ error: 'Internal server error' });
});

const PORT = parseInt(process.env.PORT || '8000', 10);

server.listen(PORT, '0.0.0.0', () => {
  // Server started
});

// 테이블 초기화
async function initializeDatabase() {
  try {
    const { initializeDatabase, createDefaultAdmin } = await import('./config/init');
    await initializeDatabase();
    await createDefaultAdmin();
  } catch (error) {
    // Database initialization failed
  }
}

initializeDatabase().then(() => {
  // 알림 스케줄러 시작 (데이터베이스 초기화 후)
  startNotificationScheduler();
}).catch(() => {
  // Database initialization failed
});

