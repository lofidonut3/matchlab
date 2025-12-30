import { Router, IRouter } from 'express';
import { z } from 'zod';
import { inviteService } from '../services/index.js';
import { authMiddleware, AuthRequest } from '../middleware/index.js';

const router: IRouter = Router();

const sendInviteSchema = z.object({
  toUserId: z.string(),
  message: z.string().optional(),
});

/**
 * GET /api/invites
 * 받은/보낸 초대 목록
 */
router.get('/', authMiddleware, async (req: AuthRequest, res, next) => {
  try {
    const invites = await inviteService.getInvites(req.userId!);

    res.json({
      success: true,
      data: invites,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/invites
 * 초대 보내기
 */
router.post('/', authMiddleware, async (req: AuthRequest, res, next) => {
  try {
    const data = sendInviteSchema.parse(req.body);
    const invite = await inviteService.sendInvite(
      req.userId!,
      data.toUserId,
      data.message
    );

    res.status(201).json({
      success: true,
      data: invite,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /api/invites/:inviteId/accept
 * 초대 수락
 */
router.put('/:inviteId/accept', authMiddleware, async (req: AuthRequest, res, next) => {
  try {
    const result = await inviteService.acceptInvite(
      req.params.inviteId,
      req.userId!
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
 * PUT /api/invites/:inviteId/decline
 * 초대 거절
 */
router.put('/:inviteId/decline', authMiddleware, async (req: AuthRequest, res, next) => {
  try {
    const invite = await inviteService.declineInvite(
      req.params.inviteId,
      req.userId!
    );

    res.json({
      success: true,
      data: invite,
    });
  } catch (error) {
    next(error);
  }
});

export default router;
