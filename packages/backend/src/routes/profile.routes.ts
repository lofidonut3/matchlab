import { Router, IRouter } from 'express';
import { z } from 'zod';
import { profileService } from '../services/index.js';
import { authMiddleware, optionalAuthMiddleware, AuthRequest } from '../middleware/index.js';

const router: IRouter = Router();

// Validation schemas
const onboardingSchema = z.object({
  availabilityHours: z.number().min(1).max(80),
  startDate: z.string(),
  roleNeed: z.string(),
  domain: z.string(),
  goal: z.string(),
  locationPref: z.string(),
  traitAnswers: z.object({
    leadership: z.union([z.literal(1), z.literal(2)]),
    execution: z.union([z.literal(1), z.literal(2)]),
    communication: z.union([z.literal(1), z.literal(2)]),
    risk: z.union([z.literal(1), z.literal(2)]),
    conflict: z.union([z.literal(1), z.literal(2)]),
    flexibility: z.union([z.literal(1), z.literal(2)]),
  }).optional(),
  startupMbtiId: z.string().optional(),
});

const profileUpdateSchema = z.object({
  bio: z.string().optional(),
  location: z.string().optional(),
  locationPref: z.string().optional(),
  availabilityHours: z.number().optional(),
  startDate: z.string().optional(),
  domains: z.array(z.string()).optional(),
  roleCan: z.array(z.string()).optional(),
  roleWant: z.array(z.string()).optional(),
  roleNeed: z.array(z.string()).optional(),
  skills: z.array(z.string()).optional(),
  commChannel: z.string().optional(),
  responseSla: z.number().optional(),
  meetingFreq: z.string().optional(),
  goal: z.string().optional(),
  decisionConsensus: z.number().min(1).max(5).optional(),
  decisionData: z.number().min(1).max(5).optional(),
  decisionSpeed: z.number().min(1).max(5).optional(),
  decisionFlexibility: z.number().min(1).max(5).optional(),
  decisionRisk: z.number().min(1).max(5).optional(),
  conflictStyle: z.string().optional(),
});

/**
 * POST /api/onboarding
 * 온보딩 완료
 */
router.post('/onboarding', authMiddleware, async (req: AuthRequest, res, next) => {
  try {
    const data = onboardingSchema.parse(req.body);
    const result = await profileService.completeOnboarding(req.userId!, data);

    res.status(201).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/profile
 * 내 프로필 조회
 */
router.get('/profile', authMiddleware, async (req: AuthRequest, res, next) => {
  try {
    const profile = await profileService.getMyProfile(req.userId!);

    res.json({
      success: true,
      data: profile,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /api/profile
 * 프로필 업데이트
 */
router.put('/profile', authMiddleware, async (req: AuthRequest, res, next) => {
  try {
    const data = profileUpdateSchema.parse(req.body);
    const result = await profileService.updateProfile(req.userId!, data);

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/profile/:userId
 * 다른 사용자 프로필 조회
 */
router.get('/profile/:userId', optionalAuthMiddleware, async (req: AuthRequest, res, next) => {
  try {
    const profile = await profileService.getProfile(req.params.userId, req.userId);

    res.json({
      success: true,
      data: profile,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/profile/evidence
 * 증거 링크 추가
 */
router.post('/profile/evidence', authMiddleware, async (req: AuthRequest, res, next) => {
  try {
    const { type, url, title, isPublic } = req.body;
    const link = await profileService.addEvidenceLink(req.userId!, {
      type,
      url,
      title,
      isPublic,
    });

    res.status(201).json({
      success: true,
      data: link,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /api/profile/evidence/:linkId/verify
 * 증거 링크 검증
 */
router.put('/profile/evidence/:linkId/verify', authMiddleware, async (req: AuthRequest, res, next) => {
  try {
    const link = await profileService.verifyEvidenceLink(req.userId!, req.params.linkId);

    res.json({
      success: true,
      data: link,
    });
  } catch (error) {
    next(error);
  }
});

export default router;
