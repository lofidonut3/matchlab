import prisma from '../lib/prisma.js';
import { AppError } from '../middleware/index.js';
import { notificationService } from './notification.service.js';

export class InviteService {
  /**
   * 초대 보내기
   */
  async sendInvite(fromUserId: string, toUserId: string, message?: string) {
    // 자기 자신에게 초대 불가
    if (fromUserId === toUserId) {
      throw new AppError('자기 자신에게 초대를 보낼 수 없습니다.', 400);
    }

    // 상대방 존재 확인
    const toUser = await prisma.user.findUnique({
      where: { id: toUserId },
      include: { profile: true },
    });

    if (!toUser || !toUser.profile) {
      throw new AppError('상대방을 찾을 수 없습니다.', 404);
    }

    // 차단 체크
    const blocked = await prisma.block.findFirst({
      where: {
        OR: [
          { userId: fromUserId, blockedUserId: toUserId },
          { userId: toUserId, blockedUserId: fromUserId },
        ],
      },
    });

    if (blocked) {
      throw new AppError('초대를 보낼 수 없습니다.', 403);
    }

    // 기존 초대 체크
    const existingInvite = await prisma.invite.findFirst({
      where: {
        OR: [
          { fromUserId, toUserId },
          { fromUserId: toUserId, toUserId: fromUserId },
        ],
        status: { in: ['pending', 'accepted'] },
      },
    });

    if (existingInvite) {
      if (existingInvite.status === 'accepted') {
        throw new AppError('이미 팀이 형성되었습니다.', 400);
      }
      throw new AppError('이미 대기 중인 초대가 있습니다.', 400);
    }

    // 초대 생성
    const invite = await prisma.invite.create({
      data: {
        fromUserId,
        toUserId,
        message,
        status: 'pending',
      },
      include: {
        fromUser: { select: { id: true, nickname: true, email: true } },
        toUser: { select: { id: true, nickname: true, email: true } },
      },
    });

    // 알림 생성
    await notificationService.create({
      userId: toUserId,
      type: 'invite_received',
      title: '새로운 팀 초대',
      message: `${invite.fromUser.nickname}님이 팀 초대를 보냈습니다.`,
      link: `/inbox`,
    });

    return invite;
  }

  /**
   * 초대 수락
   */
  async acceptInvite(inviteId: string, userId: string) {
    const invite = await prisma.invite.findUnique({
      where: { id: inviteId },
      include: {
        fromUser: { include: { profile: true } },
        toUser: { include: { profile: true } },
      },
    });

    if (!invite) {
      throw new AppError('초대를 찾을 수 없습니다.', 404);
    }

    if (invite.toUserId !== userId) {
      throw new AppError('이 초대를 수락할 권한이 없습니다.', 403);
    }

    if (invite.status !== 'pending') {
      throw new AppError('이미 처리된 초대입니다.', 400);
    }

    // 팀 생성
    const team = await this.createTeamFromInvite(invite);

    // 초대 상태 업데이트
    const updatedInvite = await prisma.invite.update({
      where: { id: inviteId },
      data: {
        status: 'accepted',
        teamId: team.id,
      },
    });

    // 알림 생성
    await notificationService.create({
      userId: invite.fromUserId,
      type: 'invite_accepted',
      title: '초대가 수락되었습니다',
      message: `${invite.toUser.nickname}님이 팀 초대를 수락했습니다.`,
      link: `/teams/${team.id}`,
    });

    return { invite: updatedInvite, team };
  }

  /**
   * 초대 거절
   */
  async declineInvite(inviteId: string, userId: string) {
    const invite = await prisma.invite.findUnique({
      where: { id: inviteId },
      include: {
        fromUser: true,
        toUser: true,
      },
    });

    if (!invite) {
      throw new AppError('초대를 찾을 수 없습니다.', 404);
    }

    if (invite.toUserId !== userId) {
      throw new AppError('이 초대를 거절할 권한이 없습니다.', 403);
    }

    if (invite.status !== 'pending') {
      throw new AppError('이미 처리된 초대입니다.', 400);
    }

    const updatedInvite = await prisma.invite.update({
      where: { id: inviteId },
      data: { status: 'declined' },
    });

    // 알림 생성
    await notificationService.create({
      userId: invite.fromUserId,
      type: 'invite_declined',
      title: '초대가 거절되었습니다',
      message: `${invite.toUser.nickname}님이 팀 초대를 정중히 거절했습니다.`,
      link: `/inbox`,
    });

    return updatedInvite;
  }

  /**
   * 받은/보낸 초대 목록
   */
  async getInvites(userId: string) {
    const [received, sent] = await Promise.all([
      prisma.invite.findMany({
        where: { toUserId: userId },
        include: {
          fromUser: {
            select: { id: true, nickname: true, email: true },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.invite.findMany({
        where: { fromUserId: userId },
        include: {
          toUser: {
            select: { id: true, nickname: true, email: true },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    return { received, sent };
  }

  /**
   * 팀 생성 (초대 수락 시)
   */
  private async createTeamFromInvite(invite: any) {
    const fromProfile = invite.fromUser.profile;
    const toProfile = invite.toUser.profile;

    // 팀 목표 결정 (먼저 초대한 사람의 목표)
    const goal = fromProfile?.goal || toProfile?.goal || 'side_project';

    // R&R 자동 생성
    const rnr: Record<string, string> = {};
    
    // fromUser의 역할
    const fromRoles = JSON.parse(fromProfile?.roleCan || '[]');
    rnr[invite.fromUserId] = fromRoles[0] || '미정';
    
    // toUser의 역할
    const toRoles = JSON.parse(toProfile?.roleCan || '[]');
    rnr[invite.toUserId] = toRoles[0] || '미정';

    // 팀 생성
    const team = await prisma.team.create({
      data: {
        name: `${invite.fromUser.nickname} & ${invite.toUser.nickname} 팀`,
        goal,
        rnr: JSON.stringify(rnr),
        meetingSchedule: '주 2회 (미정)',
        status: 'active',
        members: {
          create: [
            { userId: invite.fromUserId, role: rnr[invite.fromUserId] },
            { userId: invite.toUserId, role: rnr[invite.toUserId] },
          ],
        },
      },
      include: {
        members: {
          include: {
            user: { select: { id: true, nickname: true, email: true } },
          },
        },
      },
    });

    // 2주 스프린트 자동 생성
    await this.createInitialSprint(team.id, goal);

    return team;
  }

  /**
   * 초기 스프린트 생성
   */
  private async createInitialSprint(teamId: string, goal: string) {
    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + 14);

    // 기본 체크리스트
    const defaultChecklist = [
      { title: '팀 규칙 합의', description: '소통 채널, 응답 시간, 미팅 일정 확정', order: 1 },
      { title: '목표 구체화', description: `"${goal}" 목표를 세부 마일스톤으로 분해`, order: 2 },
      { title: '역할 분담 확정', description: '각자 담당 영역과 책임 범위 명확화', order: 3 },
      { title: '1주차 미션 수행', description: '첫 번째 마일스톤 달성', order: 4 },
      { title: '중간 회고', description: '1주차 성과와 문제점 점검', order: 5 },
      { title: '2주차 미션 수행', description: '두 번째 마일스톤 달성', order: 6 },
      { title: '최종 회고 및 결정', description: '팀 유지/해산/리매칭 결정', order: 7 },
    ];

    const sprint = await prisma.sprint.create({
      data: {
        teamId,
        startDate,
        endDate,
        status: 'in_progress',
        checklistItems: {
          create: defaultChecklist,
        },
      },
      include: {
        checklistItems: true,
      },
    });

    return sprint;
  }
}

export const inviteService = new InviteService();
