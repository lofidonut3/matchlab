import prisma from '../lib/prisma.js';
import { AppError } from '../middleware/index.js';
import { calculateProfileCompleteness } from '@matchlab/shared';
import type { TraitAxis } from '@matchlab/shared';

export interface OnboardingInput {
  availabilityHours: number;
  startDate: string;
  roleNeed: string;
  domain: string;
  goal: string;
  locationPref: string;
  traitAnswers?: Record<TraitAxis, 1 | 2>;
  startupMbtiId?: string; // 외부 창업 MBTI ID (예: PST2512ME63603)
}

export interface ProfileUpdateInput {
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
  decisionConsensus?: number;
  decisionData?: number;
  decisionSpeed?: number;
  decisionFlexibility?: number;
  decisionRisk?: number;
  conflictStyle?: string;
}

export class ProfileService {
  /**
   * 온보딩 완료 - 프로필 및 성향 결과 생성
   */
  async completeOnboarding(userId: string, input: OnboardingInput) {
    const { traitAnswers, startupMbtiId, ...profileData } = input;

    // 이미 프로필이 있는지 확인
    const existingProfile = await prisma.profile.findUnique({
      where: { userId },
    });

    if (existingProfile) {
      throw new AppError('이미 온보딩을 완료했습니다.', 400);
    }

    // startupMbtiId로 StartupMBTI 조회
    let startupMbti = null;
    if (startupMbtiId) {
      startupMbti = await prisma.startupMBTI.findUnique({
        where: { externalId: startupMbtiId },
      });

      if (!startupMbti) {
        throw new AppError('유효하지 않은 창업 MBTI ID입니다.', 400);
      }

      // 이미 다른 사용자에게 연결되어 있는지 확인
      if (startupMbti.userId && startupMbti.userId !== userId) {
        throw new AppError('이미 사용된 창업 MBTI ID입니다.', 400);
      }
    }

    // 트랜잭션으로 프로필과 성향 결과 동시 생성
    const result = await prisma.$transaction(async (tx) => {
      // 성향 결과 생성 (traitAnswers가 있는 경우에만)
      let traitResult = null;
      if (traitAnswers) {
        traitResult = await tx.traitResult.create({
          data: {
            userId,
            leadership: traitAnswers.leadership,
            execution: traitAnswers.execution,
            communication: traitAnswers.communication,
            risk: traitAnswers.risk,
            conflict: traitAnswers.conflict,
            flexibility: traitAnswers.flexibility,
          },
        });
      } else {
        // traitAnswers가 없으면 기본값으로 생성
        traitResult = await tx.traitResult.create({
          data: {
            userId,
            leadership: 1,
            execution: 1,
            communication: 1,
            risk: 1,
            conflict: 1,
            flexibility: 1,
          },
        });
      }

      // 프로필 생성
      const profile = await tx.profile.create({
        data: {
          userId,
          availabilityHours: profileData.availabilityHours,
          startDate: new Date(profileData.startDate),
          domains: JSON.stringify([profileData.domain]),
          roleNeed: JSON.stringify([profileData.roleNeed]),
          goal: profileData.goal,
          locationPref: profileData.locationPref,
          completeness: 40, // 온보딩 완료 시 기본 완성도
        },
      });

      // StartupMBTI를 사용자와 연결
      if (startupMbti) {
        await tx.startupMBTI.update({
          where: { id: startupMbti.id },
          data: { userId },
        });
      }

      // 신뢰도 점수 업데이트
      await tx.trustScore.update({
        where: { userId },
        data: {
          completeness: startupMbti ? 60 : 40, // StartupMBTI가 있으면 더 높은 완성도
          total: startupMbti ? 30 : 20,
        },
      });

      return { profile, traitResult, startupMbti };
    });

    return result;
  }

  /**
   * 내 프로필 조회
   */
  async getMyProfile(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        profile: true,
        traitResult: true,
        evidenceLinks: true,
        trustScore: true,
      },
    });

    if (!user) {
      throw new AppError('사용자를 찾을 수 없습니다.', 404);
    }

    if (!user.profile) {
      throw new AppError('프로필이 없습니다. 온보딩을 먼저 완료해주세요.', 400);
    }

    return this.formatProfile(user);
  }

  /**
   * 다른 사용자 프로필 조회
   */
  async getProfile(userId: string, viewerId?: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        profile: true,
        traitResult: true,
        evidenceLinks: {
          where: { isPublic: true },
        },
        trustScore: true,
      },
    });

    if (!user || !user.profile) {
      throw new AppError('프로필을 찾을 수 없습니다.', 404);
    }

    // 비공개 프로필 체크
    if (!user.profile.isPublic && userId !== viewerId) {
      throw new AppError('비공개 프로필입니다.', 403);
    }

    // 차단 체크
    if (viewerId) {
      const block = await prisma.block.findFirst({
        where: {
          OR: [
            { userId: viewerId, blockedUserId: userId },
            { userId: userId, blockedUserId: viewerId },
          ],
        },
      });

      if (block) {
        throw new AppError('프로필을 볼 수 없습니다.', 403);
      }
    }

    return this.formatProfile(user);
  }

  /**
   * 프로필 업데이트
   */
  async updateProfile(userId: string, input: ProfileUpdateInput) {
    const profile = await prisma.profile.findUnique({
      where: { userId },
    });

    if (!profile) {
      throw new AppError('프로필이 없습니다.', 404);
    }

    // 배열 필드들은 JSON 문자열로 변환
    const updateData: any = {};
    
    if (input.bio !== undefined) updateData.bio = input.bio;
    if (input.location !== undefined) updateData.location = input.location;
    if (input.locationPref !== undefined) updateData.locationPref = input.locationPref;
    if (input.availabilityHours !== undefined) updateData.availabilityHours = input.availabilityHours;
    if (input.startDate !== undefined) updateData.startDate = new Date(input.startDate);
    if (input.domains !== undefined) updateData.domains = JSON.stringify(input.domains);
    if (input.roleCan !== undefined) updateData.roleCan = JSON.stringify(input.roleCan);
    if (input.roleWant !== undefined) updateData.roleWant = JSON.stringify(input.roleWant);
    if (input.roleNeed !== undefined) updateData.roleNeed = JSON.stringify(input.roleNeed);
    if (input.skills !== undefined) updateData.skills = JSON.stringify(input.skills);
    if (input.commChannel !== undefined) updateData.commChannel = input.commChannel;
    if (input.responseSla !== undefined) updateData.responseSla = input.responseSla;
    if (input.meetingFreq !== undefined) updateData.meetingFreq = input.meetingFreq;
    if (input.goal !== undefined) updateData.goal = input.goal;
    if (input.decisionConsensus !== undefined) updateData.decisionConsensus = input.decisionConsensus;
    if (input.decisionData !== undefined) updateData.decisionData = input.decisionData;
    if (input.decisionSpeed !== undefined) updateData.decisionSpeed = input.decisionSpeed;
    if (input.decisionFlexibility !== undefined) updateData.decisionFlexibility = input.decisionFlexibility;
    if (input.decisionRisk !== undefined) updateData.decisionRisk = input.decisionRisk;
    if (input.conflictStyle !== undefined) updateData.conflictStyle = input.conflictStyle;

    // 완성도 재계산
    const mergedProfile = { ...profile, ...updateData };
    const completeness = calculateProfileCompleteness({
      bio: mergedProfile.bio,
      location: mergedProfile.location,
      locationPref: mergedProfile.locationPref,
      availabilityHours: mergedProfile.availabilityHours,
      startDate: mergedProfile.startDate?.toISOString(),
      domains: this.parseJsonArray(mergedProfile.domains),
      roleCan: this.parseJsonArray(mergedProfile.roleCan),
      roleWant: this.parseJsonArray(mergedProfile.roleWant),
      roleNeed: this.parseJsonArray(mergedProfile.roleNeed),
      skills: this.parseJsonArray(mergedProfile.skills),
      commChannel: mergedProfile.commChannel,
      responseSla: mergedProfile.responseSla,
      meetingFreq: mergedProfile.meetingFreq,
      goal: mergedProfile.goal,
      conflictStyle: mergedProfile.conflictStyle,
      decisionConsensus: mergedProfile.decisionConsensus,
    });

    updateData.completeness = completeness;

    // 프로필 업데이트
    const updated = await prisma.profile.update({
      where: { userId },
      data: updateData,
    });

    // 신뢰도 점수 업데이트
    await prisma.trustScore.update({
      where: { userId },
      data: {
        completeness,
        total: Math.round(completeness * 0.4), // 임시 계산
      },
    });

    return updated;
  }

  /**
   * 증거 링크 추가
   */
  async addEvidenceLink(userId: string, input: {
    type: string;
    url: string;
    title?: string;
    isPublic?: boolean;
  }) {
    const link = await prisma.evidenceLink.create({
      data: {
        userId,
        type: input.type,
        url: input.url,
        title: input.title,
        isPublic: input.isPublic ?? false,
      },
    });

    // 증거 강도 업데이트
    const linkCount = await prisma.evidenceLink.count({
      where: { userId, verifiedByUser: true },
    });

    await prisma.trustScore.update({
      where: { userId },
      data: {
        evidenceStrength: Math.min(100, linkCount * 20),
      },
    });

    return link;
  }

  /**
   * 증거 링크 검증 (사용자 확인)
   */
  async verifyEvidenceLink(userId: string, linkId: string) {
    const link = await prisma.evidenceLink.findFirst({
      where: { id: linkId, userId },
    });

    if (!link) {
      throw new AppError('증거 링크를 찾을 수 없습니다.', 404);
    }

    return prisma.evidenceLink.update({
      where: { id: linkId },
      data: { verifiedByUser: true },
    });
  }

  // Helper methods
  private parseJsonArray(jsonStr: string | undefined): string[] {
    if (!jsonStr) return [];
    try {
      return JSON.parse(jsonStr);
    } catch {
      return [];
    }
  }

  private formatProfile(user: any) {
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
      domains: this.parseJsonArray(profile.domains),
      roleCan: this.parseJsonArray(profile.roleCan),
      roleWant: this.parseJsonArray(profile.roleWant),
      roleNeed: this.parseJsonArray(profile.roleNeed),
      skills: this.parseJsonArray(profile.skills),
      commChannel: profile.commChannel,
      responseSla: profile.responseSla,
      meetingFreq: profile.meetingFreq,
      goal: profile.goal,
      decisionConsensus: profile.decisionConsensus,
      decisionData: profile.decisionData,
      decisionSpeed: profile.decisionSpeed,
      decisionFlexibility: profile.decisionFlexibility,
      decisionRisk: profile.decisionRisk,
      conflictStyle: profile.conflictStyle,
      completeness: profile.completeness,
      traits: user.traitResult ? {
        leadership: user.traitResult.leadership,
        execution: user.traitResult.execution,
        communication: user.traitResult.communication,
        risk: user.traitResult.risk,
        conflict: user.traitResult.conflict,
        flexibility: user.traitResult.flexibility,
      } : null,
      evidenceLinks: user.evidenceLinks?.map((link: any) => ({
        id: link.id,
        type: link.type,
        url: link.url,
        title: link.title,
        summary: link.summary,
        tags: this.parseJsonArray(link.tags),
        verifiedByUser: link.verifiedByUser,
        createdAt: link.createdAt.toISOString(),
      })) || [],
      trustScore: user.trustScore ? {
        completeness: user.trustScore.completeness,
        evidenceStrength: user.trustScore.evidenceStrength,
        activity: user.trustScore.activity,
        reputation: user.trustScore.reputation,
        total: user.trustScore.total,
      } : null,
    };
  }
}

export const profileService = new ProfileService();
