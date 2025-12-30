import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Send, Smile, Meh, Frown } from 'lucide-react'
import { checkinService } from '../../services'
import { Button, Card, CardContent, Textarea, Alert } from '../../components/common'

export default function CheckInPage() {
  const { teamId } = useParams<{ teamId: string }>()
  const navigate = useNavigate()
  
  const [satisfaction, setSatisfaction] = useState<number | null>(null)
  const [note, setNote] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async () => {
    if (!teamId || satisfaction === null) return

    setIsSubmitting(true)
    setError(null)

    try {
      await checkinService.submitCheckIn(teamId, {
        satisfaction,
        notes: note || undefined,
      })
      navigate(`/teams/${teamId}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : '체크인 제출에 실패했습니다.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const satisfactionOptions = [
    { value: 5, icon: Smile, label: '아주 좋아요', color: 'text-success-600 bg-success-100' },
    { value: 4, icon: Smile, label: '좋아요', color: 'text-success-500 bg-success-50' },
    { value: 3, icon: Meh, label: '보통이에요', color: 'text-warning-600 bg-warning-100' },
    { value: 2, icon: Frown, label: '아쉬워요', color: 'text-warning-500 bg-warning-50' },
    { value: 1, icon: Frown, label: '힘들어요', color: 'text-danger-600 bg-danger-100' },
  ]

  return (
    <div className="max-w-xl mx-auto px-4 py-6 sm:py-8">
      {/* Back Button */}
      <Button 
        variant="ghost" 
        onClick={() => navigate(`/teams/${teamId}`)} 
        leftIcon={<ArrowLeft className="w-4 h-4" />}
        className="mb-4 sm:mb-6"
      >
        뒤로
      </Button>

      <Card>
        <CardContent className="py-6 sm:py-8">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 text-center mb-2">
            체크인
          </h1>
          <p className="text-sm sm:text-base text-gray-600 text-center mb-6 sm:mb-8">
            현재 팀 활동은 어떻게 진행되고 있나요?
          </p>

          {error && (
            <Alert type="error" className="mb-6" onClose={() => setError(null)}>
              {error}
            </Alert>
          )}

          {/* Satisfaction */}
          <div className="mb-6 sm:mb-8">
            <label className="block text-sm font-medium text-gray-700 mb-3 sm:mb-4 text-center">
              현재 만족도를 선택해주세요
            </label>
            <div className="flex flex-wrap justify-center gap-2 sm:gap-3">
              {satisfactionOptions.map((option) => {
                const Icon = option.icon
                const isSelected = satisfaction === option.value
                return (
                  <button
                    key={option.value}
                    onClick={() => setSatisfaction(option.value)}
                    className={`flex flex-col items-center gap-1 sm:gap-2 p-2 sm:p-4 rounded-xl transition-all ${
                      isSelected 
                        ? `${option.color} ring-2 ring-offset-2 ring-gray-400` 
                        : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                    }`}
                  >
                    <Icon className="w-6 h-6 sm:w-8 sm:h-8" />
                    <span className="text-[10px] sm:text-xs font-medium">{option.label}</span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Note */}
          <div className="mb-6 sm:mb-8">
            <Textarea
              label="추가 메모 (선택)"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="진행 상황, 고민, 요청사항 등을 자유롭게 적어주세요..."
              rows={4}
            />
          </div>

          {/* Submit */}
          <Button
            onClick={handleSubmit}
            disabled={satisfaction === null}
            isLoading={isSubmitting}
            className="w-full"
            size="lg"
            leftIcon={<Send className="w-4 h-4" />}
          >
            체크인 완료
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
