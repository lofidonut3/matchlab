import { Router, IRouter } from 'express';
import { z } from 'zod';
import { authService } from '../services/index.js';
import { authMiddleware, AuthRequest } from '../middleware/index.js';

const router: IRouter = Router();

// Validation schemas
const registerSchema = z.object({
  email: z.string().email('올바른 이메일을 입력해주세요'),
  password: z.string().min(8, '비밀번호는 8자 이상이어야 합니다'),
  nickname: z.string().min(2, '닉네임은 2자 이상이어야 합니다').max(20),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

/**
 * POST /api/auth/register
 * 회원가입
 */
router.post('/register', async (req, res, next) => {
  try {
    const data = registerSchema.parse(req.body);
    const result = await authService.register(data);

    res.status(201).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/auth/login
 * 로그인
 */
router.post('/login', async (req, res, next) => {
  try {
    const data = loginSchema.parse(req.body);
    const result = await authService.login(data);

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/auth/me
 * 내 정보 조회
 */
router.get('/me', authMiddleware, async (req: AuthRequest, res, next) => {
  try {
    const user = await authService.getMe(req.userId!);

    res.json({
      success: true,
      data: user,
    });
  } catch (error) {
    next(error);
  }
});

export default router;
