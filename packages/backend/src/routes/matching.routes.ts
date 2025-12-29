import { Router } from 'express';
import { matchingService } from '../services/index.js';
import { authMiddleware, AuthRequest } from '../middleware/index.js';

const router = Router();

/**
 * GET /api/matches/recommendations
 * Top10 추천 후보 조회
 */
router.get('/recommendations', authMiddleware, async (req: AuthRequest, res, next) => {
  try {
    const limit = parseInt(req.query.limit as string) || 10;
    const result = await matchingService.getRecommendations(req.userId!, limit);
    
    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/matches/:candidateId
 * 특정 후보와의 매칭 상세 조회
 */
router.get('/:candidateId', authMiddleware, async (req: AuthRequest, res, next) => {
  try {
    const result = await matchingService.getMatchDetail(
      req.userId!,
      req.params.candidateId
    );
    
    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/explore
 * 탐색 (필터링된 후보 검색)
 */
router.get('/', authMiddleware, async (req: AuthRequest, res, next) => {
  try {
    console.log('[EXPLORE] Request from userId:', req.userId);
    
    // 쿼리 파라미터를 배열로 변환하는 헬퍼 함수
    const toArray = (val: any): string[] | undefined => {
      if (!val) return undefined;
      if (Array.isArray(val)) return val as string[];
      if (typeof val === 'string') return val.split(',');
      return undefined;
    };
    
    const filters = {
      domains: toArray(req.query.domains),
      roles: toArray(req.query.roles),
      goals: toArray(req.query.goals),
      locationPref: toArray(req.query.locationPref),
      minHours: req.query.minHours ? parseInt(req.query.minHours as string) : undefined,
      maxHours: req.query.maxHours ? parseInt(req.query.maxHours as string) : undefined,
    };
    console.log('[EXPLORE] Filters:', filters);
    
    const page = parseInt(req.query.page as string) || 1;
    const pageSize = parseInt(req.query.pageSize as string) || 20;
    
    const result = await matchingService.explore(req.userId!, filters, page, pageSize);
    console.log('[EXPLORE] Success, items count:', result.items?.length);
    
    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('[EXPLORE] Error:', error);
    next(error);
  }
});

export default router;
