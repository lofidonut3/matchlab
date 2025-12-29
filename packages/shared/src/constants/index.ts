// MatchLab 공유 상수

// 역할 카테고리
export const ROLES = {
  PLANNING: 'planning',      // 기획
  DEVELOPMENT: 'development', // 개발
  DESIGN: 'design',          // 디자인
  MARKETING: 'marketing',    // 마케팅
  OPERATIONS: 'operations',  // 운영
  OTHER: 'other',            // 기타
} as const;

export const ROLE_LABELS: Record<string, string> = {
  [ROLES.PLANNING]: '기획',
  [ROLES.DEVELOPMENT]: '개발',
  [ROLES.DESIGN]: '디자인',
  [ROLES.MARKETING]: '마케팅',
  [ROLES.OPERATIONS]: '운영',
  [ROLES.OTHER]: '기타',
};

// 도메인 카테고리
export const DOMAINS = {
  COMMERCE: 'commerce',       // 커머스
  FINTECH: 'fintech',         // 핀테크
  HEALTHCARE: 'healthcare',   // 헬스케어
  EDUCATION: 'education',     // 교육
  CONTENT: 'content',         // 콘텐츠
  B2B_SAAS: 'b2b_saas',       // B2B SaaS
  OTHER: 'other',             // 기타
} as const;

export const DOMAIN_LABELS: Record<string, string> = {
  [DOMAINS.COMMERCE]: '커머스',
  [DOMAINS.FINTECH]: '핀테크',
  [DOMAINS.HEALTHCARE]: '헬스케어',
  [DOMAINS.EDUCATION]: '교육',
  [DOMAINS.CONTENT]: '콘텐츠',
  [DOMAINS.B2B_SAAS]: 'B2B SaaS',
  [DOMAINS.OTHER]: '기타',
};

// 목표 유형
export const GOALS = {
  INVESTMENT: 'investment',     // 투자유치
  REVENUE: 'revenue',           // 매출창출
  TECH_VALIDATION: 'tech_validation', // 기술검증
  SIDE_PROJECT: 'side_project', // 사이드프로젝트
  HACKATHON: 'hackathon',       // 해커톤
} as const;

export const GOAL_LABELS: Record<string, string> = {
  [GOALS.INVESTMENT]: '투자유치',
  [GOALS.REVENUE]: '매출창출',
  [GOALS.TECH_VALIDATION]: '기술검증',
  [GOALS.SIDE_PROJECT]: '사이드프로젝트',
  [GOALS.HACKATHON]: '해커톤',
};

// 소통 채널
export const COMM_CHANNELS = {
  SLACK: 'slack',
  DISCORD: 'discord',
  KAKAO: 'kakao',
  ZOOM: 'zoom',
  NOTION: 'notion',
  OTHER: 'other',
} as const;

// 응답 SLA (시간 단위)
export const RESPONSE_SLA = {
  WITHIN_1H: 1,
  WITHIN_4H: 4,
  WITHIN_12H: 12,
  WITHIN_24H: 24,
  WITHIN_48H: 48,
} as const;

// 미팅 빈도
export const MEETING_FREQ = {
  DAILY: 'daily',
  TWICE_WEEK: 'twice_week',
  WEEKLY: 'weekly',
  BIWEEKLY: 'biweekly',
} as const;

export const MEETING_FREQ_LABELS: Record<string, string> = {
  [MEETING_FREQ.DAILY]: '매일',
  [MEETING_FREQ.TWICE_WEEK]: '주 2회',
  [MEETING_FREQ.WEEKLY]: '주 1회',
  [MEETING_FREQ.BIWEEKLY]: '격주',
};

// 의사결정 스타일 (1-5 척도)
export const DECISION_STYLES = {
  CONSENSUS_VS_TOPDOWN: 'consensus_vs_topdown',     // 합의 vs 탑다운
  DATA_VS_INTUITION: 'data_vs_intuition',           // 데이터 vs 직관
  FAST_VS_THOROUGH: 'fast_vs_thorough',             // 빠른결정 vs 신중
  FLEXIBLE_VS_PRINCIPLE: 'flexible_vs_principle',   // 유연 vs 원칙
  RISK_TAKING_VS_SAFE: 'risk_taking_vs_safe',       // 리스크테이킹 vs 안전
} as const;

// 갈등 대응 스타일
export const CONFLICT_STYLES = {
  DIRECT: 'direct',         // 직접 대면
  INDIRECT: 'indirect',     // 간접/중재
  AVOID: 'avoid',           // 회피
  COMPROMISE: 'compromise', // 타협
} as const;

export const CONFLICT_STYLE_LABELS: Record<string, string> = {
  [CONFLICT_STYLES.DIRECT]: '직접 대면',
  [CONFLICT_STYLES.INDIRECT]: '간접/중재 선호',
  [CONFLICT_STYLES.AVOID]: '회피 성향',
  [CONFLICT_STYLES.COMPROMISE]: '타협 추구',
};

// 위치/원격 선호
export const LOCATION_PREF = {
  REMOTE_ONLY: 'remote_only',
  ONSITE_ONLY: 'onsite_only',
  HYBRID: 'hybrid',
  FLEXIBLE: 'flexible',
} as const;

export const LOCATION_PREF_LABELS: Record<string, string> = {
  [LOCATION_PREF.REMOTE_ONLY]: '원격만',
  [LOCATION_PREF.ONSITE_ONLY]: '대면만',
  [LOCATION_PREF.HYBRID]: '하이브리드',
  [LOCATION_PREF.FLEXIBLE]: '유연',
};

// 창업 MBTI 질문 (6문항)
export const TRAIT_QUESTIONS = [
  {
    id: 'leadership',
    question: '팀에서 어떤 역할을 선호하나요?',
    optionA: '방향을 제시하고 이끄는 역할',
    optionB: '팀원들과 함께 논의하며 따라가는 역할',
    traitAxis: 'leadership', // Leader vs Follower
  },
  {
    id: 'execution',
    question: '일을 진행할 때 어떤 스타일인가요?',
    optionA: '일단 빠르게 실행하고 수정한다',
    optionB: '충분히 계획하고 준비한 뒤 실행한다',
    traitAxis: 'execution', // Fast vs Thorough
  },
  {
    id: 'communication',
    question: '소통 방식은 어떤가요?',
    optionA: '수시로 짧게 연락하는 게 좋다',
    optionB: '정해진 시간에 깊게 논의하는 게 좋다',
    traitAxis: 'communication', // Frequent vs Scheduled
  },
  {
    id: 'risk',
    question: '리스크에 대한 태도는?',
    optionA: '큰 기회를 위해 리스크를 감수한다',
    optionB: '안정적으로 확실한 것을 추구한다',
    traitAxis: 'risk', // Risk-taking vs Risk-averse
  },
  {
    id: 'conflict',
    question: '의견 충돌이 있을 때는?',
    optionA: '바로 직접 이야기해서 해결한다',
    optionB: '시간을 두고 정리한 뒤 대화한다',
    traitAxis: 'conflict', // Direct vs Indirect
  },
  {
    id: 'flexibility',
    question: '계획이 변경될 때 어떤가요?',
    optionA: '상황에 맞게 유연하게 대응한다',
    optionB: '원래 계획을 최대한 지키려 한다',
    traitAxis: 'flexibility', // Flexible vs Structured
  },
] as const;

// 초대 상태
export const INVITE_STATUS = {
  PENDING: 'pending',
  ACCEPTED: 'accepted',
  DECLINED: 'declined',
  EXPIRED: 'expired',
} as const;

// 팀 상태
export const TEAM_STATUS = {
  ACTIVE: 'active',
  COMPLETED: 'completed',
  DISSOLVED: 'dissolved',
} as const;

// 스프린트 상태
export const SPRINT_STATUS = {
  NOT_STARTED: 'not_started',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
} as const;

// 체크인 만족도 (1-5)
export const SATISFACTION_LEVELS = {
  VERY_DISSATISFIED: 1,
  DISSATISFIED: 2,
  NEUTRAL: 3,
  SATISFIED: 4,
  VERY_SATISFIED: 5,
} as const;

// 팀 종료 결정
export const TEAM_DECISION = {
  CONTINUE: 'continue',     // 팀 유지
  DISSOLVE: 'dissolve',     // 해산
  REMATCH: 'rematch',       // 리매칭
} as const;

// 알림 유형
export const NOTIFICATION_TYPE = {
  NEW_MATCH: 'new_match',           // 새 고적합 후보
  INVITE_RECEIVED: 'invite_received',
  INVITE_ACCEPTED: 'invite_accepted',
  INVITE_DECLINED: 'invite_declined',
  CHECKIN_REMINDER: 'checkin_reminder',
  SPRINT_START: 'sprint_start',
  SPRINT_END: 'sprint_end',
  RISK_WARNING: 'risk_warning',
  INACTIVITY_WARNING: 'inactivity_warning',
  MESSAGE_RECEIVED: 'message_received',
} as const;

// 신고 유형
export const REPORT_TYPE = {
  SPAM: 'spam',
  HARASSMENT: 'harassment',
  FAKE_PROFILE: 'fake_profile',
  GHOST: 'ghost',           // 잠수
  OTHER: 'other',
} as const;

// 증거 링크 유형
export const EVIDENCE_TYPE = {
  GITHUB: 'github',
  NOTION: 'notion',
  PORTFOLIO: 'portfolio',
  LINKEDIN: 'linkedin',
  BLOG: 'blog',
  OTHER: 'other',
} as const;

// 매칭 스코어 가중치
export const MATCHING_WEIGHTS = {
  STABILITY: 0.6,
  SYNERGY: 0.3,
  TRUST: 0.1,
} as const;

// 패널티 점수
export const PENALTIES = {
  COMMIT_GAP_HIGH: 15,      // 커밋 격차 과대
  GOAL_CONFLICT: 20,        // 목표 충돌
  STYLE_EXTREME_CLASH: 10,  // 극단 충돌
} as const;

// =========================================
// 배열 형태 옵션 (UI Select/Radio용)
// =========================================

export const ROLE_OPTIONS = [
  { value: 'planning', label: '기획' },
  { value: 'development', label: '개발' },
  { value: 'design', label: '디자인' },
  { value: 'marketing', label: '마케팅' },
  { value: 'operations', label: '운영' },
  { value: 'other', label: '기타' },
] as const;

export const DOMAIN_OPTIONS = [
  { value: 'commerce', label: '커머스' },
  { value: 'fintech', label: '핀테크' },
  { value: 'healthcare', label: '헬스케어' },
  { value: 'education', label: '교육' },
  { value: 'content', label: '콘텐츠' },
  { value: 'b2b_saas', label: 'B2B SaaS' },
  { value: 'other', label: '기타' },
] as const;

export const GOAL_OPTIONS = [
  { value: 'investment', label: '투자유치' },
  { value: 'revenue', label: '매출창출' },
  { value: 'tech_validation', label: '기술검증' },
  { value: 'side_project', label: '사이드프로젝트' },
  { value: 'hackathon', label: '해커톤' },
] as const;

export const LOCATION_OPTIONS = [
  { value: 'remote_only', label: '원격만' },
  { value: 'onsite_only', label: '대면만' },
  { value: 'hybrid', label: '하이브리드' },
  { value: 'flexible', label: '유연' },
] as const;

export const MEETING_FREQ_OPTIONS = [
  { value: 'daily', label: '매일' },
  { value: 'twice_week', label: '주 2회' },
  { value: 'weekly', label: '주 1회' },
  { value: 'biweekly', label: '격주' },
] as const;
