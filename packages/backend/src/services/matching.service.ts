import prisma from '../lib/prisma.js';
import { AppError } from '../middleware/index.js';
import { config } from '../config/index.js';
import {
  filterCandidates,
  calculateMatchScore,
  generateExplanation,
  generateRelaxationSuggestions,
  type CandidateProfile,
  type FilterCriteria,
  type ProfileForScoring,
  type ProfileForExplanation,
} from './matching/index.js';

export class MatchingService {
  /**
   * Top10 추천 후보 가져오기
   */
  async getRecommendations(userId: string, limit = 10) {
    // 내 프로필 조회
    const viewer = await this.getFullProfile(userId);
    if (!viewer) {
      throw new AppError('프로필이 없습니다. 온보딩을 먼저 완료해주세요.', 400);
    }

    // 차단된 사용자 ID 목록
    const blockedIds = await this.getBlockedUserIds(userId);

    // 모든 후보 프로필 조회 (나와 차단된 사용자 제외)
    const candidates = await prisma.user.findMany({
      where: {
        id: { notIn: [userId, ...blockedIds] },
        status: 'active',
        profile: { isNot: null },
      },
      include: {
        profile: true,
        traitResult: true,
        trustScore: true,
        evidenceLinks: true,
      },
    });

    // 하드필터 적용
    const filterCriteria: FilterCriteria = {
      availabilityHours: viewer.profile!.availabilityHours,
      startDate: viewer.profile!.startDate,
      locationPref: viewer.profile!.locationPref,
      roleNeed: this.parseJson(viewer.profile!.roleNeed),
      goal: viewer.profile!.goal,
    };

    const candidateProfiles: CandidateProfile[] = candidates.map(c => ({
      userId: c.id,
      availabilityHours: c.profile!.availabilityHours,
      startDate: c.profile!.startDate,
      locationPref: c.profile!.locationPref,
      roleCan: this.parseJson(c.profile!.roleCan),
      roleWant: this.parseJson(c.profile!.roleWant),
      roleNeed: this.parseJson(c.profile!.roleNeed),
      goal: c.profile!.goal,
      isBlocked: false,
    }));

    const filteredCandidates = filterCandidates(candidateProfiles, filterCriteria);
    const filteredIds = new Set(filteredCandidates.map(c => c.userId));

    // 스코어 계산 및 정렬
    const scoredCandidates = candidates
      .filter(c => filteredIds.has(c.id))
      .map(candidate => {
        const viewerScoring = this.toScoringProfile(viewer);
        const candidateScoring = this.toScoringProfile(candidate);
        
        const scoreResult = calculateMatchScore(viewerScoring, candidateScoring);
        
        const viewerExplanation = this.toExplanationProfile(viewer);
        const candidateExplanation = this.toExplanationProfile(candidate);
        
        const explanation = generateExplanation(
          viewerExplanation,
          candidateExplanation,
          scoreResult.breakdown
        );

        return {
          candidate,
          score: scoreResult,
          explanation,
        };
      })
      // 정렬: 1) 실제 사용자 우선, 2) 점수순
      .sort((a, b) => {
        const aIsReal = !a.candidate.email.endsWith('@matchlab.test');
        const bIsReal = !b.candidate.email.endsWith('@matchlab.test');
        
        // 실제 사용자를 먼저 표시
        if (aIsReal && !bIsReal) return -1;
        if (!aIsReal && bIsReal) return 1;
        
        // 같은 그룹 내에서는 점수순
        return b.score.total - a.score.total;
      })
      .slice(0, limit);

    // 조건 완화 제안
    const relaxationSuggestions = generateRelaxationSuggestions(
      candidateProfiles,
      filterCriteria
    );

    // 결과 포맷팅
    const recommendations = scoredCandidates.map(({ candidate, score, explanation }) => ({
      userId: candidate.id,
      nickname: candidate.nickname,
      profile: this.formatPublicProfile(candidate),
      matchScore: {
        candidateId: candidate.id,
        stability: score.stability,
        synergy: score.synergy,
        trust: score.trust,
        penalties: score.penalties,
        total: score.total,
        reasonsTop3: explanation.reasonsTop3,
        caution: explanation.caution,
      },
      explanation: {
        reasons: explanation.reasonsTop3,
        caution: explanation.caution,
      },
    }));

    // 캐시 저장 (비동기)
    this.cacheMatchScores(userId, recommendations).catch(console.error);

    return {
      recommendations,
      totalCandidates: candidates.length,
      filteredCount: filteredCandidates.length,
      relaxationSuggestions: relaxationSuggestions.slice(0, 2),
    };
  }

  /**
   * 특정 후보와의 매칭 상세 조회
   */
  async getMatchDetail(viewerId: string, candidateId: string) {
    const viewer = await this.getFullProfile(viewerId);
    const candidate = await this.getFullProfile(candidateId);

    if (!viewer || !viewer.profile) {
      throw new AppError('프로필이 없습니다.', 400);
    }
    if (!candidate || !candidate.profile) {
      throw new AppError('후보를 찾을 수 없습니다.', 404);
    }

    // 차단 체크
    const blocked = await prisma.block.findFirst({
      where: {
        OR: [
          { userId: viewerId, blockedUserId: candidateId },
          { userId: candidateId, blockedUserId: viewerId },
        ],
      },
    });

    if (blocked) {
      throw new AppError('해당 프로필을 볼 수 없습니다.', 403);
    }

    const viewerScoring = this.toScoringProfile(viewer);
    const candidateScoring = this.toScoringProfile(candidate);
    
    const scoreResult = calculateMatchScore(viewerScoring, candidateScoring);
    
    const viewerExplanation = this.toExplanationProfile(viewer);
    const candidateExplanation = this.toExplanationProfile(candidate);
    
    const explanation = generateExplanation(
      viewerExplanation,
      candidateExplanation,
      scoreResult.breakdown
    );

    return {
      profile: this.formatPublicProfile(candidate),
      matchScore: {
        candidateId: candidate.id,
        stability: scoreResult.stability,
        synergy: scoreResult.synergy,
        trust: scoreResult.trust,
        penalties: scoreResult.penalties,
        total: scoreResult.total,
        reasonsTop3: explanation.reasonsTop3,
        caution: explanation.caution,
      },
      breakdown: scoreResult.breakdown,
    };
  }

  /**
   * 탐색 (필터링된 후보 검색)
   */
  async explore(userId: string, filters: {
    domains?: string[];
    roles?: string[];
    goals?: string[];
    locationPref?: string[];
    minHours?: number;
    maxHours?: number;
  }, page = 1, pageSize = 20) {
    const blockedIds = await this.getBlockedUserIds(userId);

    // 기본 쿼리 조건
    const whereConditions: any = {
      id: { notIn: [userId, ...blockedIds] },
      status: 'active',
      profile: {
        is: {
          isPublic: true,
        },
      },
    };

    // 프로필 조건 추가
    const profileConditions: any = {};
    
    if (filters.minHours !== undefined || filters.maxHours !== undefined) {
      profileConditions.availabilityHours = {};
      if (filters.minHours !== undefined) {
        profileConditions.availabilityHours.gte = filters.minHours;
      }
      if (filters.maxHours !== undefined) {
        profileConditions.availabilityHours.lte = filters.maxHours;
      }
    }

    if (filters.goals && filters.goals.length > 0) {
      profileConditions.goal = { in: filters.goals };
    }

    if (filters.locationPref && filters.locationPref.length > 0) {
      profileConditions.locationPref = { in: filters.locationPref };
    }

    if (Object.keys(profileConditions).length > 0) {
      whereConditions.profile.is = { ...whereConditions.profile.is, ...profileConditions };
    }

    // 후보 조회
    const [candidates, total] = await Promise.all([
      prisma.user.findMany({
        where: whereConditions,
        include: {
          profile: true,
          traitResult: true,
          trustScore: true,
        },
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { lastActiveAt: 'desc' },
      }),
      prisma.user.count({ where: whereConditions }),
    ]);

    // 추가 필터링 (JSON 필드는 DB에서 못하므로)
    let filtered = candidates;
    
    if (filters.domains && filters.domains.length > 0) {
      filtered = filtered.filter(c => {
        const domains = this.parseJson(c.profile!.domains);
        return filters.domains!.some(d => domains.includes(d));
      });
    }

    if (filters.roles && filters.roles.length > 0) {
      filtered = filtered.filter(c => {
        const roleCan = this.parseJson(c.profile!.roleCan);
        const roleWant = this.parseJson(c.profile!.roleWant);
        const allRoles = [...roleCan, ...roleWant];
        return filters.roles!.some(r => allRoles.includes(r));
      });
    }

    // 뷰어 정보 가져와서 매칭 스코어 계산
    const viewer = await this.getFullProfile(userId);
    
    const items = filtered.map(candidate => {
      let matchScore = {
        candidateId: candidate.id,
        stability: 0,
        synergy: 0,
        trust: 0,
        penalties: 0,
        total: 0,
        reasonsTop3: [] as string[],
        caution: null as string | null,
      };
      
      let explanation = {
        reasons: [] as string[],
        caution: null as string | null,
      };

      // 뷰어 프로필이 있으면 매칭 스코어 계산
      if (viewer?.profile) {
        try {
          const viewerScoring = this.toScoringProfile(viewer);
          const candidateScoring = this.toScoringProfile(candidate);
          const scoreResult = calculateMatchScore(viewerScoring, candidateScoring);
          
          const viewerExplanation = this.toExplanationProfile(viewer);
          const candidateExplanation = this.toExplanationProfile(candidate);
          const explanationResult = generateExplanation(
            viewerExplanation,
            candidateExplanation,
            scoreResult.breakdown
          );

          matchScore = {
            candidateId: candidate.id,
            stability: scoreResult.stability,
            synergy: scoreResult.synergy,
            trust: scoreResult.trust,
            penalties: scoreResult.penalties,
            total: scoreResult.total,
            reasonsTop3: explanationResult.reasonsTop3,
            caution: explanationResult.caution,
          };
          
          explanation = {
            reasons: explanationResult.reasonsTop3,
            caution: explanationResult.caution,
          };
        } catch (e) {
          // 스코어 계산 실패시 기본값 사용
        }
      }

      return {
        userId: candidate.id,
        nickname: candidate.nickname,
        email: candidate.email, // 정렬용
        profile: this.formatPublicProfile(candidate),
        matchScore,
        explanation,
      };
    });

    // 정렬: 1) 실제 사용자 우선, 2) 점수순
    const sortedItems = items
      .sort((a, b) => {
        const aIsReal = !a.email.endsWith('@matchlab.test');
        const bIsReal = !b.email.endsWith('@matchlab.test');
        
        if (aIsReal && !bIsReal) return -1;
        if (!aIsReal && bIsReal) return 1;
        
        return b.matchScore.total - a.matchScore.total;
      })
      .map(({ email, ...rest }) => rest); // email 필드 제거

    return {
      items: sortedItems,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  // Private helper methods

  private async getFullProfile(userId: string) {
    return prisma.user.findUnique({
      where: { id: userId },
      include: {
        profile: true,
        traitResult: true,
        trustScore: true,
        evidenceLinks: true,
      },
    });
  }

  private async getBlockedUserIds(userId: string): Promise<string[]> {
    const blocks = await prisma.block.findMany({
      where: {
        OR: [
          { userId },
          { blockedUserId: userId },
        ],
      },
    });

    return blocks.map(b => b.userId === userId ? b.blockedUserId : b.userId);
  }

  private parseJson(jsonStr: string | undefined | null): string[] {
    if (!jsonStr) return [];
    try {
      return JSON.parse(jsonStr);
    } catch {
      return [];
    }
  }

  private toScoringProfile(user: any): ProfileForScoring {
    const profile = user.profile;
    return {
      userId: user.id,
      goal: profile.goal,
      availabilityHours: profile.availabilityHours,
      roleCan: this.parseJson(profile.roleCan),
      roleWant: this.parseJson(profile.roleWant),
      roleNeed: this.parseJson(profile.roleNeed),
      skills: this.parseJson(profile.skills),
      domains: this.parseJson(profile.domains),
      commChannel: profile.commChannel,
      responseSla: profile.responseSla,
      meetingFreq: profile.meetingFreq,
      decisionConsensus: profile.decisionConsensus,
      decisionData: profile.decisionData,
      decisionSpeed: profile.decisionSpeed,
      decisionFlexibility: profile.decisionFlexibility,
      decisionRisk: profile.decisionRisk,
      conflictStyle: profile.conflictStyle,
      traits: user.traitResult ? {
        leadership: user.traitResult.leadership,
        execution: user.traitResult.execution,
        communication: user.traitResult.communication,
        risk: user.traitResult.risk,
        conflict: user.traitResult.conflict,
        flexibility: user.traitResult.flexibility,
      } : undefined,
      trustScore: user.trustScore ? {
        completeness: user.trustScore.completeness,
        evidenceStrength: user.trustScore.evidenceStrength,
        activity: user.trustScore.activity,
        reputation: user.trustScore.reputation,
        total: user.trustScore.total,
      } : undefined,
    };
  }

  private toExplanationProfile(user: any): ProfileForExplanation {
    const profile = user.profile;
    return {
      nickname: user.nickname,
      goal: profile.goal,
      availabilityHours: profile.availabilityHours,
      roleCan: this.parseJson(profile.roleCan),
      roleWant: this.parseJson(profile.roleWant),
      roleNeed: this.parseJson(profile.roleNeed),
      domains: this.parseJson(profile.domains),
      meetingFreq: profile.meetingFreq,
      conflictStyle: profile.conflictStyle,
    };
  }

  private formatPublicProfile(user: any) {
    const profile = user.profile;
    return {
      id: profile.id,
      userId: user.id,
      nickname: user.nickname,
      bio: profile.bio,
      location: profile.location,
      locationPref: profile.locationPref,
      availabilityHours: profile.availabilityHours,
      startDate: profile.startDate.toISOString().split('T')[0],
      domains: this.parseJson(profile.domains),
      roleCan: this.parseJson(profile.roleCan),
      roleWant: this.parseJson(profile.roleWant),
      roleNeed: this.parseJson(profile.roleNeed),
      goal: profile.goal,
      completeness: profile.completeness,
      traits: user.traitResult ? {
        leadership: user.traitResult.leadership,
        execution: user.traitResult.execution,
        communication: user.traitResult.communication,
        risk: user.traitResult.risk,
        conflict: user.traitResult.conflict,
        flexibility: user.traitResult.flexibility,
      } : null,
      trustScore: user.trustScore?.total || 0,
    };
  }

  private async cacheMatchScores(viewerId: string, recommendations: any[]) {
    for (const rec of recommendations) {
      await prisma.matchScore.upsert({
        where: {
          viewerId_candidateId: {
            viewerId,
            candidateId: rec.matchScore.candidateId,
          },
        },
        update: {
          stability: rec.matchScore.stability,
          synergy: rec.matchScore.synergy,
          trust: rec.matchScore.trust,
          penalties: rec.matchScore.penalties,
          total: rec.matchScore.total,
          reasonsTop3: JSON.stringify(rec.matchScore.reasonsTop3),
          caution: rec.matchScore.caution,
          calculatedAt: new Date(),
        },
        create: {
          viewerId,
          candidateId: rec.matchScore.candidateId,
          stability: rec.matchScore.stability,
          synergy: rec.matchScore.synergy,
          trust: rec.matchScore.trust,
          penalties: rec.matchScore.penalties,
          total: rec.matchScore.total,
          reasonsTop3: JSON.stringify(rec.matchScore.reasonsTop3),
          caution: rec.matchScore.caution,
        },
      });
    }
  }
}

export const matchingService = new MatchingService();
