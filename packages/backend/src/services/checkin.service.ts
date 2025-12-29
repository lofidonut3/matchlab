import prisma from '../lib/prisma.js';
import { AppError } from '../middleware/index.js';
import { notificationService } from './notification.service.js';
import { riskService } from './risk.service.js';

export interface CheckInInput {
  sprintId: string;
  progress: number;      // 0-100
  satisfaction: number;  // 1-5
  blockers?: string;
  notes?: string;
}

export class CheckInService {
  /**
   * 체크인 제출
   */
  async submitCheckIn(userId: string, input: CheckInInput) {
    // 스프린트 존재 및 멤버 확인
    const sprint = await prisma.sprint.findUnique({
      where: { id: input.sprintId },
      include: {
        team: {
          include: { members: true },
        },
      },
    });

    if (!sprint) {
      throw new AppError('스프린트를 찾을 수 없습니다.', 404);
    }

    const isMember = sprint.team.members.some(m => m.userId === userId);
    if (!isMember) {
      throw new AppError('팀 멤버가 아닙니다.', 403);
    }

    if (sprint.status !== 'in_progress') {
      throw new AppError('진행 중인 스프린트가 아닙니다.', 400);
    }

    // 오늘 이미 체크인 했는지 확인
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const existingCheckIn = await prisma.checkIn.findFirst({
      where: {
        sprintId: input.sprintId,
        userId,
        createdAt: { gte: today },
      },
    });

    if (existingCheckIn) {
      throw new AppError('오늘은 이미 체크인을 완료했습니다.', 400);
    }

    // 체크인 생성
    const checkIn = await prisma.checkIn.create({
      data: {
        sprintId: input.sprintId,
        userId,
        progress: input.progress,
        satisfaction: input.satisfaction,
        blockers: input.blockers,
        notes: input.notes,
      },
    });

    // 리스크 감지
    const riskWarnings = await riskService.detectRisks(sprint.team.id);

    // 다른 팀원에게 알림
    for (const member of sprint.team.members) {
      if (member.userId !== userId) {
        await notificationService.create({
          userId: member.userId,
          type: 'checkin_reminder',
          title: '팀원이 체크인했습니다',
          message: `진행률 ${input.progress}%, 만족도 ${input.satisfaction}점`,
          link: `/teams/${sprint.team.id}`,
        });
      }
    }

    return { checkIn, riskWarnings };
  }

  /**
   * 스프린트 체크인 목록 조회
   */
  async getCheckIns(sprintId: string, userId: string) {
    const sprint = await prisma.sprint.findUnique({
      where: { id: sprintId },
      include: {
        team: { include: { members: true } },
        checkIns: {
          orderBy: { createdAt: 'desc' },
          include: {
            user: { select: { id: true, nickname: true } },
          },
        },
      },
    });

    if (!sprint) {
      throw new AppError('스프린트를 찾을 수 없습니다.', 404);
    }

    const isMember = sprint.team.members.some(m => m.userId === userId);
    if (!isMember) {
      throw new AppError('팀 멤버가 아닙니다.', 403);
    }

    return sprint.checkIns.map(c => ({
      id: c.id,
      userId: c.userId,
      nickname: c.user.nickname,
      progress: c.progress,
      satisfaction: c.satisfaction,
      blockers: c.blockers,
      notes: c.notes,
      createdAt: c.createdAt,
    }));
  }

  /**
   * 체크인 필요 여부 확인
   */
  async checkInNeeded(userId: string): Promise<Array<{
    teamId: string;
    teamName: string;
    sprintId: string;
    lastCheckIn?: Date;
    daysSinceLastCheckIn: number;
  }>> {
    const memberships = await prisma.teamMember.findMany({
      where: { userId },
      include: {
        team: {
          include: {
            sprints: {
              where: { status: 'in_progress' },
              include: {
                checkIns: {
                  where: { userId },
                  orderBy: { createdAt: 'desc' },
                  take: 1,
                },
              },
            },
          },
        },
      },
    });

    const needed: Array<{
      teamId: string;
      teamName: string;
      sprintId: string;
      lastCheckIn?: Date;
      daysSinceLastCheckIn: number;
    }> = [];

    for (const membership of memberships) {
      const sprint = membership.team.sprints[0];
      if (!sprint) continue;

      const lastCheckIn = sprint.checkIns[0];
      const lastCheckInDate = lastCheckIn?.createdAt;
      
      const now = new Date();
      const daysSince = lastCheckInDate 
        ? Math.floor((now.getTime() - lastCheckInDate.getTime()) / (1000 * 60 * 60 * 24))
        : 999;

      // 3일 이상 체크인 안했으면 필요
      if (daysSince >= 3) {
        needed.push({
          teamId: membership.team.id,
          teamName: membership.team.name,
          sprintId: sprint.id,
          lastCheckIn: lastCheckInDate,
          daysSinceLastCheckIn: daysSince,
        });
      }
    }

    return needed;
  }
}

export const checkInService = new CheckInService();
