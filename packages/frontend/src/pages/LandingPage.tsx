import { Link } from 'react-router-dom'
import { 
  Users, 
  Target, 
  Shield, 
  Sparkles, 
  ArrowRight,
  CheckCircle 
} from 'lucide-react'
import Button from '../components/common/Button'

export default function LandingPage() {
  const features = [
    {
      icon: <Target className="w-6 h-6" />,
      title: '정밀한 매칭',
      description: '창업 MBTI와 경력, 목표를 분석해 최적의 팀원을 찾아드립니다.',
    },
    {
      icon: <Shield className="w-6 h-6" />,
      title: '신뢰 검증',
      description: 'LinkedIn, GitHub 등 증빙 링크와 팀원 후기로 신뢰도를 확인합니다.',
    },
    {
      icon: <Sparkles className="w-6 h-6" />,
      title: '케미 테스트',
      description: '2주간 미니 프로젝트로 실제 협업 호환성을 검증합니다.',
    },
  ]

  const steps = [
    '프로필 작성 및 창업 MBTI 진단',
    'AI가 추천하는 Top 10 팀원 확인',
    '초대/수락 후 2주 케미 테스트 시작',
    '체크리스트 완수 및 상호 피드백',
    '성공적인 팀 빌딩!',
  ]

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
                <Users className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-gray-900">MatchLab</span>
            </div>
            <div className="flex items-center gap-3">
              <Link to="/login">
                <Button variant="ghost">로그인</Button>
              </Link>
              <Link to="/register">
                <Button>시작하기</Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-12 sm:py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 mb-4 sm:mb-6">
            창업의 시작,
            <br />
            <span className="text-primary-600">최적의 팀원</span>을 찾아보세요
          </h1>
          <p className="text-base sm:text-lg md:text-xl text-gray-600 mb-6 sm:mb-8 max-w-2xl mx-auto">
            MatchLab은 창업 MBTI 기반 매칭과 2주간의 케미 테스트로
            진짜 함께할 팀원을 찾아드립니다.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link to="/register">
              <Button size="lg" rightIcon={<ArrowRight className="w-5 h-5" />}>
                무료로 시작하기
              </Button>
            </Link>
            <p className="text-sm text-gray-500">
              이미 계정이 있으신가요?{' '}
              <Link to="/login" className="text-primary-600 hover:underline">
                로그인
              </Link>
            </p>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-12 sm:py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8 sm:mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3 sm:mb-4">
              왜 MatchLab인가요?
            </h2>
            <p className="text-sm sm:text-base text-gray-600">
              단순한 매칭을 넘어, 진정한 팀 케미를 발견합니다.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
            {features.map((feature, index) => (
              <div
                key={index}
                className="bg-white rounded-2xl p-6 sm:p-8 shadow-sm border border-gray-100"
              >
                <div className="w-10 sm:w-12 h-10 sm:h-12 bg-primary-100 rounded-xl flex items-center justify-center text-primary-600 mb-3 sm:mb-4">
                  {feature.icon}
                </div>
                <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">
                  {feature.title}
                </h3>
                <p className="text-sm sm:text-base text-gray-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it Works */}
      <section className="py-12 sm:py-16">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8 sm:mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4">
              어떻게 진행되나요?
            </h2>
          </div>
          <div className="space-y-4 sm:space-y-6">
            {steps.map((step, index) => (
              <div
                key={index}
                className="flex items-center gap-3 sm:gap-4 bg-white rounded-xl p-3 sm:p-4 border border-gray-100"
              >
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-primary-600 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0 text-sm sm:text-base">
                  {index + 1}
                </div>
                <p className="text-sm sm:text-base text-gray-700 font-medium">{step}</p>
                <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-success-500 ml-auto flex-shrink-0" />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-12 sm:py-16 bg-primary-600">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-2xl sm:text-3xl font-bold text-white mb-3 sm:mb-4">
            지금 바로 시작하세요
          </h2>
          <p className="text-sm sm:text-base text-primary-100 mb-6 sm:mb-8">
            5분 안에 프로필을 완성하고, 최적의 팀원을 만나보세요.
          </p>
          <Link to="/register">
            <Button 
              size="lg" 
              variant="secondary"
              rightIcon={<ArrowRight className="w-5 h-5" />}
            >
              무료로 시작하기
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
              <Users className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-white">MatchLab</span>
          </div>
          <p className="text-gray-400 text-sm">
            © 2024 MatchLab. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  )
}
