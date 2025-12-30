import { Router, IRouter } from 'express';
import { notificationService } from '../services/index.js';
import { authMiddleware, AuthRequest } from '../middleware/index.js';

const router: IRouter = Router();

/**
 * GET /api/notifications
 * 알림 목록 조회
 */
router.get('/', authMiddleware, async (req: AuthRequest, res, next) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const pageSize = parseInt(req.query.pageSize as string) || 20;

    const result = await notificationService.getNotifications(
      req.userId!,
      page,
      pageSize
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
 * GET /api/notifications/unread-count
 * 읽지 않은 알림 수
 */
router.get('/unread-count', authMiddleware, async (req: AuthRequest, res, next) => {
  try {
    const count = await notificationService.getUnreadCount(req.userId!);

    res.json({
      success: true,
      data: { count },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /api/notifications/:notificationId/read
 * 알림 읽음 처리
 */
router.put('/:notificationId/read', authMiddleware, async (req: AuthRequest, res, next) => {
  try {
    const notification = await notificationService.markAsRead(
      req.params.notificationId,
      req.userId!
    );

    res.json({
      success: true,
      data: notification,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /api/notifications/read-all
 * 모든 알림 읽음 처리
 */
router.put('/read-all', authMiddleware, async (req: AuthRequest, res, next) => {
  try {
    await notificationService.markAllAsRead(req.userId!);

    res.json({
      success: true,
      message: '모든 알림을 읽음 처리했습니다.',
    });
  } catch (error) {
    next(error);
  }
});

export default router;
