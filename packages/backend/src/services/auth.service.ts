import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../lib/prisma.js';
import { config } from '../config/index.js';
import { AppError } from '../middleware/index.js';

export interface RegisterInput {
  email: string;
  password: string;
  nickname: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

export class AuthService {
  async register(input: RegisterInput) {
    const { email, password, nickname } = input;

    // 이메일 중복 체크
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw new AppError('이미 사용 중인 이메일입니다.', 409);
    }

    // 비밀번호 해시
    const hashedPassword = await bcrypt.hash(password, 10);

    // 사용자 생성
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        nickname,
        // 기본 신뢰도 점수 생성
        trustScore: {
          create: {
            completeness: 0,
            evidenceStrength: 0,
            activity: 0,
            reputation: 50, // 기본값
            total: 10,
          },
        },
      },
      select: {
        id: true,
        email: true,
        nickname: true,
        createdAt: true,
      },
    });

    // JWT 토큰 생성
    const token = this.generateToken(user.id, user.email);

    return {
      token,
      user: {
        ...user,
        profileCompleted: false,
        createdAt: user.createdAt.toISOString(),
      },
    };
  }

  async login(input: LoginInput) {
    const { email, password } = input;

    // 사용자 조회
    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        profile: true,
      },
    });

    if (!user) {
      throw new AppError('이메일 또는 비밀번호가 올바르지 않습니다.', 401);
    }

    // 비밀번호 검증
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      throw new AppError('이메일 또는 비밀번호가 올바르지 않습니다.', 401);
    }

    // 마지막 활동 시간 업데이트
    await prisma.user.update({
      where: { id: user.id },
      data: { lastActiveAt: new Date() },
    });

    // JWT 토큰 생성
    const token = this.generateToken(user.id, user.email);

    return {
      token,
      user: {
        id: user.id,
        email: user.email,
        nickname: user.nickname,
        profileCompleted: !!user.profile,
        createdAt: user.createdAt.toISOString(),
      },
    };
  }

  async getMe(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        profile: true,
        traitResult: true,
      },
    });

    if (!user) {
      throw new AppError('사용자를 찾을 수 없습니다.', 404);
    }

    return {
      id: user.id,
      email: user.email,
      nickname: user.nickname,
      profileCompleted: !!user.profile,
      hasTraitResult: !!user.traitResult,
      createdAt: user.createdAt.toISOString(),
    };
  }

  private generateToken(userId: string, email: string): string {
    return jwt.sign(
      { userId, email },
      config.jwtSecret,
      { expiresIn: config.jwtExpiresIn }
    );
  }
}

export const authService = new AuthService();
