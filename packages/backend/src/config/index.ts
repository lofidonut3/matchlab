import dotenv from 'dotenv';
dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || '3001', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  jwtSecret: process.env.JWT_SECRET || 'matchlab-secret-key',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173',
  
  // 매칭 관련 설정
  matching: {
    top10Limit: 10,
    timeTolerancePercent: 0.5, // ±50%
    cacheExpirationHours: 24,
  },
  
  // 스프린트 설정
  sprint: {
    durationDays: 14,
    checkInFrequency: 2, // 주 2회
  },
  
  // 리스크 감지 설정
  risk: {
    missedCheckInThreshold: 2,     // 연속 미응답 횟수
    satisfactionDropThreshold: 2,  // 만족도 하락폭
    inactivityDays: 7,             // 미접속 일수
  },
};
