/**
 * MatchLab 스코어 계산 모듈
 * 
 * 매칭 스코어 계산 로직:
 * 최종점수 = (안정성 × 0.5) + (시너지 × 0.2) + (신뢰 × 0.1) + (창업MBTI × 0.2) - 패널티
 */

import { MATCHING_WEIGHTS, PENALTIES } from '@matchlab/shared';
import type { StartupMBTI } from '@matchlab/shared';
import { calculateStartupMBTICompatibility } from './startupMbtiCalculator.js';

export interface ProfileForScoring {
  userId: string;
  // 목표/커밋
  goal: string;
  availabilityHours: number;
  // 역할/스킬
  roleCan: string[];
  roleWant: string[];
  roleNeed: string[];
  skills: string[];
  // 도메인
  domains: string[];
  // 소통
  commChannel?: string;
  responseSla?: number;
  meetingFreq?: string;
  // 의사결정 스타일 (1-5)
  decisionConsensus?: number;
  decisionData?: number;
  decisionSpeed?: number;
  decisionFlexibility?: number;
  decisionRisk?: number;
  // 갈등 대응
  conflictStyle?: string;
  // 성향 (간단 버전)
  traits?: {
    leadership: number;
    execution: number;
    communication: number;
    risk: number;
    conflict: number;
    flexibility: number;
  };
  // 창업 MBTI (전체 버전)
  startupMbti?: StartupMBTI;
  // 신뢰도
  trustScore?: {
    completeness: number;
    evidenceStrength: number;
    activity: number;
    reputation: number;
    total: number;
  };
}

export interface ScoreResult {
  stability: number;      // 안정성 (0-100)
  synergy: number;        // 시너지 (0-100)
  trust: number;          // 신뢰 (0-100)
  startupMbti: number;    // 창업 MBTI 호환성 (0-100)
  penalties: number;      // 패널티 합계
  total: number;          // 최종 점수
  breakdown: ScoreBreakdown;
  mbtiStrengths?: string[];  // MBTI 기반 강점
  mbtiCautions?: string[];   // MBTI 기반 주의점
}

export interface ScoreBreakdown {
  // 안정성 세부
  goalAlignment: number;
  commitAlignment: number;
  commRulesSimilarity: number;
  decisionStyleSimilarity: number;
  conflictStyleSimilarity: number;
  // 시너지 세부
  roleComplementarity: number;
  skillComplementarity: number;
  domainComplementarity: number;
  // 신뢰 세부
  profileCompleteness: number;
  evidenceCount: number;
  activityLevel: number;
  reputationScore: number;
  // 창업 MBTI 세부
  mbtiFounderTrait: number;
  mbtiPerfectionism: number;
  mbtiMotivation: number;
  mbtiReward: number;
  mbtiPartnership: number;
  // 패널티 세부
  commitGapPenalty: number;
  goalConflictPenalty: number;
  styleClashPenalty: number;
}

/**
 * 두 프로필 간 매칭 스코어 계산
 */
export function calculateMatchScore(
  viewer: ProfileForScoring,
  candidate: ProfileForScoring
): ScoreResult {
  // 1. 안정성 점수 계산 (가중치 높음)
  const stability = calculateStabilityScore(viewer, candidate);
  
  // 2. 시너지 점수 계산
  const synergy = calculateSynergyScore(viewer, candidate);
  
  // 3. 신뢰 점수 계산
  const trust = calculateTrustScore(candidate);
  
  // 4. 창업 MBTI 호환성 계산
  const startupMbtiResult = calculateStartupMBTIScore(viewer, candidate);
  
  // 5. 패널티 계산
  const penaltyResult = calculatePenalties(viewer, candidate);
  
  // 6. 최종 점수 계산 (StartupMBTI가 있으면 가중치 조정)
  let weightedScore: number;
  if (viewer.startupMbti && candidate.startupMbti) {
    // StartupMBTI가 있으면: 안정성 0.5, 시너지 0.2, 신뢰 0.1, MBTI 0.2
    weightedScore = 
      stability.score * 0.50 +
      synergy.score * 0.20 +
      trust.score * 0.10 +
      startupMbtiResult.score * 0.20;
  } else {
    // 기존 방식: 안정성 0.6, 시너지 0.3, 신뢰 0.1
    weightedScore = 
      stability.score * MATCHING_WEIGHTS.STABILITY +
      synergy.score * MATCHING_WEIGHTS.SYNERGY +
      trust.score * MATCHING_WEIGHTS.TRUST;
  }
  
  const total = Math.max(0, Math.round(weightedScore - penaltyResult.total));

  return {
    stability: stability.score,
    synergy: synergy.score,
    trust: trust.score,
    startupMbti: startupMbtiResult.score,
    penalties: penaltyResult.total,
    total,
    breakdown: {
      ...stability.breakdown,
      ...synergy.breakdown,
      ...trust.breakdown,
      ...startupMbtiResult.breakdown,
      ...penaltyResult.breakdown,
    },
    mbtiStrengths: startupMbtiResult.strengths,
    mbtiCautions: startupMbtiResult.cautions,
  };
}

/**
 * 창업 MBTI 호환성 점수 계산
 */
function calculateStartupMBTIScore(
  viewer: ProfileForScoring,
  candidate: ProfileForScoring
): {
  score: number;
  breakdown: {
    mbtiFounderTrait: number;
    mbtiPerfectionism: number;
    mbtiMotivation: number;
    mbtiReward: number;
    mbtiPartnership: number;
  };
  strengths: string[];
  cautions: string[];
} {
  // 둘 다 StartupMBTI가 없으면 기본값 반환
  if (!viewer.startupMbti || !candidate.startupMbti) {
    return {
      score: 50, // 중립 점수
      breakdown: {
        mbtiFounderTrait: 50,
        mbtiPerfectionism: 50,
        mbtiMotivation: 50,
        mbtiReward: 50,
        mbtiPartnership: 50,
      },
      strengths: [],
      cautions: [],
    };
  }
  
  // StartupMBTI 호환성 계산
  const compatibility = calculateStartupMBTICompatibility(
    viewer.startupMbti,
    candidate.startupMbti
  );
  
  return {
    score: compatibility.overall,
    breakdown: {
      mbtiFounderTrait: compatibility.founderTrait,
      mbtiPerfectionism: compatibility.perfectionism,
      mbtiMotivation: compatibility.motivation,
      mbtiReward: compatibility.reward,
      mbtiPartnership: compatibility.partnership,
    },
    strengths: compatibility.strengths,
    cautions: compatibility.cautions,
  };
}

/**
 * 안정성 점수 계산 (0-100)
 * - 목표 정렬도 (25%)
 * - 커밋 정렬도 (25%)
 * - 소통 규칙 유사도 (20%)
 * - 의사결정 스타일 유사도 (15%)
 * - 갈등 대응 유사도 (15%)
 */
function calculateStabilityScore(viewer: ProfileForScoring, candidate: ProfileForScoring) {
  // 목표 정렬도 (같으면 100, 다르면 50)
  const goalAlignment = viewer.goal === candidate.goal ? 100 : 50;

  // 커밋 정렬도 (시간 차이 기반)
  const hoursDiff = Math.abs(viewer.availabilityHours - candidate.availabilityHours);
  const maxHours = Math.max(viewer.availabilityHours, candidate.availabilityHours);
  const commitAlignment = maxHours > 0 
    ? Math.round(100 * (1 - hoursDiff / maxHours))
    : 100;

  // 소통 규칙 유사도
  let commRulesSimilarity = 50; // 기본값
  if (viewer.commChannel && candidate.commChannel) {
    commRulesSimilarity = viewer.commChannel === candidate.commChannel ? 100 : 60;
  }
  if (viewer.meetingFreq && candidate.meetingFreq) {
    commRulesSimilarity = viewer.meetingFreq === candidate.meetingFreq 
      ? Math.min(100, commRulesSimilarity + 20)
      : commRulesSimilarity;
  }

  // 의사결정 스타일 유사도 (5개 축의 평균 차이)
  const decisionStyleSimilarity = calculateDecisionStyleSimilarity(viewer, candidate);

  // 갈등 대응 유사도
  let conflictStyleSimilarity = 50;
  if (viewer.conflictStyle && candidate.conflictStyle) {
    conflictStyleSimilarity = viewer.conflictStyle === candidate.conflictStyle ? 100 : 60;
  }

  // 가중 평균
  const score = Math.round(
    goalAlignment * 0.25 +
    commitAlignment * 0.25 +
    commRulesSimilarity * 0.20 +
    decisionStyleSimilarity * 0.15 +
    conflictStyleSimilarity * 0.15
  );

  return {
    score,
    breakdown: {
      goalAlignment,
      commitAlignment,
      commRulesSimilarity,
      decisionStyleSimilarity,
      conflictStyleSimilarity,
    },
  };
}

/**
 * 의사결정 스타일 유사도 계산
 */
function calculateDecisionStyleSimilarity(
  viewer: ProfileForScoring,
  candidate: ProfileForScoring
): number {
  const axes = [
    { v: viewer.decisionConsensus, c: candidate.decisionConsensus },
    { v: viewer.decisionData, c: candidate.decisionData },
    { v: viewer.decisionSpeed, c: candidate.decisionSpeed },
    { v: viewer.decisionFlexibility, c: candidate.decisionFlexibility },
    { v: viewer.decisionRisk, c: candidate.decisionRisk },
  ];

  const validAxes = axes.filter(a => a.v != null && a.c != null);
  
  if (validAxes.length === 0) return 50; // 기본값

  const totalDiff = validAxes.reduce((sum, a) => {
    const diff = Math.abs(a.v! - a.c!);
    return sum + diff;
  }, 0);

  // 최대 차이는 축당 4점 (1-5 척도)
  const maxDiff = validAxes.length * 4;
  return Math.round(100 * (1 - totalDiff / maxDiff));
}

/**
 * 시너지 점수 계산 (0-100)
 * - 역할 상보성 (50%)
 * - 스킬 상보성 (30%)
 * - 도메인 네트워크 상보성 (20%)
 */
function calculateSynergyScore(viewer: ProfileForScoring, candidate: ProfileForScoring) {
  // 역할 상보성: 내가 찾는 역할을 상대가 할 수 있는지
  const viewerNeedsMet = viewer.roleNeed.filter(
    role => candidate.roleCan.includes(role) || candidate.roleWant.includes(role)
  ).length;
  const candidateNeedsMet = candidate.roleNeed.filter(
    role => viewer.roleCan.includes(role) || viewer.roleWant.includes(role)
  ).length;
  
  const totalNeeds = viewer.roleNeed.length + candidate.roleNeed.length;
  const roleComplementarity = totalNeeds > 0 
    ? Math.round(100 * (viewerNeedsMet + candidateNeedsMet) / totalNeeds)
    : 50;

  // 스킬 상보성: 겹치지 않는 스킬 비율
  const allSkills = new Set([...viewer.skills, ...candidate.skills]);
  const overlapSkills = viewer.skills.filter(s => candidate.skills.includes(s));
  const skillComplementarity = allSkills.size > 0
    ? Math.round(100 * (allSkills.size - overlapSkills.length) / allSkills.size)
    : 50;

  // 도메인 상보성: 공유 도메인이 있으면 보너스
  const sharedDomains = viewer.domains.filter(d => candidate.domains.includes(d));
  const domainComplementarity = sharedDomains.length > 0 ? 80 : 40;

  const score = Math.round(
    roleComplementarity * 0.50 +
    skillComplementarity * 0.30 +
    domainComplementarity * 0.20
  );

  return {
    score,
    breakdown: {
      roleComplementarity,
      skillComplementarity,
      domainComplementarity,
    },
  };
}

/**
 * 신뢰 점수 계산 (0-100)
 * 후보의 신뢰도 점수 기반
 */
function calculateTrustScore(candidate: ProfileForScoring) {
  const trustScore = candidate.trustScore;
  
  if (!trustScore) {
    return {
      score: 30, // 기본값
      breakdown: {
        profileCompleteness: 30,
        evidenceCount: 0,
        activityLevel: 30,
        reputationScore: 50,
      },
    };
  }

  const score = Math.round(
    trustScore.completeness * 0.40 +
    trustScore.evidenceStrength * 0.30 +
    trustScore.activity * 0.20 +
    trustScore.reputation * 0.10
  );

  return {
    score,
    breakdown: {
      profileCompleteness: trustScore.completeness,
      evidenceCount: trustScore.evidenceStrength,
      activityLevel: trustScore.activity,
      reputationScore: trustScore.reputation,
    },
  };
}

/**
 * 패널티 계산
 */
function calculatePenalties(viewer: ProfileForScoring, candidate: ProfileForScoring) {
  let commitGapPenalty = 0;
  let goalConflictPenalty = 0;
  let styleClashPenalty = 0;

  // 커밋 격차 과대 (예: 40h vs 5h)
  const hoursDiff = Math.abs(viewer.availabilityHours - candidate.availabilityHours);
  if (hoursDiff >= 30) {
    commitGapPenalty = PENALTIES.COMMIT_GAP_HIGH;
  }

  // 목표 충돌 (투자 올인 vs 취미)
  const seriousGoals = ['investment', 'revenue'];
  const casualGoals = ['side_project', 'hackathon'];
  
  if (
    (seriousGoals.includes(viewer.goal) && casualGoals.includes(candidate.goal)) ||
    (casualGoals.includes(viewer.goal) && seriousGoals.includes(candidate.goal))
  ) {
    goalConflictPenalty = PENALTIES.GOAL_CONFLICT;
  }

  // 성향 극단 충돌 (리더-리더, 체계-유연 극단)
  if (viewer.traits && candidate.traits) {
    // 둘 다 리더 성향이면 충돌 가능
    if (viewer.traits.leadership === 1 && candidate.traits.leadership === 1) {
      styleClashPenalty += 5;
    }
    // 실행 스타일 극단 충돌
    if (viewer.traits.execution !== candidate.traits.execution) {
      styleClashPenalty += 3;
    }
    // 갈등 대응 스타일 충돌
    if (viewer.traits.conflict !== candidate.traits.conflict) {
      styleClashPenalty += 2;
    }
  }

  if (styleClashPenalty > PENALTIES.STYLE_EXTREME_CLASH) {
    styleClashPenalty = PENALTIES.STYLE_EXTREME_CLASH;
  }

  const total = commitGapPenalty + goalConflictPenalty + styleClashPenalty;

  return {
    total,
    breakdown: {
      commitGapPenalty,
      goalConflictPenalty,
      styleClashPenalty,
    },
  };
}

/**
 * 스코어 기여도 상위 항목 추출
 */
export function getTopContributors(breakdown: ScoreBreakdown): Array<{
  factor: string;
  score: number;
  label: string;
}> {
  const factors = [
    { factor: 'goalAlignment', score: breakdown.goalAlignment, label: '목표 정렬' },
    { factor: 'commitAlignment', score: breakdown.commitAlignment, label: '커밋 정렬' },
    { factor: 'roleComplementarity', score: breakdown.roleComplementarity, label: '역할 상보성' },
    { factor: 'commRulesSimilarity', score: breakdown.commRulesSimilarity, label: '소통 규칙' },
    { factor: 'decisionStyleSimilarity', score: breakdown.decisionStyleSimilarity, label: '의사결정 스타일' },
    { factor: 'conflictStyleSimilarity', score: breakdown.conflictStyleSimilarity, label: '갈등 대응' },
    { factor: 'skillComplementarity', score: breakdown.skillComplementarity, label: '스킬 상보성' },
    { factor: 'domainComplementarity', score: breakdown.domainComplementarity, label: '도메인 시너지' },
    { factor: 'profileCompleteness', score: breakdown.profileCompleteness, label: '프로필 완성도' },
    // 창업 MBTI 관련
    { factor: 'mbtiFounderTrait', score: breakdown.mbtiFounderTrait, label: '창업자 성향 호환' },
    { factor: 'mbtiPerfectionism', score: breakdown.mbtiPerfectionism, label: '완벽주의 성향 호환' },
    { factor: 'mbtiMotivation', score: breakdown.mbtiMotivation, label: '동기 요인 호환' },
    { factor: 'mbtiReward', score: breakdown.mbtiReward, label: '보상 요인 호환' },
    { factor: 'mbtiPartnership', score: breakdown.mbtiPartnership, label: '파트너쉽 호환' },
  ];

  return factors
    .filter(f => f.score >= 70) // 70점 이상만
    .sort((a, b) => b.score - a.score)
    .slice(0, 5);
}

/**
 * 가장 큰 패널티 항목 추출
 */
export function getTopPenalty(breakdown: ScoreBreakdown): {
  factor: string;
  penalty: number;
  label: string;
} | null {
  const penalties = [
    { factor: 'commitGapPenalty', penalty: breakdown.commitGapPenalty, label: '투입시간 격차가 큼' },
    { factor: 'goalConflictPenalty', penalty: breakdown.goalConflictPenalty, label: '목표 방향성 차이' },
    { factor: 'styleClashPenalty', penalty: breakdown.styleClashPenalty, label: '협업 스타일 충돌 가능' },
  ];

  const topPenalty = penalties
    .filter(p => p.penalty > 0)
    .sort((a, b) => b.penalty - a.penalty)[0];

  return topPenalty || null;
}
