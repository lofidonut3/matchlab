/**
 * MatchLab 시드 데이터
 * 
 * 데모/테스트용 더미 사용자 30명 생성
 */

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const GOALS = ['investment', 'revenue', 'tech_validation', 'side_project', 'hackathon'];
const DOMAINS = ['commerce', 'fintech', 'healthcare', 'education', 'content', 'b2b_saas', 'other'];
const ROLES = ['planning', 'development', 'design', 'marketing', 'operations', 'other'];
const LOCATION_PREFS = ['remote_only', 'onsite_only', 'hybrid', 'flexible'];
const MEETING_FREQS = ['daily', 'twice_week', 'weekly', 'biweekly'];
const CONFLICT_STYLES = ['direct', 'indirect', 'avoid', 'compromise'];
const COMM_CHANNELS = ['slack', 'discord', 'kakao', 'notion'];

const KOREAN_NICKNAMES = [
  '열정개발자', '스타트업마니아', '디자인러버', '기획왕', '마케팅천재',
  '코딩몬스터', '아이디어뱅크', '데이터마법사', '그로스해커', 'PM전문가',
  '프론트엔드장인', '백엔드달인', '풀스택마스터', 'UX디자이너', 'UI아티스트',
  '콘텐츠크리에이터', '브랜딩전문가', '세일즈킹', '오퍼레이션즈', '파이낸스프로',
  '테크리더', '프로덕트매니저', '스크럼마스터', '데브옵스', 'QA엔지니어',
  '앱개발자', '웹개발자', 'AI연구원', '블록체인개발자', '게임개발자',
];

function randomItem<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomItems<T>(arr: T[], min: number, max: number): T[] {
  const count = Math.floor(Math.random() * (max - min + 1)) + min;
  const shuffled = [...arr].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomStartDate(): Date {
  const days = randomInt(0, 30);
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date;
}

async function seed() {
  console.log('🌱 시드 데이터 생성 시작...');

  // 기존 데이터 삭제
  await prisma.notification.deleteMany();
  await prisma.block.deleteMany();
  await prisma.report.deleteMany();
  await prisma.feedback.deleteMany();
  await prisma.checkIn.deleteMany();
  await prisma.checklistItem.deleteMany();
  await prisma.sprint.deleteMany();
  await prisma.teamMember.deleteMany();
  await prisma.team.deleteMany();
  await prisma.message.deleteMany();
  await prisma.conversationParticipant.deleteMany();
  await prisma.conversation.deleteMany();
  await prisma.invite.deleteMany();
  await prisma.matchScore.deleteMany();
  await prisma.evidenceLink.deleteMany();
  await prisma.trustScore.deleteMany();
  await prisma.startupMBTI.deleteMany();
  await prisma.traitResult.deleteMany();
  await prisma.profile.deleteMany();
  await prisma.user.deleteMany();

  console.log('🗑️ 기존 데이터 삭제 완료');

  const hashedPassword = await bcrypt.hash('MatchLab2024!', 10);
  const users = [];

  for (let i = 0; i < 30; i++) {
    const nickname = KOREAN_NICKNAMES[i] || `사용자${i + 1}`;
    const email = `user${i + 1}@matchlab.test`;

    const roleCan = randomItems(ROLES, 1, 2);
    const roleWant = randomItems(ROLES, 1, 2);
    const roleNeed = randomItems(ROLES.filter(r => !roleCan.includes(r)), 1, 2);

    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        nickname,
        status: 'active',
        lastActiveAt: new Date(Date.now() - randomInt(0, 7) * 24 * 60 * 60 * 1000),
        profile: {
          create: {
            bio: `안녕하세요! ${nickname}입니다. 함께 멋진 프로젝트를 만들어 가고 싶습니다.`,
            location: randomItem(['서울', '경기', '부산', '대전', '대구', '광주']),
            locationPref: randomItem(LOCATION_PREFS),
            availabilityHours: randomInt(5, 40),
            startDate: randomStartDate(),
            domains: JSON.stringify(randomItems(DOMAINS, 1, 2)),
            roleCan: JSON.stringify(roleCan),
            roleWant: JSON.stringify(roleWant),
            roleNeed: JSON.stringify(roleNeed),
            skills: JSON.stringify(randomItems([
              'React', 'Vue', 'Angular', 'Node.js', 'Python', 'Java',
              'Figma', 'Sketch', 'Photoshop', 'SQL', 'NoSQL', 'AWS',
              '기획', '마케팅', 'SEO', 'SNS', '영업', '재무'
            ], 2, 5)),
            goal: randomItem(GOALS),
            commChannel: randomItem(COMM_CHANNELS),
            responseSla: randomItem([4, 12, 24, 48]),
            meetingFreq: randomItem(MEETING_FREQS),
            decisionConsensus: randomInt(1, 5),
            decisionData: randomInt(1, 5),
            decisionSpeed: randomInt(1, 5),
            decisionFlexibility: randomInt(1, 5),
            decisionRisk: randomInt(1, 5),
            conflictStyle: randomItem(CONFLICT_STYLES),
            completeness: randomInt(60, 100),
            isPublic: true,
          },
        },
        traitResult: {
          create: {
            leadership: randomItem([1, 2]),
            execution: randomItem([1, 2]),
            communication: randomItem([1, 2]),
            risk: randomItem([1, 2]),
            conflict: randomItem([1, 2]),
            flexibility: randomItem([1, 2]),
          },
        },
        trustScore: {
          create: {
            completeness: randomInt(60, 100),
            evidenceStrength: randomInt(0, 80),
            activity: randomInt(40, 100),
            reputation: randomInt(50, 100),
            total: randomInt(50, 90),
          },
        },
      },
    });

    users.push(user);
    console.log(`✅ 사용자 생성: ${nickname} (${email})`);
  }

  // 데모용 테스트 계정 생성
  const testUser = await prisma.user.create({
    data: {
      email: 'test@matchlab.test',
      password: hashedPassword,
      nickname: '테스트유저',
      status: 'active',
      profile: {
        create: {
          bio: '테스트 계정입니다.',
          location: '서울',
          locationPref: 'flexible',
          availabilityHours: 20,
          startDate: new Date(),
          domains: JSON.stringify(['b2b_saas', 'fintech']),
          roleCan: JSON.stringify(['planning']),
          roleWant: JSON.stringify(['planning', 'marketing']),
          roleNeed: JSON.stringify(['development', 'design']),
          skills: JSON.stringify(['기획', '마케팅', 'Notion']),
          goal: 'side_project',
          commChannel: 'slack',
          responseSla: 24,
          meetingFreq: 'twice_week',
          decisionConsensus: 4,
          decisionData: 3,
          decisionSpeed: 2,
          decisionFlexibility: 4,
          decisionRisk: 3,
          conflictStyle: 'direct',
          completeness: 85,
          isPublic: true,
        },
      },
      traitResult: {
        create: {
          leadership: 1,
          execution: 2,
          communication: 1,
          risk: 2,
          conflict: 1,
          flexibility: 1,
        },
      },
      trustScore: {
        create: {
          completeness: 85,
          evidenceStrength: 40,
          activity: 90,
          reputation: 75,
          total: 75,
        },
      },
    },
  });

  console.log(`✅ 테스트 계정 생성: test@matchlab.test (비밀번호: MatchLab2024!)`);

  // 일부 초대/팀 생성
  const invite1 = await prisma.invite.create({
    data: {
      fromUserId: users[0].id,
      toUserId: users[1].id,
      status: 'pending',
      message: '함께 프로젝트 해보실래요?',
    },
  });

  // 이미 수락된 초대 + 팀
  const team = await prisma.team.create({
    data: {
      name: `${users[2].nickname} & ${users[3].nickname} 팀`,
      goal: 'side_project',
      rnr: JSON.stringify({
        [users[2].id]: '기획',
        [users[3].id]: '개발',
      }),
      meetingSchedule: '매주 화/목 저녁 8시',
      status: 'active',
      members: {
        create: [
          { userId: users[2].id, role: '기획' },
          { userId: users[3].id, role: '개발' },
        ],
      },
    },
  });

  // 스프린트 생성
  const sprint = await prisma.sprint.create({
    data: {
      teamId: team.id,
      startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      status: 'in_progress',
      checklistItems: {
        create: [
          { title: '팀 규칙 합의', description: '소통 채널, 응답 시간 확정', order: 1, completed: true },
          { title: '목표 구체화', description: '마일스톤 분해', order: 2, completed: true },
          { title: '역할 분담', description: '책임 범위 명확화', order: 3, completed: false },
          { title: '1주차 미션', description: '첫 번째 마일스톤', order: 4, completed: false },
          { title: '중간 회고', description: '1주차 점검', order: 5, completed: false },
          { title: '2주차 미션', description: '두 번째 마일스톤', order: 6, completed: false },
          { title: '최종 회고', description: '팀 결정', order: 7, completed: false },
        ],
      },
    },
  });

  // 체크인 데이터
  await prisma.checkIn.createMany({
    data: [
      {
        sprintId: sprint.id,
        userId: users[2].id,
        progress: 30,
        satisfaction: 4,
        notes: '순조롭게 진행 중입니다!',
      },
      {
        sprintId: sprint.id,
        userId: users[3].id,
        progress: 25,
        satisfaction: 5,
        notes: '개발 환경 세팅 완료!',
      },
    ],
  });

  console.log(`✅ 샘플 팀 생성: ${team.name}`);

  // =========================================
  // StartupMBTI 데이터만 생성 (사용자 연결 없이)
  // 회원가입 시 ID 입력하면 자동 연결됨
  // =========================================
  console.log('📊 StartupMBTI 데이터 생성 중...');

  // PST2512ME63603 (ISTP)
  await prisma.startupMBTI.create({
    data: {
      externalId: 'PST2512ME63603',
      mbtiType: 'ISTP',
      mbtiTitle: '실용적인 문제해결사',
      // 창업자 기본 성향
      innovationLearning: 56,
      sensitivityNervous: 96,
      socialActivity: 23,
      cooperationCare: 69,
      planExecution: 73,
      // 완벽주의 성향
      apPerfectionism: 56,
      eopPerfectionism: 52,
      iopPerfectionism: 99,
      // 동기 요인
      motivationGrowth: 50,
      motivationAchieve: 49,
      motivationRecognition: 10,
      // 보상 요인
      rewardCompensation: 79,
      rewardAutonomy: 45,
      rewardStability: 55,
      // 파트너쉽 유형
      partnerSelfishness: 13,
      partnerCooperation: 63,
      partnerEntrepreneurship: 51,
      // 스트레스
      stressIndex: 80,
    },
  });
  console.log('   ✅ PST2512ME63603 - ISTP');

  // PST2512ZJ18601 (ISTP)
  await prisma.startupMBTI.create({
    data: {
      externalId: 'PST2512ZJ18601',
      mbtiType: 'ISTP',
      mbtiTitle: '실용적인 문제해결사',
      // 창업자 기본 성향
      innovationLearning: 65,
      sensitivityNervous: 58,
      socialActivity: 18,
      cooperationCare: 56,
      planExecution: 26,
      // 완벽주의 성향
      apPerfectionism: 63,
      eopPerfectionism: 47,
      iopPerfectionism: 33,
      // 동기 요인
      motivationGrowth: 81,
      motivationAchieve: 24,
      motivationRecognition: 63,
      // 보상 요인
      rewardCompensation: 47,
      rewardAutonomy: 23,
      rewardStability: 50,
      // 파트너쉽 유형
      partnerSelfishness: 38,
      partnerCooperation: 39,
      partnerEntrepreneurship: 32,
      // 스트레스
      stressIndex: 67,
    },
  });
  console.log('   ✅ PST2512ZJ18601 - ISTP');

  // PST2512BM43602 (INFP)
  await prisma.startupMBTI.create({
    data: {
      externalId: 'PST2512BM43602',
      mbtiType: 'INFP',
      mbtiTitle: '이상적인 혁신가',
      // 창업자 기본 성향
      innovationLearning: 72,
      sensitivityNervous: 20,
      socialActivity: 13,
      cooperationCare: 22,
      planExecution: 100,
      // 완벽주의 성향
      apPerfectionism: 86,
      eopPerfectionism: 20,
      iopPerfectionism: 85,
      // 동기 요인
      motivationGrowth: 75,
      motivationAchieve: 76,
      motivationRecognition: 78,
      // 보상 요인
      rewardCompensation: 30,
      rewardAutonomy: 72,
      rewardStability: 81,
      // 파트너쉽 유형
      partnerSelfishness: 25,
      partnerCooperation: 26,
      partnerEntrepreneurship: 80,
      // 스트레스
      stressIndex: 60,
    },
  });
  console.log('   ✅ PST2512BM43602 - INFP');

  console.log('');
  console.log('🎉 시드 데이터 생성 완료!');
  console.log('');
  console.log('📋 테스트 계정:');
  console.log('   이메일: test@matchlab.test');
  console.log('   비밀번호: MatchLab2024!');
  console.log('');
  console.log('📋 등록된 StartupMBTI ID:');
  console.log('   - PST2512ME63603 (ISTP)');
  console.log('   - PST2512ZJ18601 (ISTP)');
  console.log('   - PST2512BM43602 (INFP)');
  console.log('');
  console.log(`📊 생성된 데이터:`);
  console.log(`   - 사용자: 31명 (테스트 + 더미 30명)`);
  console.log(`   - StartupMBTI: 3개 (사용자 연결 대기)`);
  console.log(`   - 팀: 1개`);
  console.log(`   - 스프린트: 1개`);
  console.log(`   - 체크인: 2개`);
}

seed()
  .catch((e) => {
    console.error('❌ 시드 오류:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
