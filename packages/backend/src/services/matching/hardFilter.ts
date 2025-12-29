/**
 * MatchLab 하드 필터 모듈
 * 
 * 후보군을 1차로 필터링하는 하드필터 로직
 * - 시작 가능 시점 충족
 * - 주당 시간 범위 호환
 * - 원격/지역 호환
 * - 부족 역할 충족 여부
 */

import { isTimeCompatible, isLocationCompatible } from '@matchlab/shared';

export interface CandidateProfile {
  userId: string;
  availabilityHours: number;
  startDate: Date;
  locationPref: string;
  roleCan: string[];
  roleWant: string[];
  roleNeed: string[];
  goal: string;
  isBlocked?: boolean;
}

export interface FilterCriteria {
  availabilityHours: number;
  startDate: Date;
  locationPref: string;
  roleNeed: string[];
  goal?: string;
}

export interface FilterResult {
  passed: boolean;
  reasons: string[];
}

/**
 * 하드 필터 적용
 * 모든 조건을 통과해야 후보군에 포함
 */
export function applyHardFilter(
  candidate: CandidateProfile,
  criteria: FilterCriteria
): FilterResult {
  const failReasons: string[] = [];

  // 1. 차단된 사용자 제외
  if (candidate.isBlocked) {
    return { passed: false, reasons: ['차단된 사용자'] };
  }

  // 2. 시작 가능 시점 체크
  // 후보의 시작 가능일이 내 시작 가능일보다 1개월 이상 늦으면 제외
  const oneMonthLater = new Date(criteria.startDate);
  oneMonthLater.setMonth(oneMonthLater.getMonth() + 1);
  
  if (candidate.startDate > oneMonthLater) {
    failReasons.push('시작 시점 불일치');
  }

  // 3. 주당 시간 호환성 체크 (±50% 허용, 또는 10시간 이내 차이)
  if (!isTimeCompatible(candidate.availabilityHours, criteria.availabilityHours, 0.5)) {
    failReasons.push('투입시간 불일치');
  }

  // 4. 원격/지역 호환성 체크
  if (!isLocationCompatible(candidate.locationPref, criteria.locationPref)) {
    failReasons.push('위치선호 불일치');
  }

  // 5. 부족 역할 충족 체크
  // 내가 찾는 역할(roleNeed)을 상대가 할 수 있거나(roleCan) 하고 싶어야(roleWant) 함
  const candidateCanDo = [...candidate.roleCan, ...candidate.roleWant];
  const hasMatchingRole = criteria.roleNeed.some(role => candidateCanDo.includes(role));
  
  if (!hasMatchingRole && criteria.roleNeed.length > 0) {
    failReasons.push('역할 불일치');
  }

  return {
    passed: failReasons.length === 0,
    reasons: failReasons,
  };
}

/**
 * 여러 후보에게 하드 필터 적용
 */
export function filterCandidates(
  candidates: CandidateProfile[],
  criteria: FilterCriteria
): CandidateProfile[] {
  return candidates.filter(candidate => {
    const result = applyHardFilter(candidate, criteria);
    return result.passed;
  });
}

/**
 * 조건 완화 제안 생성
 * 하드필터로 제외된 후보 수를 기반으로 조건 완화 제안
 */
export function generateRelaxationSuggestions(
  candidates: CandidateProfile[],
  criteria: FilterCriteria
): Array<{ condition: string; potentialGain: number }> {
  const suggestions: Array<{ condition: string; potentialGain: number }> = [];

  // 각 조건별로 완화 시 추가되는 후보 수 계산
  const relaxedLocation = candidates.filter(c => {
    const result = applyHardFilter(c, { ...criteria, locationPref: 'flexible' });
    return result.passed;
  }).length;

  const currentCount = filterCandidates(candidates, criteria).length;

  if (relaxedLocation > currentCount) {
    suggestions.push({
      condition: '원격/지역 허용 시',
      potentialGain: relaxedLocation - currentCount,
    });
  }

  // 시간 조건 완화 (±100% 허용)
  const relaxedTime = candidates.filter(c => {
    return isTimeCompatible(c.availabilityHours, criteria.availabilityHours, 1.0) &&
           isLocationCompatible(c.locationPref, criteria.locationPref);
  }).length;

  if (relaxedTime > currentCount) {
    suggestions.push({
      condition: '시간 조건 완화 시',
      potentialGain: relaxedTime - currentCount,
    });
  }

  return suggestions.sort((a, b) => b.potentialGain - a.potentialGain);
}
