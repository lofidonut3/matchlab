/**
 * MatchLab 설명 생성 모듈
 * 
 * 룰 기반 템플릿으로 매칭 이유(reasons_top3)와 주의점(caution) 생성
 * V1에서 LLM으로 교체 가능하도록 인터페이스 설계
 */

import { ScoreBreakdown, getTopContributors, getTopPenalty } from './scoreCalculator.js';
import { GOAL_LABELS, ROLE_LABELS, MEETING_FREQ_LABELS } from '@matchlab/shared';

export interface ProfileForExplanation {
  nickname: string;
  goal: string;
  availabilityHours: number;
  roleCan: string[];
  roleWant: string[];
  roleNeed: string[];
  domains: string[];
  meetingFreq?: string;
  conflictStyle?: string;
}

export interface ExplanationResult {
  reasonsTop3: string[];
  caution: string | null;
}

/**
 * 템플릿 기반 추천 이유 및 주의점 생성
 */
export function generateExplanation(
  viewer: ProfileForExplanation,
  candidate: ProfileForExplanation,
  breakdown: ScoreBreakdown
): ExplanationResult {
  const reasons = generateReasons(viewer, candidate, breakdown);
  const caution = generateCaution(viewer, candidate, breakdown);

  return {
    reasonsTop3: reasons.slice(0, 3),
    caution,
  };
}

/**
 * 추천 이유 생성 (최대 3개)
 */
function generateReasons(
  viewer: ProfileForExplanation,
  candidate: ProfileForExplanation,
  breakdown: ScoreBreakdown
): string[] {
  const reasons: string[] = [];
  const topContributors = getTopContributors(breakdown);

  // 1. 목표 정렬
  if (breakdown.goalAlignment >= 100) {
    const goalLabel = GOAL_LABELS[candidate.goal] || candidate.goal;
    reasons.push(`"${goalLabel}" 목표가 일치해요`);
  }

  // 2. 역할 상보성
  if (breakdown.roleComplementarity >= 70) {
    const matchingRoles = viewer.roleNeed.filter(
      role => candidate.roleCan.includes(role) || candidate.roleWant.includes(role)
    );
    if (matchingRoles.length > 0) {
      const roleLabel = ROLE_LABELS[matchingRoles[0]] || matchingRoles[0];
      reasons.push(`찾고 계신 ${roleLabel} 역할을 할 수 있어요`);
    }
  }

  // 3. 커밋 정렬
  if (breakdown.commitAlignment >= 80) {
    reasons.push(`주당 투입 시간이 비슷해요 (${candidate.availabilityHours}시간)`);
  }

  // 4. 소통 규칙 유사
  if (breakdown.commRulesSimilarity >= 80) {
    if (candidate.meetingFreq) {
      const freqLabel = MEETING_FREQ_LABELS[candidate.meetingFreq] || candidate.meetingFreq;
      reasons.push(`${freqLabel} 미팅 선호가 맞아요`);
    } else {
      reasons.push(`소통 방식이 잘 맞을 것 같아요`);
    }
  }

  // 5. 의사결정 스타일
  if (breakdown.decisionStyleSimilarity >= 70) {
    reasons.push(`의사결정 스타일이 비슷해요`);
  }

  // 6. 갈등 대응
  if (breakdown.conflictStyleSimilarity >= 80) {
    reasons.push(`갈등 해결 방식이 비슷해요`);
  }

  // 7. 도메인 시너지
  if (breakdown.domainComplementarity >= 70) {
    const sharedDomains = viewer.domains.filter(d => candidate.domains.includes(d));
    if (sharedDomains.length > 0) {
      reasons.push(`같은 도메인에 관심이 있어요`);
    }
  }

  // 8. 스킬 상보성
  if (breakdown.skillComplementarity >= 70) {
    reasons.push(`보유 스킬이 서로 보완돼요`);
  }

  // 9. 프로필 완성도
  if (breakdown.profileCompleteness >= 80) {
    reasons.push(`프로필이 꼼꼼하게 작성되어 있어요`);
  }

  // 최소 1개 이유 보장
  if (reasons.length === 0) {
    reasons.push(`조건에 맞는 후보예요`);
  }

  return reasons;
}

/**
 * 주의점 생성 (가장 큰 패널티 기반)
 */
function generateCaution(
  viewer: ProfileForExplanation,
  candidate: ProfileForExplanation,
  breakdown: ScoreBreakdown
): string | null {
  const topPenalty = getTopPenalty(breakdown);
  
  if (!topPenalty) {
    // 패널티가 없어도 경계 조건 체크
    
    // 시간 차이가 있는 경우
    const hoursDiff = Math.abs(viewer.availabilityHours - candidate.availabilityHours);
    if (hoursDiff >= 15) {
      return `주당 투입 시간에 ${hoursDiff}시간 차이가 있어요`;
    }

    // 목표가 다른 경우
    if (viewer.goal !== candidate.goal) {
      const goalLabel = GOAL_LABELS[candidate.goal] || candidate.goal;
      return `목표가 "${goalLabel}"로 다를 수 있어요`;
    }

    // 의사결정 스타일 차이
    if (breakdown.decisionStyleSimilarity < 50) {
      return `의사결정 스타일에 차이가 있을 수 있어요`;
    }

    return null;
  }

  // 패널티 기반 주의점
  switch (topPenalty.factor) {
    case 'commitGapPenalty':
      const hoursDiff = Math.abs(viewer.availabilityHours - candidate.availabilityHours);
      return `투입 시간 차이가 커요 (${hoursDiff}시간 차이)`;
    
    case 'goalConflictPenalty':
      const viewerGoal = GOAL_LABELS[viewer.goal] || viewer.goal;
      const candidateGoal = GOAL_LABELS[candidate.goal] || candidate.goal;
      return `목표 방향성이 달라요 (${viewerGoal} vs ${candidateGoal})`;
    
    case 'styleClashPenalty':
      return `협업 스타일 충돌 가능성이 있어요`;
    
    default:
      return topPenalty.label;
  }
}

/**
 * 매칭 카드용 간략 설명 생성
 */
export function generateCardSummary(
  viewer: ProfileForExplanation,
  candidate: ProfileForExplanation,
  breakdown: ScoreBreakdown
): string {
  const reasons = generateReasons(viewer, candidate, breakdown);
  return reasons.slice(0, 2).join(' · ');
}

/**
 * 상세 화면용 전체 설명 생성
 */
export function generateDetailedExplanation(
  viewer: ProfileForExplanation,
  candidate: ProfileForExplanation,
  breakdown: ScoreBreakdown
): {
  strengths: string[];
  considerations: string[];
  compatibility: string;
} {
  const result = generateExplanation(viewer, candidate, breakdown);
  
  // 강점
  const strengths = result.reasonsTop3;

  // 고려사항
  const considerations: string[] = [];
  if (result.caution) {
    considerations.push(result.caution);
  }
  
  // 추가 고려사항
  if (breakdown.decisionStyleSimilarity < 60) {
    considerations.push('의사결정 방식에 대해 미리 이야기해 보세요');
  }
  if (breakdown.conflictStyleSimilarity < 60) {
    considerations.push('갈등 발생 시 대응 방법을 합의해 두세요');
  }

  // 종합 호환성 코멘트
  let compatibility = '';
  const avgScore = (breakdown.goalAlignment + breakdown.commitAlignment + breakdown.roleComplementarity) / 3;
  
  if (avgScore >= 80) {
    compatibility = '핵심 조건이 잘 맞는 편이에요';
  } else if (avgScore >= 60) {
    compatibility = '대체로 괜찮지만 일부 조율이 필요해요';
  } else {
    compatibility = '사전에 충분한 대화가 필요해요';
  }

  return {
    strengths,
    considerations,
    compatibility,
  };
}
