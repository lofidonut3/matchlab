/**
 * StartupMBTI 호환성 계산기
 * 
 * 두 사람의 창업 MBTI 데이터를 기반으로 팀 호환성을 계산합니다.
 * 
 * 계산 원칙:
 * 1. 상호보완성 (Complementary): 서로 부족한 부분을 채워주는 조합이 좋음
 * 2. 유사성 (Similarity): 핵심 가치관은 비슷해야 갈등 감소
 * 3. 밸런스 (Balance): 극단적인 차이보다 적절한 차이가 좋음
 */

import type { StartupMBTI, StartupMBTICompatibility } from '@matchlab/shared';

// 가중치 설정
const WEIGHTS = {
  founderTrait: 0.25,     // 창업자 기본 성향
  perfectionism: 0.15,    // 완벽주의 성향
  motivation: 0.20,       // 동기 요인
  reward: 0.15,           // 보상 요인
  partnership: 0.25,      // 파트너쉽 유형
};

/**
 * 두 값의 차이를 0-100 호환성 점수로 변환
 * 차이가 적을수록 높은 점수 (유사성 중시)
 */
function similarityScore(a: number, b: number): number {
  const diff = Math.abs(a - b);
  // 차이 0 = 100점, 차이 100 = 0점
  return Math.max(0, 100 - diff);
}

/**
 * 두 값의 상호보완성 점수 계산
 * 합이 100-120 사이일 때 최적 (한쪽이 높으면 다른쪽은 낮아도 됨)
 */
function complementaryScore(a: number, b: number): number {
  const sum = a + b;
  // 이상적인 합계: 100-120
  if (sum >= 100 && sum <= 120) return 100;
  if (sum >= 80 && sum < 100) return 80 + (sum - 80);
  if (sum > 120 && sum <= 140) return 100 - (sum - 120);
  if (sum < 80) return sum;
  return Math.max(0, 200 - sum);
}

/**
 * 밸런스 점수 계산
 * 극단적인 차이보다 적절한 차이(20-40)가 좋음
 */
function balanceScore(a: number, b: number): number {
  const diff = Math.abs(a - b);
  // 이상적인 차이: 15-35
  if (diff >= 15 && diff <= 35) return 100;
  if (diff < 15) return 70 + (diff * 2); // 너무 비슷함
  if (diff > 35 && diff <= 50) return 100 - (diff - 35) * 2;
  return Math.max(0, 100 - diff);
}

/**
 * 창업자 기본 성향 호환성 계산
 */
function calculateFounderTraitCompatibility(a: StartupMBTI, b: StartupMBTI): { score: number; strengths: string[]; cautions: string[] } {
  const strengths: string[] = [];
  const cautions: string[] = [];
  
  // 혁신 & 학습: 유사성 중시 (비전 공유)
  const innovationScore = similarityScore(a.innovationLearning, b.innovationLearning);
  if (innovationScore >= 80) {
    strengths.push('혁신과 학습에 대한 가치관이 비슷합니다');
  } else if (innovationScore < 50) {
    cautions.push('혁신 추구 정도가 달라 방향성 갈등이 있을 수 있습니다');
  }
  
  // 예민 & 신경: 유사성 중시 (스트레스 공유 방식)
  const sensitivityScore = similarityScore(a.sensitivityNervous, b.sensitivityNervous);
  if (Math.abs(a.sensitivityNervous - b.sensitivityNervous) > 50) {
    cautions.push('스트레스 민감도 차이가 커서 이해 충돌이 있을 수 있습니다');
  }
  
  // 사교 & 활동: 상호보완 가능
  const socialScore = complementaryScore(a.socialActivity, b.socialActivity);
  if (a.socialActivity > 70 && b.socialActivity < 30) {
    strengths.push('외부 네트워킹과 내부 집중 역할을 분담할 수 있습니다');
  }
  
  // 협력 & 배려: 높을수록 좋음
  const cooperationScore = (a.cooperationCare + b.cooperationCare) / 2;
  if (cooperationScore >= 60) {
    strengths.push('서로에 대한 배려와 협력 성향이 높습니다');
  } else if (cooperationScore < 40) {
    cautions.push('협력보다 개인 성과를 중시하는 경향이 있습니다');
  }
  
  // 계획 & 추진: 상호보완 OK
  const planScore = balanceScore(a.planExecution, b.planExecution);
  if (a.planExecution > 70 && b.planExecution > 70) {
    strengths.push('둘 다 계획적이고 추진력이 강합니다');
  } else if (a.planExecution > 70 || b.planExecution > 70) {
    strengths.push('한 명이 계획을 세우고 다른 한 명이 유연하게 대응할 수 있습니다');
  }
  
  const avgScore = (innovationScore + sensitivityScore + socialScore + cooperationScore + planScore) / 5;
  
  return { score: Math.round(avgScore), strengths, cautions };
}

/**
 * 완벽주의 성향 호환성 계산
 */
function calculatePerfectionismCompatibility(a: StartupMBTI, b: StartupMBTI): { score: number; strengths: string[]; cautions: string[] } {
  const strengths: string[] = [];
  const cautions: string[] = [];
  
  // AP (내부적 완벽): 둘 다 높으면 좋음
  const apAvg = (a.apPerfectionism + b.apPerfectionism) / 2;
  if (apAvg >= 70) {
    strengths.push('품질에 대한 기준이 높아 완성도 있는 결과물을 만들 수 있습니다');
  }
  
  // EOP (외부 평가): 차이가 크면 갈등
  const eopDiff = Math.abs(a.eopPerfectionism - b.eopPerfectionism);
  if (eopDiff > 40) {
    cautions.push('외부 평가에 대한 민감도 차이가 있어 우선순위 갈등이 생길 수 있습니다');
  }
  
  // IOP (이상 추구): 유사해야 함
  const iopScore = similarityScore(a.iopPerfectionism, b.iopPerfectionism);
  if (iopScore >= 70) {
    strengths.push('추구하는 이상과 비전이 비슷합니다');
  }
  
  const score = (
    similarityScore(a.apPerfectionism, b.apPerfectionism) +
    similarityScore(a.eopPerfectionism, b.eopPerfectionism) +
    iopScore
  ) / 3;
  
  return { score: Math.round(score), strengths, cautions };
}

/**
 * 동기 요인 호환성 계산
 */
function calculateMotivationCompatibility(a: StartupMBTI, b: StartupMBTI): { score: number; strengths: string[]; cautions: string[] } {
  const strengths: string[] = [];
  const cautions: string[] = [];
  
  // 성장: 둘 다 높으면 좋음
  if (a.motivationGrowth >= 70 && b.motivationGrowth >= 70) {
    strengths.push('함께 성장하고 배우는 것을 중요하게 생각합니다');
  }
  
  // 성취: 비슷해야 함
  const achieveDiff = Math.abs(a.motivationAchieve - b.motivationAchieve);
  if (achieveDiff > 40) {
    cautions.push('성과에 대한 욕구 차이가 있어 업무 강도 조율이 필요합니다');
  }
  
  // 인정: 차이가 크면 역할 분담으로 해결 가능
  if (a.motivationRecognition > 70 && b.motivationRecognition < 40) {
    strengths.push('한 명은 대외 활동, 다른 한 명은 내부 업무에 집중할 수 있습니다');
  }
  
  const score = (
    similarityScore(a.motivationGrowth, b.motivationGrowth) +
    similarityScore(a.motivationAchieve, b.motivationAchieve) +
    complementaryScore(a.motivationRecognition, b.motivationRecognition)
  ) / 3;
  
  return { score: Math.round(score), strengths, cautions };
}

/**
 * 보상 요인 호환성 계산
 */
function calculateRewardCompatibility(a: StartupMBTI, b: StartupMBTI): { score: number; strengths: string[]; cautions: string[] } {
  const strengths: string[] = [];
  const cautions: string[] = [];
  
  // 보상(급여): 비슷해야 함 - 기대치 차이가 크면 갈등
  const compensationDiff = Math.abs(a.rewardCompensation - b.rewardCompensation);
  if (compensationDiff > 40) {
    cautions.push('보상에 대한 기대치가 달라 수익 분배 시 갈등이 있을 수 있습니다');
  } else if (compensationDiff <= 20) {
    strengths.push('보상에 대한 기대치가 비슷합니다');
  }
  
  // 자율성: 둘 다 높으면 독립적 운영 가능
  if (a.rewardAutonomy >= 60 && b.rewardAutonomy >= 60) {
    strengths.push('자율적인 업무 환경을 선호해 독립적으로 일할 수 있습니다');
  }
  
  // 안정성: 비슷해야 함
  const stabilityDiff = Math.abs(a.rewardStability - b.rewardStability);
  if (stabilityDiff > 40) {
    cautions.push('안정성에 대한 니즈가 달라 리스크 감수 결정에서 갈등이 있을 수 있습니다');
  }
  
  const score = (
    similarityScore(a.rewardCompensation, b.rewardCompensation) +
    similarityScore(a.rewardAutonomy, b.rewardAutonomy) +
    similarityScore(a.rewardStability, b.rewardStability)
  ) / 3;
  
  return { score: Math.round(score), strengths, cautions };
}

/**
 * 파트너쉽 유형 호환성 계산 (가장 중요)
 */
function calculatePartnershipCompatibility(a: StartupMBTI, b: StartupMBTI): { score: number; strengths: string[]; cautions: string[] } {
  const strengths: string[] = [];
  const cautions: string[] = [];
  
  // 이기심: 둘 다 낮아야 함
  const selfishnessAvg = (a.partnerSelfishness + b.partnerSelfishness) / 2;
  if (selfishnessAvg <= 30) {
    strengths.push('팀 이익을 개인보다 우선시하는 성향입니다');
  } else if (selfishnessAvg >= 50) {
    cautions.push('개인 이익을 중시하는 성향이 있어 이해 충돌이 있을 수 있습니다');
  }
  
  // 동업성향: 둘 다 높으면 좋음
  const cooperationAvg = (a.partnerCooperation + b.partnerCooperation) / 2;
  if (cooperationAvg >= 60) {
    strengths.push('함께 일하는 것을 즐기는 동업 친화적 성향입니다');
  } else if (cooperationAvg <= 35) {
    cautions.push('독자적으로 일하는 것을 선호해 협업 조율이 필요합니다');
  }
  
  // 기업가정신: 비슷하거나 둘 다 높으면 좋음
  const entrepreneurshipScore = similarityScore(a.partnerEntrepreneurship, b.partnerEntrepreneurship);
  if (a.partnerEntrepreneurship >= 70 && b.partnerEntrepreneurship >= 70) {
    strengths.push('둘 다 도전적이고 혁신적인 기업가 정신이 강합니다');
  } else if (a.partnerEntrepreneurship >= 70 || b.partnerEntrepreneurship >= 70) {
    strengths.push('한 명이 새로운 도전을 이끌고 다른 한 명이 안정적으로 실행할 수 있습니다');
  }
  
  // 이기심 페널티: 둘 중 하나라도 높으면 감점
  const selfishnessPenalty = selfishnessAvg > 50 ? (selfishnessAvg - 50) * 0.5 : 0;
  
  const baseScore = (
    (100 - selfishnessAvg) +  // 이기심은 낮을수록 좋음
    cooperationAvg +
    entrepreneurshipScore
  ) / 3;
  
  return { score: Math.round(Math.max(0, baseScore - selfishnessPenalty)), strengths, cautions };
}

/**
 * 전체 StartupMBTI 호환성 계산
 */
export function calculateStartupMBTICompatibility(a: StartupMBTI, b: StartupMBTI): StartupMBTICompatibility {
  const founderResult = calculateFounderTraitCompatibility(a, b);
  const perfectionismResult = calculatePerfectionismCompatibility(a, b);
  const motivationResult = calculateMotivationCompatibility(a, b);
  const rewardResult = calculateRewardCompatibility(a, b);
  const partnershipResult = calculatePartnershipCompatibility(a, b);
  
  // 가중 평균 계산
  const overall = Math.round(
    founderResult.score * WEIGHTS.founderTrait +
    perfectionismResult.score * WEIGHTS.perfectionism +
    motivationResult.score * WEIGHTS.motivation +
    rewardResult.score * WEIGHTS.reward +
    partnershipResult.score * WEIGHTS.partnership
  );
  
  // 모든 강점/주의점 수집
  const allStrengths = [
    ...founderResult.strengths,
    ...perfectionismResult.strengths,
    ...motivationResult.strengths,
    ...rewardResult.strengths,
    ...partnershipResult.strengths,
  ];
  
  const allCautions = [
    ...founderResult.cautions,
    ...perfectionismResult.cautions,
    ...motivationResult.cautions,
    ...rewardResult.cautions,
    ...partnershipResult.cautions,
  ];
  
  // 상위 3개씩 선택
  const strengths = allStrengths.slice(0, 3);
  const cautions = allCautions.slice(0, 3);
  
  return {
    overall,
    founderTrait: founderResult.score,
    perfectionism: perfectionismResult.score,
    motivation: motivationResult.score,
    reward: rewardResult.score,
    partnership: partnershipResult.score,
    strengths,
    cautions,
  };
}

/**
 * 스트레스 호환성 점수 (보너스)
 * 스트레스 지수가 비슷하면 서로 이해하기 쉬움
 */
export function calculateStressCompatibility(a: StartupMBTI, b: StartupMBTI): number {
  const diff = Math.abs(a.stressIndex - b.stressIndex);
  // 스트레스 지수 차이가 20 이내면 100점, 이후 감점
  if (diff <= 20) return 100;
  if (diff <= 40) return 80;
  if (diff <= 60) return 60;
  return 40;
}

/**
 * 외부 ID로 StartupMBTI 검증
 */
export function validateExternalId(externalId: string): boolean {
  // PST2512ME63603 형식 검증: PST + 4자리 + 2자리 영문 + 5자리 숫자
  const pattern = /^PST\d{4}[A-Z]{2}\d{5}$/;
  return pattern.test(externalId);
}
