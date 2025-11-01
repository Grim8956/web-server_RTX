# 404 에러 해결 가이드

## 발생 가능한 원인

### 1. ngrok URL 설정 오류
**증상**: 브라우저 콘솔에 "Failed to load resource: 404" 에러

**확인 사항**:
- `frontend/.env` 파일의 `VITE_API_BASE_URL`이 올바른지 확인
- ngrok URL 뒤에 `/api` 경로가 포함되어 있는지 확인
  - ✅ 올바름: `https://xxxx-xxxx-xxxx.ngrok-free.app/api`
  - ❌ 잘못됨: `https://xxxx-xxxx-xxxx.ngrok-free.app` (뒤에 `/api` 없음)

### 2. ngrok 세션 만료
**증상**: 처음엔 작동했지만 갑자기 404 에러 발생

**해결 방법**:
- ngrok 세션은 2시간마다 만료됩니다
- 새로운 ngrok 터널을 생성하고 `.env` 파일을 업데이트하세요
- 또는 `ngrok http 127.0.0.1:8000` 명령어로 재연결

### 3. 백엔드 서버 미실행
**증상**: 모든 API 요청이 404

**확인 방법**:
```bash
# 백엔드 서버가 실행 중인지 확인
cd backend
npm run dev
```

콘솔에 "Server running on port 8000"이 보여야 합니다.

### 4. API 경로 불일치
**증상**: 특정 API만 404

**확인 방법**:
- 브라우저 개발자 도구 → Network 탭에서 실제 요청 URL 확인
- 백엔드 콘솔에서 404 로그 확인:
  ```
  404 Not Found: GET /api/classrooms
  ```

### 5. 프론트엔드 환경 변수 미적용
**증상**: 여전히 `localhost:8000`로 요청

**해결 방법**:
1. `frontend/.env` 파일 확인
2. 프론트엔드 서버 재시작:
   ```bash
   cd frontend
   npm run dev
   ```
3. 브라우저 캐시 삭제 또는 강력 새로고침 (Ctrl+Shift+R)

## 디버깅 방법

### 1. 백엔드 로그 확인
백엔드 콘솔에서 다음과 같은 로그를 확인하세요:
```
404 Not Found: GET /api/classrooms
Requested path: /api/classrooms
```

### 2. 네트워크 탭 확인
브라우저 개발자 도구 → Network 탭에서:
- 실제 요청 URL 확인
- 응답 헤더 확인
- 에러 메시지 확인

### 3. API 테스트
```bash
# Health check
curl https://your-ngrok-url.ngrok-free.app/health

# 또는 로컬 테스트
curl http://localhost:8000/health
```

### 4. 환경 변수 확인
```bash
# 프론트엔드 디렉토리에서
cat .env

# 또는 PowerShell
Get-Content .env
```

## 빠른 해결 체크리스트

- [ ] 백엔드 서버가 실행 중인가? (`npm run dev`)
- [ ] ngrok이 실행 중인가? (`ngrok http 127.0.0.1:8000`)
- [ ] `frontend/.env` 파일이 존재하는가?
- [ ] `VITE_API_BASE_URL`이 `https://...ngrok-free.app/api` 형식인가?
- [ ] 프론트엔드를 재시작했는가?
- [ ] 브라우저를 새로고침했는가?
- [ ] 백엔드 콘솔에서 404 로그를 확인했는가?

## 자주 발생하는 실수

1. **ngrok URL 뒤에 `/api` 빠뜨림**
   ```env
   # ❌ 잘못됨
   VITE_API_BASE_URL=https://xxxx.ngrok-free.app
   
   # ✅ 올바름
   VITE_API_BASE_URL=https://xxxx.ngrok-free.app/api
   ```

2. **http vs https 혼동**
   ```env
   # ❌ 잘못됨
   VITE_API_BASE_URL=http://xxxx.ngrok-free.app/api
   
   # ✅ 올바름 (ngrok은 항상 https)
   VITE_API_BASE_URL=https://xxxx.ngrok-free.app/api
   ```

3. **환경 변수 변경 후 재시작 안 함**
   - `.env` 파일 변경 후 반드시 프론트엔드 재시작 필요

