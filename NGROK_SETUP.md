# ngrok 배포 가이드

ngrok을 사용하여 로컬 서버를 외부에 노출시키는 방법입니다.

## 1. ngrok 설치

### Windows (PowerShell)
```powershell
# Chocolatey 사용
choco install ngrok

# 또는 직접 다운로드
# https://ngrok.com/download 에서 다운로드 후 PATH에 추가
```

### macOS
```bash
brew install ngrok
```

### Linux
```bash
# Snap 사용
sudo snap install ngrok

# 또는 직접 다운로드
# https://ngrok.com/download
```

## 2. ngrok 계정 생성 및 인증 토큰 설정

1. https://ngrok.com 에서 무료 계정 생성
2. Dashboard에서 인증 토큰(Authtoken) 복사
3. 다음 명령어로 토큰 설정:
```bash
ngrok config add-authtoken YOUR_AUTH_TOKEN
```

## 3. 백엔드 서버 실행

백엔드 서버를 먼저 실행합니다:

```bash
cd backend
npm install
npm run dev
# 또는
npm start
```

기본 포트: `8000`

## 4. ngrok 터널 생성

새 터미널에서 다음 명령어 실행:

**방법 1: IPv4 명시적 지정 (권장)**
```bash
ngrok http 127.0.0.1:8000
```

**방법 2: 일반 명령어**
```bash
ngrok http 8000
```

**방법 3: 고정 도메인 사용**
```bash
ngrok http 127.0.0.1:8000 --domain=your-domain.ngrok.io
```

**참고**: `127.0.0.1:8000`을 사용하면 IPv4로 강제하여 IPv6 관련 문제를 방지할 수 있습니다.

ngrok이 실행되면 다음과 같은 정보가 표시됩니다:
```
Forwarding  https://xxxx-xxxx-xxxx.ngrok-free.app -> http://localhost:8000
```

**중요**: `https://xxxx-xxxx-xxxx.ngrok-free.app` 이 URL을 복사하세요!

## 5. 프론트엔드 빌드

프론트엔드를 빌드하여 백엔드에서 서빙할 수 있도록 합니다:

**5-1. 프론트엔드 환경 변수 설정**

프론트엔드 루트 디렉토리(`frontend/`)에 `.env.production` 파일을 생성:

```env
VITE_API_BASE_URL=https://xxxx-xxxx-xxxx.ngrok-free.app/api
VITE_SOCKET_URL=https://xxxx-xxxx-xxxx.ngrok-free.app
```

**주의**: 
- `xxxx-xxxx-xxxx` 부분을 실제 ngrok에서 제공하는 도메인으로 변경하세요!
- 예시: `https://a1b2c3d4e5f6.ngrok-free.app`

**예시 파일 생성 방법 (PowerShell):**
```powershell
cd frontend
@"
VITE_API_BASE_URL=https://xxxx-xxxx-xxxx.ngrok-free.app/api
VITE_SOCKET_URL=https://xxxx-xxxx-xxxx.ngrok-free.app
"@ | Out-File -FilePath .env.production -Encoding utf8
```

**5-2. 프론트엔드 빌드**

```bash
cd frontend
npm run build
```

빌드가 완료되면 `frontend/dist` 폴더에 빌드 파일이 생성됩니다.

**5-3. 백엔드 재시작**

프론트엔드 빌드 후 백엔드 서버를 재시작하면 자동으로 프론트엔드가 서빙됩니다:

```bash
cd backend
npm run dev
```

## 7. Socket.IO CORS 설정 확인

Socket.IO는 이미 CORS를 허용하도록 설정되어 있습니다 (`origin: '*'`).

## 8. ngrok 무료 플랜 제한사항

- 세션 시간: 2시간 (자동 재연결 필요)
- 도메인: 매번 변경됨 (고정 도메인은 유료 플랜)
- 동시 연결: 제한 없음

## 문제 해결

### ngrok 연결이 안 될 때
1. **백엔드 서버 실행 확인**
   - 백엔드 서버가 실행 중인지 확인: `npm run dev` 또는 `npm start`
   - 콘솔에 "Server running on port 8000" 메시지가 보이는지 확인
   
2. **포트 확인**
   - 백엔드가 실제로 8000 포트에서 실행 중인지 확인
   - PowerShell: `netstat -ano | findstr :8000`
   - 다른 포트에서 실행 중이라면 ngrok 명령어도 해당 포트로 변경

3. **서버 바인딩 확인**
   - 서버 코드에서 `server.listen(PORT, '0.0.0.0')`로 모든 인터페이스에 바인딩되어 있는지 확인
   - (이미 최신 코드에 반영됨)

4. **방화벽 설정 확인**
   - Windows 방화벽에서 Node.js 또는 포트 8000 허용 확인

5. **ngrok 인증 토큰 확인**
   - `ngrok config check` 명령어로 설정 확인
   - 올바른 인증 토큰이 설정되었는지 확인

### "failed to establish connection to the upstream" 에러
이 에러는 ngrok이 로컬 서버에 연결하지 못할 때 발생합니다:

**ERR_NGROK_8012 에러 (IPv6 관련):**
```
dial tcp [::1]:8000: connectex: No connection could be made because the target machine actively refused it.
```
이 에러는 ngrok이 IPv6 주소([::1])로 연결을 시도하는데 실패할 때 발생합니다.

**해결 방법:**

1. **백엔드 서버 실행 확인**
   ```bash
   cd backend
   npm run dev
   ```
   콘솔에 "Server running on port 8000" 메시지가 보여야 합니다.

2. **ngrok을 IPv4로 강제**
   ```bash
   ngrok http 127.0.0.1:8000
   ```
   또는 ngrok 설정 파일에 추가:
   ```yaml
   version: "2"
   authtoken: YOUR_TOKEN
   tunnels:
     backend:
       addr: 127.0.0.1:8000
       proto: http
   ```
   그 다음: `ngrok start backend`

3. **포트 확인**
   - 백엔드가 실제로 8000 포트에서 실행 중인지 확인
   - PowerShell: `netstat -ano | findstr :8000`
   - 다른 포트에서 실행 중이라면 ngrok 명령어도 해당 포트로 변경

### Socket.IO 연결 실패
1. 프론트엔드 `.env` 파일의 `VITE_SOCKET_URL`이 올바른지 확인
2. 브라우저 콘솔에서 에러 메시지 확인
3. Socket.IO CORS 설정 확인

### API 요청 실패
1. 프론트엔드 `.env` 파일의 `VITE_API_BASE_URL`이 올바른지 확인
2. ngrok URL이 올바른지 확인 (`/api` 경로 포함)
3. 네트워크 탭에서 요청 URL 확인

