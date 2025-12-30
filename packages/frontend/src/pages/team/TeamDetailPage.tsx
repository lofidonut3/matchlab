import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { 
  ArrowLeft, 
  Calendar, 
  CheckCircle, 
  Circle, 
  Users, 
  Clock,
  Flag,
  MessageSquare
} from 'lucide-react'
import { useTeamStore } from '../../stores/team.store'
import { useAuthStore } from '../../stores/auth.store'
import { checkinService, feedbackService } from '../../services'
import { 
  Button, 
  Card, 
  CardContent, 
  CardHeader, 
  Badge, 
  Avatar, 
  LoadingSpinner, 
  Alert,
  ProgressBar,
  Modal,
  Textarea,
  Select
} from '../../components/common'

export default function TeamDetailPage() {
  const { teamId } = useParams<{ teamId: string }>()
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const { currentTeam, currentSprint, isLoading, fetchTeam, toggleChecklistItem, finishTeam } = useTeamStore()
  
  const [checkInNeeded, setCheckInNeeded] = useState(false)
  const [showFinishModal, setShowFinishModal] = useState(false)
  const [showFeedbackModal, setShowFeedbackModal] = useState(false)
  const [feedbackTarget, setFeedbackTarget] = useState<string | null>(null)
  const [feedbackData, setFeedbackData] = useState({ rating: 5, comment: '' })
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (teamId) {
      fetchTeam(teamId)
      checkCheckInStatus()
    }
  }, [teamId, fetchTeam])

  const checkCheckInStatus = async () => {
    if (!teamId) return
    try {
      const { needed } = await checkinService.checkInNeeded(teamId)
      setCheckInNeeded(needed)
    } catch (err) {
      // Ignore
    }
  }

  const handleToggleItem = async (itemId: string) => {
    if (!teamId) return
    await toggleChecklistItem(teamId, itemId)
  }

  const handleFinishTeam = async () => {
    if (!teamId) return
    setIsSubmitting(true)
    try {
      await finishTeam(teamId)
      setShowFinishModal(false)
      navigate('/teams')
    } catch (err) {
      // Error handled in store
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleSubmitFeedback = async () => {
    if (!teamId || !feedbackTarget) return
    setIsSubmitting(true)
    try {
      await feedbackService.submitFeedback(teamId, {
        targetUserId: feedbackTarget,
        rating: feedbackData.rating,
        comment: feedbackData.comment || undefined,
      })
      setShowFeedbackModal(false)
      setFeedbackTarget(null)
      setFeedbackData({ rating: 5, comment: '' })
    } catch (err) {
      // Error handling
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading || !currentTeam) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <Button variant="ghost" onClick={() => navigate('/teams')} leftIcon={<ArrowLeft className="w-4 h-4" />}>
          뒤로
        </Button>
        <div className="flex justify-center py-20">
          <LoadingSpinner size="lg" />
        </div>
      </div>
    )
  }

  const members = (currentTeam as any).members || []
  const isActive = currentTeam.status === 'active'
  const completedItems = currentSprint?.checklistItems?.filter(item => item.completed).length || 0
  const totalItems = currentSprint?.checklistItems?.length || 0
  const progressPercent = totalItems > 0 ? (completedItems / totalItems) * 100 : 0

  const otherMembers = members.filter((m: any) => m.userId !== user?.id)

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 sm:py-8">
      {/* Back Button */}
      <Button 
        variant="ghost" 
        onClick={() => navigate('/teams')} 
        leftIcon={<ArrowLeft className="w-4 h-4" />}
        className="mb-4 sm:mb-6"
      >
        뒤로
      </Button>

      {/* Team Header */}
      <Card className="mb-6">
        <CardContent className="py-4 sm:py-6">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div>
              <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-2">
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900">{currentTeam.name}</h1>
                <Badge variant={isActive ? 'success' : 'default'}>
                  {isActive ? '진행중' : '종료'}
                </Badge>
              </div>
              <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-xs sm:text-sm text-gray-600">
                <span className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  {new Date(currentTeam.createdAt).toLocaleDateString('ko-KR')} 시작
                </span>
                <span className="flex items-center gap-1">
                  <Users className="w-4 h-4" />
                  {members.length}명
                </span>
              </div>
            </div>
            
            {isActive && (
              <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                {checkInNeeded && (
                  <Link to={`/teams/${teamId}/checkin`}>
                    <Button variant="secondary" leftIcon={<MessageSquare className="w-4 h-4" />} className="w-full sm:w-auto">
                      체크인하기
                    </Button>
                  </Link>
                )}
                <Button 
                  variant="secondary"
                  onClick={() => setShowFinishModal(true)}
                  leftIcon={<Flag className="w-4 h-4" />}
                  className="w-full sm:w-auto"
                >
                  팀 종료
                </Button>
              </div>
            )}
          </div>

          {/* Check-in Alert */}
          {isActive && checkInNeeded && (
            <Alert type="warning" className="mt-4">
              <div className="flex items-center justify-between">
                <span>체크인 시간입니다! 현재 진행 상황을 공유해주세요.</span>
                <Link to={`/teams/${teamId}/checkin`}>
                  <Button size="sm">체크인하기</Button>
                </Link>
              </div>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Team Members */}
      <Card className="mb-6">
        <CardHeader>
          <h2 className="text-lg font-semibold">팀원</h2>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-4">
            {members.map((member: any) => (
              <div 
                key={member.userId}
                className="flex items-center gap-3 p-3 rounded-lg bg-gray-50"
              >
                <Avatar name={member.user?.name || '사용자'} size="md" />
                <div className="flex-1">
                  <div className="font-medium text-gray-900">
                    {member.user?.name}
                    {member.userId === user?.id && (
                      <span className="text-sm text-gray-500 ml-1">(나)</span>
                    )}
                  </div>
                  <div className="text-sm text-gray-500">{member.role}</div>
                </div>
                {member.userId !== user?.id && isActive && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setFeedbackTarget(member.userId)
                      setShowFeedbackModal(true)
                    }}
                  >
                    피드백
                  </Button>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Sprint Progress */}
      {currentSprint && (
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">2주 스프린트</h2>
              <Badge variant="primary">
                {completedItems}/{totalItems} 완료
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <ProgressBar 
              value={progressPercent} 
              variant={progressPercent >= 80 ? 'success' : progressPercent >= 50 ? 'warning' : 'primary'}
              size="lg"
              className="mb-6"
            />

            <div className="space-y-3">
              {currentSprint.checklistItems?.map((item) => (
                <div
                  key={item.id}
                  className={`flex items-center gap-3 p-3 rounded-lg border transition-colors cursor-pointer ${
                    item.completed 
                      ? 'bg-success-50 border-success-200' 
                      : 'bg-white border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => isActive && handleToggleItem(item.id)}
                >
                  {item.completed ? (
                    <CheckCircle className="w-5 h-5 text-success-600 flex-shrink-0" />
                  ) : (
                    <Circle className="w-5 h-5 text-gray-400 flex-shrink-0" />
                  )}
                  <span className={item.completed ? 'line-through text-gray-500' : 'text-gray-900'}>
                    {item.title}
                  </span>
                  {item.description && (
                    <span className="ml-auto text-sm text-gray-500">
                      {item.description}
                    </span>
                  )}
                </div>
              ))}
            </div>

            {currentSprint.endDate && (
              <div className="mt-4 p-3 bg-gray-50 rounded-lg flex items-center gap-2">
                <Clock className="w-4 h-4 text-gray-500" />
                <span className="text-sm text-gray-600">
                  종료일: {new Date(currentSprint.endDate).toLocaleDateString('ko-KR')}
                </span>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Finish Team Modal */}
      <Modal
        isOpen={showFinishModal}
        onClose={() => setShowFinishModal(false)}
        title="팀 종료하기"
      >
        <div className="space-y-4">
          <p className="text-gray-600">
            정말로 팀을 종료하시겠습니까? 종료 후에는 팀원에게 피드백을 남길 수 있습니다.
          </p>
          <Alert type="warning">
            팀 종료 후에는 되돌릴 수 없습니다.
          </Alert>
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="secondary" onClick={() => setShowFinishModal(false)}>
              취소
            </Button>
            <Button 
              variant="danger" 
              onClick={handleFinishTeam}
              isLoading={isSubmitting}
            >
              팀 종료
            </Button>
          </div>
        </div>
      </Modal>

      {/* Feedback Modal */}
      <Modal
        isOpen={showFeedbackModal}
        onClose={() => setShowFeedbackModal(false)}
        title="팀원 피드백"
      >
        <div className="space-y-4">
          <p className="text-gray-600">
            {otherMembers.find((m: any) => m.userId === feedbackTarget)?.user?.name}님에 대한 피드백을 남겨주세요.
          </p>

          <Select
            label="평점"
            value={feedbackData.rating.toString()}
            onChange={(e) => setFeedbackData({ ...feedbackData, rating: parseInt(e.target.value) })}
            options={[
              { value: '5', label: '⭐⭐⭐⭐⭐ 훌륭해요' },
              { value: '4', label: '⭐⭐⭐⭐ 좋아요' },
              { value: '3', label: '⭐⭐⭐ 보통이에요' },
              { value: '2', label: '⭐⭐ 아쉬워요' },
              { value: '1', label: '⭐ 별로예요' },
            ]}
          />

          <Textarea
            label="코멘트 (선택)"
            value={feedbackData.comment}
            onChange={(e) => setFeedbackData({ ...feedbackData, comment: e.target.value })}
            placeholder="함께 일한 경험에 대해 자유롭게 적어주세요..."
            rows={4}
          />

          <div className="flex justify-end gap-3 pt-4">
            <Button variant="secondary" onClick={() => setShowFeedbackModal(false)}>
              취소
            </Button>
            <Button 
              onClick={handleSubmitFeedback}
              isLoading={isSubmitting}
            >
              피드백 보내기
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
