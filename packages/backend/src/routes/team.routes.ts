import { Router, IRouter } from 'express';
import { z } from 'zod';
import { teamService, checkInService, feedbackService, riskService } from '../services/index.js';
import { authMiddleware, AuthRequest } from '../middleware/index.js';

const router: IRouter = Router();

const checkInSchema = z.object({
  sprintId: z.string(),
  progress: z.number().min(0).max(100),
  satisfaction: z.number().min(1).max(5),
  blockers: z.string().optional(),
  notes: z.string().optional(),
});

const feedbackSchema = z.object({
  toUserId: z.string(),
  teamId: z.string(),
  ratingPromise: z.number().min(1).max(5),
  ratingResponse: z.number().min(1).max(5),
  ratingContribution: z.number().min(1).max(5),
  comment: z.string().optional(),
  decision: z.enum(['continue', 'dissolve', 'rematch']),
});

/**
 * GET /api/teams
 * 내 팀 목록 조회
 */
router.get('/', authMiddleware, async (req: AuthRequest, res, next) => {
  try {
    const teams = await teamService.getMyTeams(req.userId!);

    res.json({
      success: true,
      data: teams,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/teams/:teamId
 * 팀 상세 조회
 */
router.get('/:teamId', authMiddleware, async (req: AuthRequest, res, next) => {
  try {
    const team = await teamService.getTeam(req.params.teamId, req.userId!);

    res.json({
      success: true,
      data: team,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /api/teams/:teamId
 * 팀 정보 업데이트
 */
router.put('/:teamId', authMiddleware, async (req: AuthRequest, res, next) => {
  try {
    const team = await teamService.updateTeam(
      req.params.teamId,
      req.userId!,
      req.body
    );

    res.json({
      success: true,
      data: team,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /api/teams/:teamId/checklist/:itemId
 * 체크리스트 아이템 토글
 */
router.put('/:teamId/checklist/:itemId', authMiddleware, async (req: AuthRequest, res, next) => {
  try {
    const item = await teamService.toggleChecklistItem(
      req.params.itemId,
      req.userId!
    );

    res.json({
      success: true,
      data: item,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/teams/:teamId/finish
 * 팀 종료 처리
 */
router.post('/:teamId/finish', authMiddleware, async (req: AuthRequest, res, next) => {
  try {
    const { decision } = req.body;
    const team = await teamService.finishTeam(
      req.params.teamId,
      req.userId!,
      decision
    );

    res.json({
      success: true,
      data: team,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/checkins
 * 체크인 제출
 */
router.post('/checkins', authMiddleware, async (req: AuthRequest, res, next) => {
  try {
    const data = checkInSchema.parse(req.body);
    const result = await checkInService.submitCheckIn(req.userId!, data);

    res.status(201).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/checkins/needed
 * 체크인 필요 팀 목록
 */
router.get('/checkins/needed', authMiddleware, async (req: AuthRequest, res, next) => {
  try {
    const needed = await checkInService.checkInNeeded(req.userId!);

    res.json({
      success: true,
      data: needed,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/teams/:teamId/checkins
 * 팀 체크인 목록
 */
router.get('/:teamId/checkins', authMiddleware, async (req: AuthRequest, res, next) => {
  try {
    // 팀에서 현재 스프린트 ID 조회
    const teamData = await teamService.getTeam(req.params.teamId, req.userId!);
    const currentSprint = teamData.team.sprints?.find((s: any) => s.status === 'in_progress');

    if (!currentSprint) {
      return res.json({
        success: true,
        data: [],
      });
    }

    const checkIns = await checkInService.getCheckIns(
      currentSprint.id,
      req.userId!
    );

    res.json({
      success: true,
      data: checkIns,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/teams/:teamId/health
 * 팀 건강도 조회
 */
router.get('/:teamId/health', authMiddleware, async (req: AuthRequest, res, next) => {
  try {
    const health = await riskService.calculateTeamHealth(req.params.teamId);
    const suggestions = await riskService.generateAdjustmentSuggestions(req.params.teamId);

    res.json({
      success: true,
      data: { ...health, suggestions },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/feedbacks
 * 피드백 제출
 */
router.post('/feedbacks', authMiddleware, async (req: AuthRequest, res, next) => {
  try {
    const data = feedbackSchema.parse(req.body);
    const feedback = await feedbackService.submitFeedback(req.userId!, data);

    res.status(201).json({
      success: true,
      data: feedback,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/teams/:teamId/feedback-status
 * 팀 피드백 현황
 */
router.get('/:teamId/feedback-status', authMiddleware, async (req: AuthRequest, res, next) => {
  try {
    const status = await feedbackService.getTeamFeedbackStatus(
      req.params.teamId,
      req.userId!
    );

    res.json({
      success: true,
      data: status,
    });
  } catch (error) {
    next(error);
  }
});

export default router;
