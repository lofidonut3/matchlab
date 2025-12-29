# MatchLab - AI 팀 매칭 서비스

> 창업자를 위한 최적의 팀원 매칭 플랫폼

## 🎯 개요

MatchLab은 창업 MBTI 기반 매칭과 2주간의 케미 테스트를 통해 진짜 함께할 팀원을 찾아주는 서비스입니다.

### 핵심 기능

- **정밀한 매칭**: 창업 MBTI와 경력, 목표를 분석해 최적의 팀원을 추천
- **신뢰 검증**: LinkedIn, GitHub 등 증빙 링크와 팀원 후기로 신뢰도 확인
- **케미 테스트**: 2주간 미니 프로젝트로 실제 협업 호환성 검증

## 🛠 기술 스택

### Frontend
- React 18 + TypeScript
- Vite
- Tailwind CSS
- Zustand (상태관리)
- React Router v6
- React Hook Form + Zod

### Backend
- Node.js 20+ / Express.js
- Prisma ORM
- SQLite (개발) / PostgreSQL (운영)
- JWT Authentication

### Monorepo
- pnpm workspaces

## 📁 프로젝트 구조

```
matchlab/
├── packages/
│   ├── shared/           # 공유 타입, 상수, 유틸리티
│   │   └── src/
│   │       ├── constants/
│   │       ├── types/
│   │       └── utils/
│   ├── backend/          # Express API 서버
│   │   ├── prisma/
│   │   │   ├── schema.prisma
│   │   │   └── seed.ts
│   │   └── src/
│   │       ├── config/
│   │       ├── lib/
│   │       ├── middleware/
│   │       ├── routes/
│   │       └── services/
│   └── frontend/         # React SPA
│       └── src/
│           ├── components/
│           ├── layouts/
│           ├── pages/
│           ├── services/
│           └── stores/
├── docs/                 # 문서
├── package.json
├── pnpm-workspace.yaml
└── tsconfig.base.json
```

## 🚀 시작하기

### 필수 요구사항

- Node.js 20.x 이상
- pnpm 8.x 이상

### 설치

```bash
# 저장소 클론
git clone <repository-url>
cd matchlab

# pnpm 설치 (없는 경우)
npm install -g pnpm

# 의존성 설치
pnpm install

# 환경 변수 설정
cp packages/backend/.env.example packages/backend/.env
# .env 파일을 열어 필요한 값 설정

# 데이터베이스 설정
pnpm db:generate
pnpm db:push

# 시드 데이터 생성 (테스트 계정 및 30명의 데모 사용자)
pnpm db:seed
```

### 개발 서버 실행

```bash
# 백엔드 + 프론트엔드 동시 실행
pnpm dev

# 또는 개별 실행
pnpm dev:backend   # http://localhost:3001
pnpm dev:frontend  # http://localhost:5173
```

### 테스트 계정

시드 데이터 실행 후 다음 계정으로 로그인할 수 있습니다:

- **이메일**: `test@matchlab.test`
- **비밀번호**: `password123`

## 📋 API 명세

### 인증 (Auth)
| Method | Endpoint | 설명 |
|--------|----------|------|
| POST | `/api/auth/register` | 회원가입 |
| POST | `/api/auth/login` | 로그인 |
| GET | `/api/auth/me` | 현재 사용자 정보 |

### 프로필 (Profile)
| Method | Endpoint | 설명 |
|--------|----------|------|
| POST | `/api/profile/onboarding` | 온보딩 완료 |
| GET | `/api/profile/me` | 내 프로필 조회 |
| PATCH | `/api/profile/me` | 프로필 수정 |
| GET | `/api/profile/:userId` | 타인 프로필 조회 |
| POST | `/api/profile/evidence` | 증빙 링크 추가 |

### 매칭 (Matching)
| Method | Endpoint | 설명 |
|--------|----------|------|
| GET | `/api/matching/recommendations` | Top 10 추천 |
| GET | `/api/matching/:targetUserId` | 매칭 상세 |
| GET | `/api/matching/explore` | 필터 탐색 |

### 초대 (Invite)
| Method | Endpoint | 설명 |
|--------|----------|------|
| POST | `/api/invites` | 초대 전송 |
| GET | `/api/invites` | 보낸/받은 초대 조회 |
| POST | `/api/invites/:id/accept` | 초대 수락 |
| POST | `/api/invites/:id/decline` | 초대 거절 |

### 팀 (Team)
| Method | Endpoint | 설명 |
|--------|----------|------|
| GET | `/api/teams` | 내 팀 목록 |
| GET | `/api/teams/:id` | 팀 상세 |
| POST | `/api/teams/:id/checkins` | 체크인 제출 |
| PATCH | `/api/teams/:id/checklist/:itemId/toggle` | 체크리스트 토글 |
| POST | `/api/teams/:id/finish` | 팀 종료 |
| POST | `/api/teams/:id/feedback` | 피드백 작성 |

### 알림 (Notification)
| Method | Endpoint | 설명 |
|--------|----------|------|
| GET | `/api/notifications` | 알림 목록 |
| PATCH | `/api/notifications/:id/read` | 읽음 처리 |
| PATCH | `/api/notifications/read-all` | 전체 읽음 |
| GET | `/api/notifications/unread-count` | 읽지 않은 수 |

## 🧮 매칭 알고리즘

### 점수 산정 (100점 만점)

```
총점 = 안정성(60%) + 시너지(30%) + 신뢰도(10%) - 패널티
```

#### 안정성 점수 (60%)
- 시간 호환성: 투입 가능 시간 차이
- 위치 호환성: 근무 형태 선호도
- 시작일 호환성: 합류 가능 시점

#### 시너지 점수 (30%)
- 역할 상보성: CEO-CTO, 빌더-허슬러 등
- 도메인 매칭: 같은 도메인 보너스
- 성향 유사도: 창업 MBTI 코사인 유사도

#### 신뢰 점수 (10%)
- 증빙 링크 수
- 팀 완료 횟수
- 평균 평점

#### 패널티
- COMMIT_GAP_HIGH: -15점 (시간 차이 >20시간)
- GOAL_CONFLICT: -20점 (목표 충돌)
- STYLE_EXTREME_CLASH: -10점 (극단적 성향 차이)

### 하드 필터
- 시간 허용 범위: ±50%
- 시작일 허용 범위: 1개월

## 🔒 환경 변수

```env
# packages/backend/.env

# 서버 설정
PORT=3001
NODE_ENV=development

# 데이터베이스
DATABASE_URL="file:./dev.db"

# JWT
JWT_SECRET=your-super-secret-jwt-key-here
JWT_EXPIRES_IN=7d

# 프론트엔드 URL (CORS)
FRONTEND_URL=http://localhost:5173
```

## 📊 데이터베이스 스키마

### 주요 엔티티
- **User**: 사용자 기본 정보
- **Profile**: 온보딩 정보 (역할, 도메인, 투입시간 등)
- **TraitResult**: 창업 MBTI 결과
- **TrustScore**: 신뢰 점수
- **MatchScore**: 매칭 점수 (캐시)
- **Invite**: 초대
- **Team**: 팀
- **Sprint**: 2주 스프린트
- **ChecklistItem**: 체크리스트 항목
- **CheckIn**: 체크인 기록
- **Feedback**: 피드백
- **Notification**: 알림

## 🎨 UI 페이지

1. **랜딩 페이지** `/` - 서비스 소개
2. **로그인/회원가입** `/login`, `/register`
3. **온보딩** `/onboarding` - 7단계 프로필 설정
4. **추천** `/recommend` - Top 10 추천 팀원
5. **탐색** `/explore` - 필터 검색
6. **프로필 상세** `/profile/:userId` - 매칭 분석
7. **받은 요청** `/inbox` - 초대 관리
8. **팀 목록** `/teams` - 진행중/완료 팀
9. **팀 상세** `/teams/:id` - 스프린트 보드
10. **체크인** `/teams/:id/checkin`
11. **내 프로필** `/my-profile`, `/my-profile/edit`
12. **알림** `/notifications`

## 🧪 테스트

```bash
# 전체 테스트
pnpm test

# 백엔드 테스트
pnpm --filter @matchlab/backend test

# 프론트엔드 테스트
pnpm --filter @matchlab/frontend test
```

## 📝 라이선스

MIT License

---

Made with ❤️ by MatchLab Team
