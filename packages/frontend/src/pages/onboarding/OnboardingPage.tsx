import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, ArrowRight, Check, HelpCircle } from 'lucide-react'
import { 
  ROLE_OPTIONS, 
  DOMAIN_OPTIONS, 
  GOAL_OPTIONS, 
  LOCATION_OPTIONS 
} from '@matchlab/shared'
import type { Domain, Goal, LocationPref, Role } from '@matchlab/shared'
import { profileService } from '../../services'
import { useAuthStore } from '../../stores/auth.store'
import { Button, ProgressBar, Card, CardContent, Alert, Input } from '../../components/common'

const STEPS = [
  { id: 'role', title: '역할', description: '찾고 있는 팀원의 역할을 선택하세요' },
  { id: 'domain', title: '도메인', description: '관심있는 도메인을 선택하세요' },
  { id: 'commitment', title: '투입 시간', description: '투입 가능한 시간을 알려주세요' },
  { id: 'location', title: '근무 형태', description: '선호하는 근무 형태를 선택하세요' },
  { id: 'goal', title: '목표', description: '창업을 통해 이루고 싶은 목표는 무엇인가요?' },
  { id: 'mbti', title: '창업 MBTI', description: '창업 MBTI 진단 ID를 입력해주세요' },
]

interface OnboardingData {
  roleNeed: string
  domain: string
  availabilityHours: number
  startDate: string
  locationPref: string
  goal: string
  startupMbtiId: string  // 외부 ID (예: PST2512ME63603)
}

export default function OnboardingPage() {
  const [currentStep, setCurrentStep] = useState(0)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { checkAuth } = useAuthStore()
  const navigate = useNavigate()

  const [data, setData] = useState<OnboardingData>({
    roleNeed: '',
    domain: '',
    availabilityHours: 20,
    startDate: new Date().toISOString().split('T')[0],
    locationPref: 'flexible',
    goal: '',
    startupMbtiId: '',
  })

  const updateData = (updates: Partial<OnboardingData>) => {
    setData((prev) => ({ ...prev, ...updates }))
  }

  const isStepValid = (): boolean => {
    switch (STEPS[currentStep].id) {
      case 'role':
        return !!data.roleNeed
      case 'domain':
        return !!data.domain
      case 'commitment':
        return data.availabilityHours > 0 && !!data.startDate
      case 'location':
        return !!data.locationPref
      case 'goal':
        return !!data.goal
      case 'mbti':
        // PST + 4자리숫자 + 2자리영문 + 5자리숫자 형식 검증
        const mbtiPattern = /^PST\d{4}[A-Z]{2}\d{5}$/
        return mbtiPattern.test(data.startupMbtiId) || data.startupMbtiId === ''
      default:
        return true
    }
  }

  const handleNext = () => {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(currentStep + 1)
    }
  }

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleSubmit = async () => {
    setIsSubmitting(true)
    setError(null)

    try {
      await profileService.completeOnboarding({
        roleNeed: data.roleNeed as Role,
        domain: data.domain as Domain,
        availabilityHours: data.availabilityHours,
        startDate: new Date(data.startDate).toISOString(),
        locationPref: data.locationPref as LocationPref,
        goal: data.goal as Goal,
        startupMbtiId: data.startupMbtiId || undefined,
      })

      // Refresh user state to update profileCompleted
      await checkAuth()
      navigate('/recommend')
    } catch (err) {
      const message = err instanceof Error ? err.message : '온보딩 중 오류가 발생했습니다.'
      // If already onboarded, just redirect
      if (message.includes('이미 온보딩') || message.includes('already')) {
        await checkAuth()
        navigate('/recommend')
        return
      }
      setError(message)
    } finally {
      setIsSubmitting(false)
    }
  }

  const renderStep = () => {
    switch (STEPS[currentStep].id) {
      case 'role':
        return (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            {ROLE_OPTIONS.map((role) => (
              <button
                key={role.value}
                onClick={() => updateData({ roleNeed: role.value })}
                className={`p-3 sm:p-4 rounded-xl border-2 text-left transition-all ${
                  data.roleNeed === role.value
                    ? 'border-primary-500 bg-primary-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="font-medium text-gray-900">{role.label}</div>
              </button>
            ))}
          </div>
        )

      case 'domain':
        return (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            {DOMAIN_OPTIONS.map((d) => (
              <button
                key={d.value}
                onClick={() => updateData({ domain: d.value })}
                className={`p-3 sm:p-4 rounded-xl border-2 text-left transition-all ${
                  data.domain === d.value
                    ? 'border-primary-500 bg-primary-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="font-medium text-gray-900">{d.label}</div>
              </button>
            ))}
          </div>
        )

      case 'commitment':
        return (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                주당 투입 가능 시간: <strong>{data.availabilityHours}시간</strong>
              </label>
              <input
                type="range"
                min="5"
                max="60"
                step="5"
                value={data.availabilityHours}
                onChange={(e) => updateData({ availabilityHours: parseInt(e.target.value) })}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-primary-600"
              />
              <div className="flex justify-between text-sm text-gray-500 mt-1">
                <span>5시간</span>
                <span>60시간</span>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                합류 가능 시작일
              </label>
              <input
                type="date"
                value={data.startDate}
                onChange={(e) => updateData({ startDate: e.target.value })}
                min={new Date().toISOString().split('T')[0]}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
          </div>
        )

      case 'location':
        return (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                근무 형태
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {LOCATION_OPTIONS.map((loc) => (
                  <button
                    key={loc.value}
                    onClick={() => updateData({ locationPref: loc.value })}
                    className={`p-3 sm:p-4 rounded-xl border-2 text-left transition-all ${
                      data.locationPref === loc.value
                        ? 'border-primary-500 bg-primary-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="font-medium text-gray-900">{loc.label}</div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )

      case 'goal':
        return (
          <div className="grid grid-cols-1 gap-3">
            {GOAL_OPTIONS.map((goal) => (
              <button
                key={goal.value}
                onClick={() => updateData({ goal: goal.value })}
                className={`p-4 rounded-xl border-2 text-left transition-all ${
                  data.goal === goal.value
                    ? 'border-primary-500 bg-primary-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="font-medium text-gray-900">{goal.label}</div>
              </button>
            ))}
          </div>
        )

      case 'mbti':
        return (
          <div className="space-y-6">
            <div className="p-4 bg-blue-50 rounded-xl border border-blue-200">
              <div className="flex items-start gap-3">
                <HelpCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm text-blue-800 font-medium mb-1">창업 MBTI ID란?</p>
                  <p className="text-sm text-blue-700">
                    사전에 진행한 창업 MBTI 진단 결과의 ID입니다.
                  </p>
                </div>
              </div>
            </div>
            
            <div>
              <Input
                label="창업 MBTI ID (선택)"
                value={data.startupMbtiId}
                onChange={(e) => updateData({ startupMbtiId: e.target.value.toUpperCase() })}
                placeholder="PST로 시작하는 13자리 ID"
                className="font-mono"
              />
              <p className="text-xs text-gray-500 mt-2">
                ID가 없으시면 비워두고 진행하셔도 됩니다. 나중에 추가할 수 있습니다.
              </p>
            </div>
            
            {data.startupMbtiId && !/^PST\d{4}[A-Z]{2}\d{5}$/.test(data.startupMbtiId) && (
              <Alert type="warning">
                ID 형식이 올바르지 않습니다. PST로 시작하는 13자리 ID를 입력해주세요.
              </Alert>
            )}
          </div>
        )

      default:
        return null
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-6 sm:py-8 px-4">
      <div className="max-w-xl mx-auto">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <ProgressBar
            value={currentStep + 1}
            max={STEPS.length}
            size="md"
            variant="primary"
          />
          <div className="flex items-center justify-between mt-2">
            <span className="text-xs sm:text-sm text-gray-500">
              {currentStep + 1} / {STEPS.length}
            </span>
            <span className="text-xs sm:text-sm text-gray-500">
              {STEPS[currentStep].title}
            </span>
          </div>
        </div>

        {/* Step Content */}
        <Card className="mb-6">
          <CardContent className="py-6 sm:py-8">
            <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-2">
              {STEPS[currentStep].title}
            </h2>
            <p className="text-sm sm:text-base text-gray-600 mb-4 sm:mb-6">
              {STEPS[currentStep].description}
            </p>

            {error && (
              <Alert type="error" className="mb-6" onClose={() => setError(null)}>
                {error}
              </Alert>
            )}

            {renderStep()}
          </CardContent>
        </Card>

        {/* Navigation */}
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            onClick={handleBack}
            disabled={currentStep === 0}
            leftIcon={<ArrowLeft className="w-4 h-4" />}
          >
            이전
          </Button>

          {currentStep === STEPS.length - 1 ? (
            <Button
              onClick={handleSubmit}
              disabled={!isStepValid()}
              isLoading={isSubmitting}
              rightIcon={<Check className="w-4 h-4" />}
            >
              완료
            </Button>
          ) : (
            <Button
              onClick={handleNext}
              disabled={!isStepValid()}
              rightIcon={<ArrowRight className="w-4 h-4" />}
            >
              다음
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
