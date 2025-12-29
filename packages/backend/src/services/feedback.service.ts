import prisma from '../lib/prisma.js';
import { AppError } from '../middleware/index.js';

export interface FeedbackInput {
  toUserId: string;
  teamId: string;
  ratingPromise: number;       // 1-5
  ratingResponse: number;      // 1-5
  ratingContribution: number;  // 1-5
  comment?: string;
  decision: 'continue' | 'dissolve' | 'rematch';
}

export class FeedbackService {
  /**
   * 피드백 제출
   */
  async submitFeedback(fromUserId: string, input: FeedbackInput) {
    // 팀 존재 확인
    const team = await prisma.team.findUnique({
      where: { id: input.teamId },
      include: { members: true },
    });

    if (!team) {
      throw new AppError('팀을 찾을 수 없습니다.', 404);
    }

    // 둘 다 팀 멤버인지 확인
    const isFromMember = team.members.some(m => m.userId === fromUserId);
    const isToMember = team.members.some(m => m.userId === input.toUserId);

    if (!isFromMember || !isToMember) {
      throw new AppError('피드백 대상이 올바르지 않습니다.', 400);
    }

    // 기존 피드백 확인
    const existingFeedback = await prisma.feedback.findUnique({
      where: {
        fromUserId_toUserId_teamId: {
          fromUserId,
          toUserId: input.toUserId,
          teamId: input.teamId,
        },
      },
    });

    if (existingFeedback) {
      throw new AppError('이미 피드백을 제출했습니다.', 400);
    }

    // 피드백 생성
    const feedback = await prisma.feedback.create({
      data: {
        fromUserId,
        toUserId: input.toUserId,
        teamId: input.teamId,
        ratingPromise: input.ratingPromise,
        ratingResponse: input.ratingResponse,
        ratingContribution: input.ratingContribution,
        comment: input.comment,
        decision: input.decision,
      },
    });

    // 평판 점수 업데이트
    await this.updateReputation(input.toUserId);

    return feedback;
  }

  /**
   * 내 피드백 조회
   */
  async getMyFeedbacks(userId: string) {
    const [given, received] = await Promise.all([
      prisma.feedback.findMany({
        where: { fromUserId: userId },
        include: {
          toUser: { select: { id: true, nickname: true } },
          team: { select: { id: true, name: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.feedback.findMany({
        where: { toUserId: userId },
        include: {
          fromUser: { select: { id: true, nickname: true } },
          team: { select: { id: true, name: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    return { given, received };
  }

  /**
   * 평판 점수 업데이트
   */
  private async updateReputation(userId: string) {
    const feedbacks = await prisma.feedback.findMany({
      where: { toUserId: userId },
    });

    if (feedbacks.length === 0) return;

    // 평균 점수 계산
    const avgPromise = feedbacks.reduce((s, f) => s + f.ratingPromise, 0) / feedbacks.length;
    const avgResponse = feedbacks.reduce((s, f) => s + f.ratingResponse, 0) / feedbacks.length;
    const avgContribution = feedbacks.reduce((s, f) => s + f.ratingContribution, 0) / feedbacks.length;

    // 5점 만점을 100점 만점으로 변환
    const reputation = Math.round(((avgPromise + avgResponse + avgContribution) / 3) * 20);

    // 신뢰도 점수 업데이트
    await prisma.trustScore.update({
      where: { userId },
      data: { reputation },
    });
  }

  /**
   * 팀 피드백 현황 조회
   */
  async getTeamFeedbackStatus(teamId: string, userId: string) {
    const team = await prisma.team.findUnique({
      where: { id: teamId },
      include: {
        members: {
          include: {
            user: { select: { id: true, nickname: true } },
          },
        },
        feedbacks: true,
      },
    });

    if (!team) {
      throw new AppError('팀을 찾을 수 없습니다.', 404);
    }

    const isMember = team.members.some(m => m.userId === userId);
    if (!isMember) {
      throw new AppError('권한이 없습니다.', 403);
    }

    // 각 멤버에 대해 피드백 제출 여부 확인
    const members = team.members.map(m => {
      const feedbackGiven = team.feedbacks.some(
        f => f.fromUserId === userId && f.toUserId === m.userId
      );
      const feedbackReceived = team.feedbacks.some(
        f => f.fromUserId === m.userId && f.toUserId === userId
      );

      return {
        userId: m.userId,
        nickname: m.user.nickname,
        feedbackGiven: m.userId === userId ? null : feedbackGiven,
        feedbackReceived: m.userId === userId ? null : feedbackReceived,
      };
    });

    // 모든 피드백이 완료되었는지 확인
    const totalExpected = team.members.length * (team.members.length - 1);
    const totalSubmitted = team.feedbacks.length;
    const allCompleted = totalSubmitted >= totalExpected;

    return {
      members,
      totalExpected,
      totalSubmitted,
      allCompleted,
    };
  }
}

export const feedbackService = new FeedbackService();
