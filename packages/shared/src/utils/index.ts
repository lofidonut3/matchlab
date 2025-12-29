// MatchLab 공유 유틸리티

/**
 * 두 날짜 사이의 일수 차이 계산
 */
export function daysBetween(date1: Date, date2: Date): number {
  const oneDay = 24 * 60 * 60 * 1000;
  return Math.round(Math.abs((date1.getTime() - date2.getTime()) / oneDay));
}

/**
 * 프로필 완성도 계산
 */
export function calculateProfileCompleteness(profile: {
  bio?: string;
  location?: string;
  locationPref?: string;
  availabilityHours?: number;
  startDate?: string;
  domains?: string[];
  roleCan?: string[];
  roleWant?: string[];
  roleNeed?: string[];
  skills?: string[];
  commChannel?: string;
  responseSla?: number;
  meetingFreq?: string;
  goal?: string;
  conflictStyle?: string;
  decisionConsensus?: number;
}): number {
  const fields = [
    { name: 'bio', weight: 5, filled: !!profile.bio },
    { name: 'location', weight: 5, filled: !!profile.location },
    { name: 'locationPref', weight: 10, filled: !!profile.locationPref },
    { name: 'availabilityHours', weight: 10, filled: profile.availabilityHours != null },
    { name: 'startDate', weight: 10, filled: !!profile.startDate },
    { name: 'domains', weight: 10, filled: profile.domains && profile.domains.length > 0 },
    { name: 'roleCan', weight: 5, filled: profile.roleCan && profile.roleCan.length > 0 },
    { name: 'roleWant', weight: 5, filled: profile.roleWant && profile.roleWant.length > 0 },
    { name: 'roleNeed', weight: 10, filled: profile.roleNeed && profile.roleNeed.length > 0 },
    { name: 'skills', weight: 5, filled: profile.skills && profile.skills.length > 0 },
    { name: 'commChannel', weight: 5, filled: !!profile.commChannel },
    { name: 'responseSla', weight: 5, filled: profile.responseSla != null },
    { name: 'meetingFreq', weight: 5, filled: !!profile.meetingFreq },
    { name: 'goal', weight: 10, filled: !!profile.goal },
  ];

  const totalWeight = fields.reduce((sum, f) => sum + f.weight, 0);
  const filledWeight = fields.filter(f => f.filled).reduce((sum, f) => sum + f.weight, 0);

  return Math.round((filledWeight / totalWeight) * 100);
}

/**
 * 시간 범위 호환성 체크 (±50% 허용)
 */
export function isTimeCompatible(hours1: number, hours2: number, tolerance = 0.5): boolean {
  const min = Math.min(hours1, hours2);
  const max = Math.max(hours1, hours2);
  return max <= min * (1 + tolerance) || max - min <= 10;
}

/**
 * 위치 선호 호환성 체크
 */
export function isLocationCompatible(pref1: string, pref2: string): boolean {
  if (pref1 === 'flexible' || pref2 === 'flexible') return true;
  if (pref1 === 'hybrid' || pref2 === 'hybrid') return true;
  return pref1 === pref2;
}

/**
 * 역할 상보성 체크 (한 사람의 need가 다른 사람의 can/want에 있는지)
 */
export function hasRoleComplementarity(
  need1: string[],
  canWant2: string[],
  need2: string[],
  canWant1: string[]
): boolean {
  const match1 = need1.some(r => canWant2.includes(r));
  const match2 = need2.some(r => canWant1.includes(r));
  return match1 || match2;
}

/**
 * 성향 유사도 계산 (0-100)
 * 같으면 100, 다르면 0
 */
export function calculateTraitSimilarity(
  traits1: Record<string, number>,
  traits2: Record<string, number>
): number {
  const axes = ['leadership', 'execution', 'communication', 'risk', 'conflict', 'flexibility'];
  let matches = 0;
  
  for (const axis of axes) {
    if (traits1[axis] === traits2[axis]) {
      matches++;
    }
  }
  
  return Math.round((matches / axes.length) * 100);
}

/**
 * 날짜를 YYYY-MM-DD 형식으로 포맷
 */
export function formatDate(date: Date): string {
  return date.toISOString().split('T')[0];
}

/**
 * 상대적 시간 표시 (n분 전, n시간 전, n일 전)
 */
export function timeAgo(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return '방금 전';
  if (diffMins < 60) return `${diffMins}분 전`;
  if (diffHours < 24) return `${diffHours}시간 전`;
  if (diffDays < 7) return `${diffDays}일 전`;
  return formatDate(date);
}

/**
 * 2주 스프린트 체크리스트 기본 템플릿
 */
export function generateDefaultChecklist(goal: string): Array<{ title: string; description: string }> {
  return [
    { title: '팀 규칙 합의', description: '소통 채널, 응답 시간, 미팅 일정 확정' },
    { title: '목표 구체화', description: `"${goal}" 목표를 세부 마일스톤으로 분해` },
    { title: '역할 분담 확정', description: '각자 담당 영역과 책임 범위 명확화' },
    { title: '1주차 미션 수행', description: '첫 번째 마일스톤 달성' },
    { title: '중간 회고', description: '1주차 성과와 문제점 점검' },
    { title: '2주차 미션 수행', description: '두 번째 마일스톤 달성' },
    { title: '최종 회고 및 결정', description: '팀 유지/해산/리매칭 결정' },
  ];
}
