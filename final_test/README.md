# 학교 출석 프로그램

기말 프로젝트 - 학교 출석 관리 시스템

## 기술 스택

### 백엔드
- Node.js + Express
- Sequelize ORM
- MySQL
- JWT + Refresh Token (HttpOnly Cookie)

### 프론트엔드
- React + Vite
- Context API (상태 관리)
- 단색(Gray-scale) CSS 테마
- 모바일 퍼스트 디자인

## 설치 및 실행

### 백엔드

1. 백엔드 디렉토리로 이동
```bash
cd backend
```

2. 의존성 설치
```bash
npm install
```

3. 환경 변수 설정
`.env.example`을 참고하여 `.env` 파일 생성

4. 데이터베이스 마이그레이션 및 시드 데이터 생성
```bash
npm run db:migrate
npm run db:seed
```

또는 한 번에:
```bash
npm run db:reset
```

5. 서버 실행
```bash
npm run dev
```

서버는 `http://localhost:3000`에서 실행됩니다.

### 프론트엔드

1. 프론트엔드 디렉토리로 이동
```bash
cd frontend
```

2. 의존성 설치
```bash
npm install
```

3. 개발 서버 실행
```bash
npm run dev
```

프론트엔드는 `http://localhost:5173`에서 실행됩니다.

## 프로젝트 구조

```
.
├── backend/
│   ├── config/          # 데이터베이스 설정
│   ├── controllers/     # 컨트롤러
│   ├── middleware/      # 미들웨어 (인증, 에러 핸들러 등)
│   ├── models/          # Sequelize 모델
│   ├── routes/          # 라우트
│   ├── scripts/         # 스크립트 (마이그레이션 등)
│   ├── utils/           # 유틸리티 함수
│   └── server.js        # 서버 진입점
│
└── frontend/
    ├── src/
    │   ├── components/  # 컴포넌트
    │   ├── contexts/    # Context API
    │   ├── pages/       # 페이지
    │   └── App.jsx      # 앱 진입점
    └── index.html
```

## 주요 기능

- ✅ 사용자 인증 (JWT + Refresh Token)
- ✅ 역할 기반 접근 제어 (Admin, Instructor, Student)
- ✅ 수업 세션 관리
- ✅ 출석 체크 (인증번호, 호명)
- ✅ 공결 신청 및 승인
- ✅ 이의제기
- ✅ 엑셀 수강신청
- ✅ 공지사항 및 메시지
- ✅ 투표 시스템
- ✅ 출석 리포트
- ✅ 감사 로그

## API 문서

API는 `/api` prefix를 사용합니다.

### 인증
- `POST /api/auth/login` - 로그인
- `POST /api/auth/refresh` - 토큰 갱신
- `POST /api/auth/logout` - 로그아웃

자세한 API 문서는 추후 작성 예정입니다.

## 데이터베이스

MySQL 데이터베이스를 사용합니다. 주요 테이블:
- Users
- Departments
- Semesters
- Courses
- ClassSessions
- Attendances
- ExcuseRequests
- Appeals
- 등등...

## 기본 계정 정보

데이터베이스 시드 실행 후 다음 계정으로 로그인할 수 있습니다:

### 관리자
- 이메일: `admin@school.edu`
- 비밀번호: `Admin@2024!Secure`

### 교원
- 이메일: `instructor@school.edu`
- 비밀번호: `Instructor@2024!Teach`

### 학생
- 이메일: `student@school.edu`
- 비밀번호: `Student@2024!Learn`
- 학번: `202321001`

## 라이선스

이 프로젝트는 기말 프로젝트용으로 제작되었습니다.

