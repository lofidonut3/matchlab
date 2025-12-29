# MatchLab 아키텍처 문서

## 기술 스택

### Frontend
- **Framework**: React 18 + TypeScript
- **Build Tool**: Vite
- **Routing**: React Router v6
- **State Management**: Zustand (경량, 간단)
- **Styling**: Tailwind CSS
- **HTTP Client**: Axios
- **Form**: React Hook Form + Zod validation

### Backend
- **Runtime**: Node.js 20+
- **Framework**: Express.js + TypeScript
- **ORM**: Prisma
- **Database**: SQLite (dev) → PostgreSQL (prod)
- **Authentication**: JWT + bcrypt
- **Validation**: Zod

### DevOps (로컬 개발)
- **Package Manager**: pnpm (모노레포)
- **Testing**: Vitest + Supertest
- **Linting**: ESLint + Prettier

---

## 폴더 구조

```
matchlab/
├── docs/                           # 문서
│   ├── MVP_REQUIREMENTS.md
│   └── ARCHITECTURE.md
│
├── packages/
│   ├── shared/                     # 공유 타입/유틸
│   │   ├── src/
│   │   │   ├── types/              # 공통 타입 정의
│   │   │   ├── constants/          # 상수 (역할, 도메인 등)
│   │   │   └── utils/              # 공유 유틸리티
│   │   └── package.json
│   │
│   ├── backend/                    # Express API 서버
│   │   ├── prisma/
│   │   │   └── schema.prisma       # 데이터 모델
│   │   ├── src/
│   │   │   ├── index.ts            # 엔트리포인트
│   │   │   ├── config/             # 환경설정
│   │   │   ├── middleware/         # 인증, 에러핸들링
│   │   │   ├── routes/             # API 라우트
│   │   │   ├── controllers/        # 컨트롤러
│   │   │   ├── services/           # 비즈니스 로직
│   │   │   │   ├── matching/       # 매칭 로직 (핵심)
│   │   │   │   │   ├── hardFilter.ts
│   │   │   │   │   ├── scoreCalculator.ts
│   │   │   │   │   └── explanationGenerator.ts
│   │   │   │   ├── risk/           # 리스크 감지
│   │   │   │   └── notification/   # 알림
│   │   │   └── utils/
│   │   ├── tests/                  # 테스트
│   │   └── package.json
│   │
│   └── frontend/                   # React 앱
│       ├── src/
│       │   ├── main.tsx
│       │   ├── App.tsx
│       │   ├── components/         # 재사용 컴포넌트
│       │   │   ├── common/
│       │   │   ├── onboarding/
│       │   │   ├── matching/
│       │   │   ├── team/
│       │   │   └── layout/
│       │   ├── pages/              # 페이지 컴포넌트
│       │   ├── hooks/              # 커스텀 훅
│       │   ├── stores/             # Zustand 스토어
│       │   ├── services/           # API 호출
│       │   ├── utils/
│       │   └── types/
│       ├── public/
│       └── package.json
│
├── package.json                    # 루트 (workspaces)
├── pnpm-workspace.yaml
├── tsconfig.base.json
└── README.md
```

---

## 시스템 아키텍처

```
┌─────────────────────────────────────────────────────────────┐
│                        Frontend (React)                      │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌────────┐│
│  │Onboarding│ │Recommend│ │  Inbox  │ │  Team   │ │Profile ││
│  └─────────┘ └─────────┘ └─────────┘ └─────────┘ └────────┘│
└────────────────────────────┬────────────────────────────────┘
                             │ HTTP/REST
                             ▼
┌─────────────────────────────────────────────────────────────┐
│                     Backend (Express)                        │
│  ┌──────────────────────────────────────────────────────┐   │
│  │                    Middleware                          │   │
│  │  • JWT Auth  • Error Handler  • Request Validation    │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                              │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌────────┐│
│  │  Auth   │ │ Profile │ │ Matching│ │  Team   │ │CheckIn ││
│  │ Routes  │ │ Routes  │ │ Routes  │ │ Routes  │ │ Routes ││
│  └────┬────┘ └────┬────┘ └────┬────┘ └────┬────┘ └───┬────┘│
│       │          │          │          │          │      │
│  ┌────▼──────────▼──────────▼──────────▼──────────▼────┐  │
│  │                     Services                          │  │
│  │  ┌─────────────────────────────────────────────────┐ │  │
│  │  │              Matching Engine                     │ │  │
│  │  │  • Hard Filter  • Score Calculator              │ │  │
│  │  │  • Explanation Generator (Rule-based)           │ │  │
│  │  └─────────────────────────────────────────────────┘ │  │
│  │  ┌─────────────────────────────────────────────────┐ │  │
│  │  │              Risk Detector                       │ │  │
│  │  │  • CheckIn Monitor  • Inactivity Tracker        │ │  │
│  │  └─────────────────────────────────────────────────┘ │  │
│  └──────────────────────────────────────────────────────┘  │
└────────────────────────────┬────────────────────────────────┘
                             │ Prisma ORM
                             ▼
┌─────────────────────────────────────────────────────────────┐
│                    Database (SQLite/PostgreSQL)              │
│  User, Profile, TraitResult, MatchScore, Team, Sprint, etc. │
└─────────────────────────────────────────────────────────────┘
```

---

## 핵심 모듈 설명

### 1. Matching Engine (매칭 엔진)
MVP의 핵심. 세 개의 서브모듈로 구성:

#### 1.1 Hard Filter
- 시작 가능 시점 호환성 체크
- 주당 투입 시간 범위 체크 (±50% 허용)
- 원격/지역 호환성 체크
- 부족 역할 충족 여부 체크

#### 1.2 Score Calculator
```
최종점수 = (안정성 × 0.6) + (시너지 × 0.3) + (신뢰 × 0.1) - 패널티

안정성 (Stability): 0-100
  - 목표 정렬도 (25%)
  - 커밋 정렬도 (25%)
  - 소통 규칙 유사도 (20%)
  - 의사결정 스타일 유사도 (15%)
  - 갈등 대응 유사도 (15%)

시너지 (Synergy): 0-100
  - 역할 상보성 (50%)
  - 스킬 상보성 (30%)
  - 도메인 네트워크 상보성 (20%)

신뢰 (Trust): 0-100
  - 프로필 완성도 (40%)
  - 근거 링크 수 (30%)
  - 활동성 (20%)
  - 평판 점수 (10%)

패널티:
  - 커밋 격차 과대: -15
  - 목표 충돌: -20
  - 극단 충돌: -10
```

#### 1.3 Explanation Generator
룰 기반 템플릿으로 추천 이유와 주의점 생성:
- reasons_top3: 점수 기여도 상위 3개 항목을 템플릿 문장으로 변환
- caution1: 패널티/경계 항목 중 가장 큰 것을 경고 문장으로 변환

### 2. Risk Detector (리스크 감지)
체크인 데이터 기반 팀 건강 상태 모니터링:
- 체크인 미응답 연속 2회 이상 → 경고
- 만족도 3점 이하 또는 2점 이상 하락 → 경고
- 메시지 미응답 SLA 초과 → 경고
- 복합 리스크 시 "조정 제안" 카드 생성

---

## API 구조 요약

| 도메인 | 엔드포인트 | 설명 |
|--------|-----------|------|
| Auth | POST /api/auth/register | 회원가입 |
| Auth | POST /api/auth/login | 로그인 |
| Profile | GET/PUT /api/profile | 프로필 조회/수정 |
| Onboarding | POST /api/onboarding | 온보딩 데이터 저장 |
| Matching | GET /api/matches/recommendations | Top10 추천 |
| Matching | GET /api/matches/:id | 매칭 상세 |
| Explore | GET /api/explore | 탐색 (필터) |
| Invite | POST /api/invites | 초대 보내기 |
| Invite | PUT /api/invites/:id | 수락/거절 |
| Message | GET/POST /api/messages | 메시지 |
| Team | GET /api/teams/:id | 팀 조회 |
| Sprint | GET /api/sprints/:id | 스프린트 조회 |
| CheckIn | POST /api/checkins | 체크인 제출 |
| Feedback | POST /api/feedbacks | 종료 피드백 |
| Notification | GET /api/notifications | 알림 목록 |

---

## 화면(라우트) 설계

| 경로 | 페이지 | 설명 |
|------|--------|------|
| / | Landing | 랜딩 페이지 |
| /login | Login | 로그인 |
| /register | Register | 회원가입 |
| /onboarding | Onboarding | 온보딩 (단계별) |
| /recommend | Recommend | 추천 Top10 |
| /explore | Explore | 탐색/검색 |
| /profile/:id | Profile | 프로필 상세 |
| /profile/edit | ProfileEdit | 내 프로필 수정 |
| /inbox | Inbox | 받은/보낸 초대, 메시지 |
| /inbox/:conversationId | Conversation | 대화 상세 |
| /teams/:id | Team | 팀 대시보드 |
| /teams/:id/board | Board | 2주 미션 보드 |
| /teams/:id/checkin | CheckIn | 체크인 폼 |
| /teams/:id/finish | Finish | 종료/피드백 |
| /notifications | Notifications | 알림 목록 |
