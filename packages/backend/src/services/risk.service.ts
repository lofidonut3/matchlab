/**
 * MatchLab 리스크 감지 서비스
 * 
 * 체크인 데이터 기반 팀 건강 상태 모니터링:
 * - 체크인 미응답 감지
 * - 만족도 급락 감지
 * - 메시지 미응답 기간 초과 감지
 * - 비활성 사용자 감지
 */

import prisma from '../lib/prisma.js';
import { config } from '../config/index.js';
import { notificationService } from './notification.service.js';

export interface RiskWarning {
  type: 'checkin_missed' | 'satisfaction_drop' | 'message_timeout' | 'inactivity';
  severity: 'low' | 'medium' | 'high';
  message: string;
  suggestion: string;
  userId?: string;
  teamId?: string;
}

export class RiskService {
  /**
   * 팀에 대한 리스크 감지
   */
  async detectRisks(teamId: string): Promise<RiskWarning[]> {
    const warnings: RiskWarning[] = [];

    const team = await prisma.team.findUnique({
      where: { id: teamId },
      include: {
        members: {
          include: {
            user: { select: { id: true, nickname: true, lastActiveAt: true } },
          },
        },
        sprints: {
          where: { status: 'in_progress' },
          include: {
            checkIns: {
              orderBy: { createdAt: 'desc' },
            },
          },
        },
      },
    });

    if (!team) return warnings;

    const currentSprint = team.sprints[0];
    if (!currentSprint) return warnings;

    // 각 멤버별 리스크 체크
    for (const member of team.members) {
      const memberCheckIns = currentSprint.checkIns.filter(
        c => c.userId === member.userId
      );

      // 1. 체크인 미응답 감지
      const checkInWarning = this.detectMissedCheckIn(
        member.user.id,
        member.user.nickname,
        memberCheckIns,
        teamId
      );
      if (checkInWarning) warnings.push(checkInWarning);

      // 2. 만족도 급락 감지
      const satisfactionWarning = this.detectSatisfactionDrop(
        member.user.id,
        member.user.nickname,
        memberCheckIns,
        teamId
      );
      if (satisfactionWarning) warnings.push(satisfactionWarning);

      // 3. 비활성 감지
      const inactivityWarning = this.detectInactivity(
        member.user.id,
        member.user.nickname,
        member.user.lastActiveAt,
        teamId
      );
      if (inactivityWarning) warnings.push(inactivityWarning);
    }

    // 리스크 경고 알림 생성
    await this.notifyRisks(team, warnings);

    return warnings;
  }

  /**
   * 체크인 미응답 감지
   */
  private detectMissedCheckIn(
    userId: string,
    nickname: string,
    checkIns: any[],
    teamId: string
  ): RiskWarning | null {
    if (checkIns.length === 0) {
      return {
        type: 'checkin_missed',
        severity: 'medium',
        message: `${nickname}님이 아직 체크인을 하지 않았어요`,
        suggestion: '첫 체크인을 해달라고 요청해 보세요',
        userId,
        teamId,
      };
    }

    const lastCheckIn = checkIns[0];
    const daysSinceLastCheckIn = Math.floor(
      (Date.now() - new Date(lastCheckIn.createdAt).getTime()) / (1000 * 60 * 60 * 24)
    );

    // 주 2회 = 3.5일에 1번, 4일 이상이면 경고
    if (daysSinceLastCheckIn >= 4) {
      const severity = daysSinceLastCheckIn >= 7 ? 'high' : 'medium';
      return {
        type: 'checkin_missed',
        severity,
        message: `${nickname}님이 ${daysSinceLastCheckIn}일째 체크인을 하지 않고 있어요`,
        suggestion: severity === 'high' 
          ? '직접 연락해서 상황을 확인해 보세요'
          : '체크인 리마인더를 보내보세요',
        userId,
        teamId,
      };
    }

    return null;
  }

  /**
   * 만족도 급락 감지
   */
  private detectSatisfactionDrop(
    userId: string,
    nickname: string,
    checkIns: any[],
    teamId: string
  ): RiskWarning | null {
    if (checkIns.length < 2) return null;

    const latestSatisfaction = checkIns[0].satisfaction;
    const previousSatisfaction = checkIns[1].satisfaction;
    const drop = previousSatisfaction - latestSatisfaction;

    // 만족도가 3 이하이거나, 2점 이상 하락하면 경고
    if (latestSatisfaction <= 2) {
      return {
        type: 'satisfaction_drop',
        severity: 'high',
        message: `${nickname}님의 만족도가 매우 낮아요 (${latestSatisfaction}점)`,
        suggestion: '1:1 대화로 어려움을 파악하고, 역할이나 규칙 조정을 논의해 보세요',
        userId,
        teamId,
      };
    }

    if (latestSatisfaction <= 3) {
      return {
        type: 'satisfaction_drop',
        severity: 'medium',
        message: `${nickname}님의 만족도가 보통 이하예요 (${latestSatisfaction}점)`,
        suggestion: '팀 미팅에서 개선점을 함께 논의해 보세요',
        userId,
        teamId,
      };
    }

    if (drop >= config.risk.satisfactionDropThreshold) {
      return {
        type: 'satisfaction_drop',
        severity: 'medium',
        message: `${nickname}님의 만족도가 ${drop}점 하락했어요`,
        suggestion: '최근 어떤 이슈가 있었는지 대화해 보세요',
        userId,
        teamId,
      };
    }

    return null;
  }

  /**
   * 비활성 사용자 감지
   */
  private detectInactivity(
    userId: string,
    nickname: string,
    lastActiveAt: Date,
    teamId: string
  ): RiskWarning | null {
    const daysSinceActive = Math.floor(
      (Date.now() - new Date(lastActiveAt).getTime()) / (1000 * 60 * 60 * 24)
    );

    if (daysSinceActive >= config.risk.inactivityDays) {
      const severity = daysSinceActive >= 14 ? 'high' : 'medium';
      return {
        type: 'inactivity',
        severity,
        message: `${nickname}님이 ${daysSinceActive}일째 접속하지 않고 있어요`,
        suggestion: severity === 'high'
          ? '다른 연락 수단으로 연락해 보세요'
          : '서비스 내 메시지를 보내보세요',
        userId,
        teamId,
      };
    }

    return null;
  }

  /**
   * 리스크 경고 알림 생성
   */
  private async notifyRisks(team: any, warnings: RiskWarning[]): Promise<void> {
    const highSeverityWarnings = warnings.filter(w => w.severity === 'high');
    
    if (highSeverityWarnings.length === 0) return;

    // 심각한 경고가 있으면 팀 전체에 알림
    for (const member of team.members) {
      // 자신에 대한 경고는 제외
      const relevantWarnings = highSeverityWarnings.filter(w => w.userId !== member.userId);
      
      if (relevantWarnings.length > 0) {
        await notificationService.create({
          userId: member.userId,
          type: 'risk_warning',
          title: '팀 상태 주의 필요',
          message: `${relevantWarnings.length}개의 주의가 필요한 상황이 있어요`,
          link: `/teams/${team.id}`,
        });
      }
    }
  }

  /**
   * 팀 건강도 점수 계산
   */
  async calculateTeamHealth(teamId: string): Promise<{
    score: number;
    factors: {
      checkInRate: number;
      avgSatisfaction: number;
      activityRate: number;
    };
    status: 'healthy' | 'warning' | 'critical';
  }> {
    const team = await prisma.team.findUnique({
      where: { id: teamId },
      include: {
        members: {
          include: {
            user: { select: { lastActiveAt: true } },
          },
        },
        sprints: {
          where: { status: 'in_progress' },
          include: {
            checkIns: {
              orderBy: { createdAt: 'desc' },
            },
          },
        },
      },
    });

    if (!team) {
      return { score: 0, factors: { checkInRate: 0, avgSatisfaction: 0, activityRate: 0 }, status: 'critical' };
    }

    const currentSprint = team.sprints[0];
    const memberCount = team.members.length;

    // 체크인 비율 계산 (최근 7일)
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    
    const recentCheckIns = currentSprint?.checkIns.filter(
      c => new Date(c.createdAt) >= weekAgo
    ) || [];
    
    // 예상 체크인 수: 멤버 수 * 2 (주 2회)
    const expectedCheckIns = memberCount * 2;
    const checkInRate = Math.min(100, Math.round((recentCheckIns.length / expectedCheckIns) * 100));

    // 평균 만족도
    const avgSatisfaction = recentCheckIns.length > 0
      ? recentCheckIns.reduce((sum, c) => sum + c.satisfaction, 0) / recentCheckIns.length
      : 3;

    // 활동률 (최근 3일 내 접속한 멤버 비율)
    const threeDaysAgo = new Date();
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
    
    const activeMembers = team.members.filter(
      m => new Date(m.user.lastActiveAt) >= threeDaysAgo
    ).length;
    const activityRate = Math.round((activeMembers / memberCount) * 100);

    // 종합 점수 계산
    const score = Math.round(
      checkInRate * 0.3 +
      (avgSatisfaction / 5) * 100 * 0.4 +
      activityRate * 0.3
    );

    // 상태 결정
    let status: 'healthy' | 'warning' | 'critical';
    if (score >= 70) {
      status = 'healthy';
    } else if (score >= 40) {
      status = 'warning';
    } else {
      status = 'critical';
    }

    return {
      score,
      factors: {
        checkInRate,
        avgSatisfaction: Math.round(avgSatisfaction * 10) / 10,
        activityRate,
      },
      status,
    };
  }

  /**
   * 조정 제안 생성
   */
  async generateAdjustmentSuggestions(teamId: string): Promise<string[]> {
    const warnings = await this.detectRisks(teamId);
    const suggestions: string[] = [];

    // 체크인 미응답
    const missedCheckIns = warnings.filter(w => w.type === 'checkin_missed');
    if (missedCheckIns.length > 0) {
      suggestions.push('체크인 알림 시간을 조정하거나 미팅에서 직접 체크인해 보세요');
    }

    // 만족도 하락
    const satisfactionDrops = warnings.filter(w => w.type === 'satisfaction_drop');
    if (satisfactionDrops.length > 0) {
      suggestions.push('역할 분담이나 소통 방식을 재점검해 보세요');
    }

    // 비활성
    const inactivityWarnings = warnings.filter(w => w.type === 'inactivity');
    if (inactivityWarnings.length > 0) {
      suggestions.push('미팅 일정을 재조정하거나 비동기 소통을 강화해 보세요');
    }

    // 전반적인 제안
    if (warnings.filter(w => w.severity === 'high').length >= 2) {
      suggestions.push('리매칭을 고려해 볼 수도 있어요');
    }

    return suggestions;
  }
}

export const riskService = new RiskService();
