// MatchLab 공유 타입 정의

// 역할 타입
export type Role = 'planning' | 'development' | 'design' | 'marketing' | 'operations' | 'other';

// 도메인 타입
export type Domain = 'commerce' | 'fintech' | 'healthcare' | 'education' | 'content' | 'b2b_saas' | 'other';

// 목표 타입
export type Goal = 'investment' | 'revenue' | 'tech_validation' | 'side_project' | 'hackathon';

// 위치 선호
export type LocationPref = 'remote_only' | 'onsite_only' | 'hybrid' | 'flexible';

// 소통 채널
export type CommChannel = 'slack' | 'discord' | 'kakao' | 'zoom' | 'notion' | 'other';

// 미팅 빈도
export type MeetingFreq = 'daily' | 'twice_week' | 'weekly' | 'biweekly';

// 갈등 스타일
export type ConflictStyle = 'direct' | 'indirect' | 'avoid' | 'compromise';

// 초대 상태
export type InviteStatus = 'pending' | 'accepted' | 'declined' | 'expired';

// 팀 상태
export type TeamStatus = 'active' | 'completed' | 'dissolved';

// 스프린트 상태
export type SprintStatus = 'not_started' | 'in_progress' | 'completed' | 'cancelled';

// 팀 결정
export type TeamDecision = 'continue' | 'dissolve' | 'rematch';

// 알림 유형
export type NotificationType = 
  | 'new_match' 
  | 'invite_received' 
  | 'invite_accepted' 
  | 'invite_declined'
  | 'checkin_reminder'
  | 'sprint_start'
  | 'sprint_end'
  | 'risk_warning'
  | 'inactivity_warning'
  | 'message_received';

// 신고 유형
export type ReportType = 'spam' | 'harassment' | 'fake_profile' | 'ghost' | 'other';

// 증거 링크 유형
export type EvidenceType = 'github' | 'notion' | 'portfolio' | 'linkedin' | 'blog' | 'other';

// 성향 축
export type TraitAxis = 'leadership' | 'execution' | 'communication' | 'risk' | 'conflict' | 'flexibility';

// =========================================
// API Request/Response 타입
// =========================================

// 회원가입
export interface RegisterRequest {
  email: string;
  password: string;
  nickname: string;
}

export interface AuthResponse {
  token: string;
  user: UserBasic;
}

// 로그인
export interface LoginRequest {
  email: string;
  password: string;
}

// 사용자 기본 정보
export interface UserBasic {
  id: string;
  email: string;
  nickname: string;
  profileCompleted: boolean;
  createdAt: string;
}

// User 타입 alias (auth store에서 사용)
export type User = UserBasic;

// 온보딩 요청
export interface OnboardingRequest {
  // 필수 항목
  availabilityHours: number;        // 주당 투입시간
  startDate: string;                // 시작 가능 시점 (ISO date)
  roleNeed: Role;                   // 찾는 역할 1개
  domain: Domain;                   // 도메인 카테고리
  goal: Goal;                       // 목표
  locationPref: LocationPref;       // 원격/지역 선호
  
  // 창업 MBTI ID (외부 진단 결과 ID, 선택)
  startupMbtiId?: string;           // 예: PST2512ME63603
  
  // 창업 MBTI 응답 (6문항, A=1, B=2) - deprecated, 하위호환용
  traitAnswers?: Record<TraitAxis, 1 | 2>;
}

// 프로필
export interface ProfileData {
  id: string;
  userId: string;
  nickname: string;
  bio?: string;
  location?: string;
  locationPref: LocationPref;
  availabilityHours: number;
  startDate: string;
  domains: Domain[];
  roleCan: Role[];                  // 할 수 있는 역할
  roleWant: Role[];                 // 하고 싶은 역할
  roleNeed: Role[];                 // 찾는 역할 (부족)
  skills: string[];
  commChannel?: CommChannel;
  responseSla?: number;             // 응답 SLA (시간)
  meetingFreq?: MeetingFreq;
  goal: Goal;
  
  // 의사결정 스타일 (1-5 척도)
  decisionConsensus?: number;
  decisionData?: number;
  decisionSpeed?: number;
  decisionFlexibility?: number;
  decisionRisk?: number;
  
  conflictStyle?: ConflictStyle;
  
  // 성향 결과
  traits?: TraitResult;
  
  // 완성도
  completeness: number;
  
  // 증거 링크
  evidenceLinks?: EvidenceLink[];
  
  // 신뢰도
  trustScore?: TrustScore;
}

// 성향 결과
export interface TraitResult {
  leadership: number;       // 1-2 (1=리더, 2=팔로워)
  execution: number;        // 1-2 (1=빠름, 2=신중)
  communication: number;    // 1-2 (1=수시, 2=정기)
  risk: number;             // 1-2 (1=리스크추구, 2=안정추구)
  conflict: number;         // 1-2 (1=직접, 2=간접)
  flexibility: number;      // 1-2 (1=유연, 2=체계)
}

// =========================================
// 창업 MBTI (외부 진단 데이터)
// =========================================

// 창업 MBTI 전체 결과
export interface StartupMBTI {
  id: string;
  userId: string;
  externalId: string;       // 외부 시스템 ID (PST2512ME63603 형식)
  
  // 기본 정보
  mbtiType: string;         // ISTP, INFP 등
  mbtiTitle?: string;       // "실용적인 문제해결사" 등

  // 창업자 기본 성향 (0-100)
  innovationLearning: number;   // 혁신 & 학습
  sensitivityNervous: number;   // 예민 & 신경
  socialActivity: number;       // 사교 & 활동
  cooperationCare: number;      // 협력 & 배려
  planExecution: number;        // 계획 & 추진

  // 완벽주의 성향 (0-100)
  apPerfectionism: number;      // AP: 내부적 완벽 추구
  eopPerfectionism: number;     // EOP: 외부 평가 기반 완벽
  iopPerfectionism: number;     // IOP: 이상 추구형 완벽

  // 동기 요인 (0-100)
  motivationGrowth: number;     // 성장
  motivationAchieve: number;    // 성취
  motivationRecognition: number; // 인정

  // 보상 요인 (0-100)
  rewardCompensation: number;   // 보상 (급여)
  rewardAutonomy: number;       // 자율성
  rewardStability: number;      // 안정성

  // 파트너쉽 유형 (0-100)
  partnerSelfishness: number;   // 이기심
  partnerCooperation: number;   // 동업성향
  partnerEntrepreneurship: number; // 기업가정신

  // 스트레스
  stressIndex: number;          // 스트레스 지수 (0-100)
}

// StartupMBTI 호환성 점수
export interface StartupMBTICompatibility {
  overall: number;              // 전체 호환성 (0-100)
  
  // 카테고리별 호환성
  founderTrait: number;         // 창업자 기본 성향 호환성
  perfectionism: number;        // 완벽주의 호환성
  motivation: number;           // 동기 요인 호환성
  reward: number;               // 보상 요인 호환성
  partnership: number;          // 파트너쉽 호환성
  
  // 설명
  strengths: string[];          // 강점 (상호보완/유사점)
  cautions: string[];           // 주의점 (잠재적 충돌)
}

// 증거 링크
export interface EvidenceLink {
  id: string;
  type: EvidenceType;
  url: string;
  title?: string;
  summary?: string;
  tags?: string[];
  verifiedByUser: boolean;
  createdAt: string;
}

// 신뢰도 점수
export interface TrustScore {
  completeness: number;     // 프로필 완성도 (0-100)
  evidenceStrength: number; // 근거 강도 (0-100)
  activity: number;         // 활동성 (0-100)
  reputation: number;       // 평판 (0-100)
  total: number;            // 종합 (0-100)
}

// =========================================
// 매칭 관련 타입
// =========================================

// 매칭 스코어
export interface MatchScore {
  candidateId: string;
  stability: number;        // 안정성 점수 (0-100)
  synergy: number;          // 시너지 점수 (0-100)
  trust: number;            // 신뢰 점수 (0-100)
  penalties: number;        // 패널티 합계
  total: number;            // 최종 점수
  reasonsTop3: string[];    // 추천 이유 Top3
  caution: string | null;   // 주의점 1개
}

// 추천 카드 (UI용)
export interface RecommendCard {
  profile: ProfileData;
  matchScore: MatchScore;
}

// 추천 결과 (API 응답용)
export interface MatchRecommendation {
  userId: string;
  nickname: string;
  profile: ProfileData;
  matchScore: MatchScore;
  explanation: {
    reasons: string[];
    caution: string | null;
  };
}

// 매칭 상세
export interface MatchDetail {
  userId: string;
  nickname: string;
  profile: ProfileData;
  traitResult?: TraitResult;
  trustScore?: TrustScore;
  matchScore: MatchScore;
  explanation: {
    reasons: string[];
    caution: string | null;
  };
}

// 탐색 필터
export interface ExploreFilters {
  domains?: string[];
  roles?: string[];
  goals?: string[];
  locationPref?: string[];
  minHours?: number;
  maxHours?: number;
}

// 탐색 필터 (레거시)
export interface ExploreFilter {
  domains?: Domain[];
  roles?: Role[];
  goals?: Goal[];
  locationPref?: LocationPref[];
  minHours?: number;
  maxHours?: number;
  startDateBefore?: string;
}

// =========================================
// 초대/메시지 관련 타입
// =========================================

// 초대 요청
export interface SendInviteRequest {
  toUserId: string;
  message?: string;
}

// 초대
export interface Invite {
  id: string;
  fromUserId: string;
  toUserId: string;
  fromUser?: UserBasic & { profile?: ProfileData };
  toUser?: UserBasic & { profile?: ProfileData };
  status: InviteStatus;
  message?: string;
  matchScore?: MatchScore;
  createdAt: string;
  updatedAt: string;
}

// 메시지
export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  createdAt: string;
  readAt?: string;
}

// 대화
export interface Conversation {
  id: string;
  participants: UserBasic[];
  lastMessage?: Message;
  unreadCount: number;
  createdAt: string;
}

// =========================================
// 팀/스프린트 관련 타입
// =========================================

// 팀
export interface Team {
  id: string;
  name: string;
  members: TeamMember[];
  goal: string;
  rnr: Record<string, string>;  // userId -> role description
  meetingSchedule?: string;
  status: TeamStatus;
  currentSprintId?: string;
  createdAt: string;
}

// 팀원
export interface TeamMember {
  userId: string;
  user: UserBasic & { profile?: ProfileData };
  role: string;
  joinedAt: string;
}

// 스프린트
export interface Sprint {
  id: string;
  teamId: string;
  startDate: string;
  endDate: string;
  status: SprintStatus;
  checklistItems: ChecklistItem[];
  checkIns: CheckIn[];
  createdAt: string;
}

// 체크리스트 아이템
export interface ChecklistItem {
  id: string;
  title: string;
  description?: string;
  assigneeId?: string;
  completed: boolean;
  completedAt?: string;
}

// 체크인
export interface CheckIn {
  id: string;
  sprintId: string;
  userId: string;
  progress: number;           // 0-100
  satisfaction: number;       // 1-5
  blockers?: string;
  notes?: string;
  createdAt: string;
}

// 체크인 요청
export interface CheckInRequest {
  sprintId?: string;
  progress?: number;
  satisfaction: number;
  blockers?: string;
  notes?: string;
}

// =========================================
// 피드백/평판 관련 타입
// =========================================

// 피드백
export interface Feedback {
  id: string;
  fromUserId: string;
  toUserId: string;
  teamId: string;
  ratingPromise: number;      // 약속 준수 (1-5)
  ratingResponse: number;     // 응답성 (1-5)
  ratingContribution: number; // 기여도 (1-5)
  comment?: string;
  createdAt: string;
}

// 피드백 요청 (간단한 버전)
export interface FeedbackRequest {
  targetUserId?: string;
  toUserId?: string;
  teamId?: string;
  rating?: number;
  ratingPromise?: number;
  ratingResponse?: number;
  ratingContribution?: number;
  comment?: string;
  decision?: TeamDecision;
}

// =========================================
// 알림 관련 타입
// =========================================

// 알림
export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  link?: string;
  read: boolean;
  createdAt: string;
}

// =========================================
// 리스크 감지 관련 타입
// =========================================

// 리스크 경고
export interface RiskWarning {
  type: 'checkin_missed' | 'satisfaction_drop' | 'message_timeout' | 'inactivity';
  severity: 'low' | 'medium' | 'high';
  message: string;
  suggestion: string;
  userId?: string;
  teamId?: string;
}

// 신고
export interface Report {
  id: string;
  fromUserId: string;
  toUserId: string;
  type: ReportType;
  description: string;
  status: 'pending' | 'reviewed' | 'resolved';
  createdAt: string;
}

// 차단
export interface Block {
  id: string;
  userId: string;
  blockedUserId: string;
  createdAt: string;
}

// =========================================
// API 응답 래퍼
// =========================================

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// Profile alias for backward compatibility
export type Profile = ProfileData;

// 프로필 수정 요청
export interface ProfileUpdateRequest {
  bio?: string;
  location?: string;
  locationPref?: LocationPref;
  availabilityHours?: number;
  startDate?: string;
  domains?: Domain[];
  roleCan?: Role[];
  roleWant?: Role[];
  roleNeed?: Role[];
  skills?: string[];
  commChannel?: CommChannel;
  responseSla?: number;
  meetingFreq?: MeetingFreq;
  goal?: Goal;
  decisionConsensus?: number;
  decisionData?: number;
  decisionSpeed?: number;
  decisionFlexibility?: number;
  decisionRisk?: number;
  conflictStyle?: ConflictStyle;
}

// 증거 링크 요청
export interface EvidenceLinkRequest {
  type: EvidenceType;
  url: string;
  title?: string;
}
