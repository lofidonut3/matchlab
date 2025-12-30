import { useEffect, useState } from 'react'
import { Sparkles, RefreshCw, Search } from 'lucide-react'
import { useMatchingStore } from '../stores/matching.store'
import { useInviteStore } from '../stores/invite.store'
import { MatchCard } from '../components/matching'
import { Button, LoadingSpinner, EmptyState, Modal, Textarea, Alert } from '../components/common'
import { Link } from 'react-router-dom'

export default function RecommendPage() {
  const { recommendations, isLoading, error, fetchRecommendations } = useMatchingStore()
  const { sendInvite, isLoading: isSending } = useInviteStore()
  
  const [inviteModalOpen, setInviteModalOpen] = useState(false)
  const [inviteTargetId, setInviteTargetId] = useState<string | null>(null)
  const [inviteMessage, setInviteMessage] = useState('')
  const [inviteError, setInviteError] = useState<string | null>(null)
  const [inviteSuccess, setInviteSuccess] = useState(false)

  useEffect(() => {
    fetchRecommendations()
  }, [fetchRecommendations])

  const handleInviteClick = (userId: string) => {
    setInviteTargetId(userId)
    setInviteMessage('')
    setInviteError(null)
    setInviteModalOpen(true)
  }

  const handleSendInvite = async () => {
    if (!inviteTargetId) return

    try {
      await sendInvite(inviteTargetId, inviteMessage || undefined)
      setInviteSuccess(true)
      setInviteModalOpen(false)
      setTimeout(() => setInviteSuccess(false), 3000)
    } catch (err) {
      setInviteError(err instanceof Error ? err.message : '초대 전송에 실패했습니다.')
    }
  }

  const targetMatch = recommendations.find(r => r.userId === inviteTargetId)

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary-100 rounded-xl flex items-center justify-center flex-shrink-0">
            <Sparkles className="w-5 h-5 text-primary-600" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">추천 팀원</h1>
            <p className="text-sm sm:text-base text-gray-600">당신과 가장 잘 맞는 Top 10 팀원</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => fetchRecommendations()}
            disabled={isLoading}
            leftIcon={<RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />}
          >
            <span className="hidden sm:inline">새로고침</span>
          </Button>
          <Link to="/explore">
            <Button variant="secondary" size="sm" leftIcon={<Search className="w-4 h-4" />}>
              <span className="hidden sm:inline">탐색하기</span>
            </Button>
          </Link>
        </div>
      </div>

      {inviteSuccess && (
        <Alert type="success" className="mb-6">
          초대가 성공적으로 전송되었습니다!
        </Alert>
      )}

      {/* Content */}
      {isLoading && recommendations.length === 0 ? (
        <div className="flex justify-center py-20">
          <LoadingSpinner size="lg" />
        </div>
      ) : error ? (
        <Alert type="error">
          {error}
        </Alert>
      ) : recommendations.length === 0 ? (
        <EmptyState
          icon={<Sparkles className="w-full h-full" />}
          title="아직 추천 팀원이 없습니다"
          description="프로필을 완성하고 잠시 후 다시 확인해주세요."
          action={
            <Button onClick={() => fetchRecommendations()}>
              다시 시도
            </Button>
          }
        />
      ) : (
        <div className="grid gap-4">
          {recommendations.map((match, index) => (
            <MatchCard
              key={match.userId}
              match={match}
              rank={index + 1}
              onInvite={handleInviteClick}
            />
          ))}
        </div>
      )}

      {/* Invite Modal */}
      <Modal
        isOpen={inviteModalOpen}
        onClose={() => setInviteModalOpen(false)}
        title="팀원 초대하기"
        size="md"
      >
        {targetMatch && (
          <div className="space-y-4">
            <p className="text-gray-600">
              <strong className="text-gray-900">{targetMatch.nickname}</strong>님에게 초대 메시지를 보내시겠습니까?
            </p>

            {inviteError && (
              <Alert type="error" onClose={() => setInviteError(null)}>
                {inviteError}
              </Alert>
            )}

            <Textarea
              label="초대 메시지 (선택)"
              value={inviteMessage}
              onChange={(e) => setInviteMessage(e.target.value)}
              placeholder="함께 하고 싶은 이유나 간단한 인사를 전해보세요..."
              rows={4}
            />

            <div className="flex justify-end gap-3 pt-4">
              <Button
                variant="secondary"
                onClick={() => setInviteModalOpen(false)}
              >
                취소
              </Button>
              <Button
                onClick={handleSendInvite}
                isLoading={isSending}
              >
                초대 보내기
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
