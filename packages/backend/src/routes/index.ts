import { Router, IRouter } from 'express';
import authRoutes from './auth.routes.js';
import profileRoutes from './profile.routes.js';
import matchingRoutes from './matching.routes.js';
import inviteRoutes from './invite.routes.js';
import teamRoutes from './team.routes.js';
import notificationRoutes from './notification.routes.js';

const router: IRouter = Router();

// Health check
router.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Mount routes
router.use('/auth', authRoutes);
router.use('/', profileRoutes);  // /api/onboarding, /api/profile
router.use('/matches', matchingRoutes);
router.use('/explore', matchingRoutes);  // 탐색도 같은 라우터
router.use('/invites', inviteRoutes);
router.use('/teams', teamRoutes);
router.use('/checkins', teamRoutes);  // 체크인도 팀 라우터
router.use('/feedbacks', teamRoutes);  // 피드백도 팀 라우터
router.use('/notifications', notificationRoutes);

export default router;
