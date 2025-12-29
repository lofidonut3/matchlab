import prisma from '../lib/prisma.js';
import { AppError } from '../middleware/index.js';
import { notificationService } from './notification.service.js';

export class TeamService {
  /**
   * 내 팀 목록 조회
   */
  async getMyTeams(userId: string) {
    const memberships = await prisma.teamMember.findMany({
      where: { userId },
      include: {
        team: {
          include: {
            members: {
              include: {
                user: { select: { id: true, nickname: true, email: true } },
              },
            },
            sprints: {
              where: { status: 'in_progress' },
              include: {
                checklistItems: true,
                checkIns: {
                  orderBy: { createdAt: 'desc' },
                  take: 4,
                },
              },
            },
          },
        },
      },
      orderBy: { joinedAt: 'desc' },
    });

    const teams = memberships.map((m: any) => this.formatTeam(m.team, userId));
    
    // active와 finished로 분리
    const active = teams.filter((t: any) => t.status === 'active');
    const finished = teams.filter((t: any) => t.status !== 'active');
    
    return { active, finished };
  }

  /**
   * 팀 상세 조회
   */
  async getTeam(teamId: string, userId: string) {
    const team = await prisma.team.findUnique({
      where: { id: teamId },
      include: {
        members: {
          include: {
            user: {
              select: { id: true, nickname: true, email: true },
              include: { profile: true },
            } as any,
          },
        },
        sprints: {
          orderBy: { startDate: 'desc' },
          include: {
            checklistItems: { orderBy: { order: 'asc' } },
            checkIns: { orderBy: { createdAt: 'desc' } },
          },
        },
        feedbacks: true,
      },
    });

    if (!team) {
      throw new AppError('팀을 찾을 수 없습니다.', 404);
    }

    // 멤버 여부 확인
    const isMember = team.members.some((m: any) => m.userId === userId);
    if (!isMember) {
      throw new AppError('팀에 접근할 권한이 없습니다.', 403);
    }

    const teamDetail = this.formatTeamDetail(team, userId);
    const currentSprint = teamDetail.sprints?.find((s: any) => s.status === 'in_progress') || teamDetail.sprints?.[0] || null;
    
    return { team: teamDetail, sprint: currentSprint };
  }

  /**
   * 팀 정보 업데이트
   */
  async updateTeam(teamId: string, userId: string, updates: {
    name?: string;
    goal?: string;
    meetingSchedule?: string;
    rnr?: Record<string, string>;
  }) {
    const team = await prisma.team.findUnique({
      where: { id: teamId },
      include: { members: true },
    });

    if (!team) {
      throw new AppError('팀을 찾을 수 없습니다.', 404);
    }

    const isMember = team.members.some(m => m.userId === userId);
    if (!isMember) {
      throw new AppError('팀을 수정할 권한이 없습니다.', 403);
    }

    const updateData: any = {};
    if (updates.name) updateData.name = updates.name;
    if (updates.goal) updateData.goal = updates.goal;
    if (updates.meetingSchedule) updateData.meetingSchedule = updates.meetingSchedule;
    if (updates.rnr) updateData.rnr = JSON.stringify(updates.rnr);

    return prisma.team.update({
      where: { id: teamId },
      data: updateData,
    });
  }

  /**
   * 체크리스트 아이템 완료 처리
   */
  async toggleChecklistItem(itemId: string, userId: string) {
    const item = await prisma.checklistItem.findUnique({
      where: { id: itemId },
      include: {
        sprint: {
          include: {
            team: {
              include: { members: true },
            },
          },
        },
      },
    });

    if (!item) {
      throw new AppError('체크리스트 항목을 찾을 수 없습니다.', 404);
    }

    const isMember = item.sprint.team.members.some(m => m.userId === userId);
    if (!isMember) {
      throw new AppError('권한이 없습니다.', 403);
    }

    return prisma.checklistItem.update({
      where: { id: itemId },
      data: {
        completed: !item.completed,
        completedAt: !item.completed ? new Date() : null,
      },
    });
  }

  /**
   * 팀 상태 변경 (종료)
   */
  async finishTeam(teamId: string, userId: string, decision: 'continue' | 'dissolve' | 'rematch') {
    const team = await prisma.team.findUnique({
      where: { id: teamId },
      include: {
        members: true,
        sprints: { where: { status: 'in_progress' } },
      },
    });

    if (!team) {
      throw new AppError('팀을 찾을 수 없습니다.', 404);
    }

    const isMember = team.members.some(m => m.userId === userId);
    if (!isMember) {
      throw new AppError('권한이 없습니다.', 403);
    }

    let newStatus: string;
    switch (decision) {
      case 'continue':
        newStatus = 'active';
        break;
      case 'dissolve':
        newStatus = 'dissolved';
        break;
      case 'rematch':
        newStatus = 'dissolved';
        break;
      default:
        throw new AppError('올바르지 않은 결정입니다.', 400);
    }

    // 팀 상태 업데이트
    const updatedTeam = await prisma.team.update({
      where: { id: teamId },
      data: { status: newStatus },
    });

    // 진행 중인 스프린트 완료 처리
    if (team.sprints.length > 0) {
      await prisma.sprint.updateMany({
        where: { teamId, status: 'in_progress' },
        data: { status: 'completed' },
      });
    }

    // continue인 경우 새 스프린트 생성
    if (decision === 'continue') {
      await this.createNewSprint(teamId, team.goal);
    }

    return updatedTeam;
  }

  /**
   * 새 스프린트 생성
   */
  private async createNewSprint(teamId: string, goal: string) {
    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + 14);

    const defaultChecklist = [
      { title: '이전 스프린트 회고', description: '지난 2주 성과와 개선점 정리', order: 1 },
      { title: '새 목표 설정', description: '이번 스프린트 목표 구체화', order: 2 },
      { title: '역할 조정', description: '필요시 역할 재배치', order: 3 },
      { title: '1주차 미션', description: '첫 번째 마일스톤', order: 4 },
      { title: '중간 점검', description: '진행 상황 확인', order: 5 },
      { title: '2주차 미션', description: '두 번째 마일스톤', order: 6 },
      { title: '스프린트 마무리', description: '성과 정리 및 다음 계획', order: 7 },
    ];

    return prisma.sprint.create({
      data: {
        teamId,
        startDate,
        endDate,
        status: 'in_progress',
        checklistItems: {
          create: defaultChecklist,
        },
      },
    });
  }

  // Formatting helpers

  private formatTeam(team: any, userId: string) {
    const currentSprint = team.sprints?.[0];
    const completedItems = currentSprint?.checklistItems?.filter((i: any) => i.completed).length || 0;
    const totalItems = currentSprint?.checklistItems?.length || 0;

    return {
      id: team.id,
      name: team.name,
      goal: team.goal,
      status: team.status,
      members: team.members.map((m: any) => ({
        userId: m.userId,
        nickname: m.user.nickname,
        role: m.role,
      })),
      currentSprint: currentSprint ? {
        id: currentSprint.id,
        progress: totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0,
        daysLeft: this.getDaysLeft(currentSprint.endDate),
      } : null,
      createdAt: team.createdAt,
    };
  }

  private formatTeamDetail(team: any, userId: string) {
    return {
      id: team.id,
      name: team.name,
      goal: team.goal,
      rnr: JSON.parse(team.rnr || '{}'),
      meetingSchedule: team.meetingSchedule,
      status: team.status,
      members: team.members.map((m: any) => ({
        userId: m.userId,
        nickname: m.user.nickname,
        email: m.user.email,
        role: m.role,
        joinedAt: m.joinedAt,
      })),
      sprints: team.sprints.map((s: any) => ({
        id: s.id,
        startDate: s.startDate,
        endDate: s.endDate,
        status: s.status,
        checklistItems: s.checklistItems.map((i: any) => ({
          id: i.id,
          title: i.title,
          description: i.description,
          completed: i.completed,
          completedAt: i.completedAt,
          order: i.order,
        })),
        checkIns: s.checkIns.map((c: any) => ({
          id: c.id,
          userId: c.userId,
          progress: c.progress,
          satisfaction: c.satisfaction,
          blockers: c.blockers,
          createdAt: c.createdAt,
        })),
      })),
      feedbacks: team.feedbacks.map((f: any) => ({
        id: f.id,
        fromUserId: f.fromUserId,
        toUserId: f.toUserId,
        ratingPromise: f.ratingPromise,
        ratingResponse: f.ratingResponse,
        ratingContribution: f.ratingContribution,
        comment: f.comment,
        createdAt: f.createdAt,
      })),
      createdAt: team.createdAt,
    };
  }

  private getDaysLeft(endDate: Date): number {
    const now = new Date();
    const diff = endDate.getTime() - now.getTime();
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  }
}

export const teamService = new TeamService();
