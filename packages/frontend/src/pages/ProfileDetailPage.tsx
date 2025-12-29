import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { 
  ArrowLeft, 
  Star, 
  Clock, 
  MapPin, 
  Target, 
  Link as LinkIcon,
  AlertTriangle,
  MessageSquare,
  Shield
} from 'lucide-react'
import { ROLE_OPTIONS, DOMAIN_OPTIONS, GOAL_OPTIONS, LOCATION_OPTIONS, TRAIT_QUESTIONS } from '@matchlab/shared'
import { useMatchingStore } from '../stores/matching.store'
import { useInviteStore } from '../stores/invite.store'
import { 
  Button, 
  Card, 
  CardContent, 
  CardHeader, 
  Badge, 
  Avatar, 
  LoadingSpinner, 
  Alert,
  Modal,
  Textarea,
  ProgressBar 
} from '../components/common'

export default function ProfileDetailPage() {
  const { userId } = useParams<{ userId: string }>()
  const navigate = useNavigate()
  const { selectedMatch, isLoading, error, fetchMatchDetail, clearSelectedMatch } = useMatchingStore()
  const { sendInvite, isLoading: isSending } = useInviteStore()

  const [inviteModalOpen, setInviteModalOpen] = useState(false)
  const [inviteMessage, setInviteMessage] = useState('')
  const [inviteError, setInviteError] = useState<string | null>(null)
  const [inviteSuccess, setInviteSuccess] = useState(false)

  useEffect(() => {
    if (userId) {
      fetchMatchDetail(userId)
    }
    return () => clearSelectedMatch()
  }, [userId, fetchMatchDetail, clearSelectedMatch])

  const handleSendInvite = async () => {
    if (!userId) return

    try {
      await sendInvite(userId, inviteMessage || undefined)
      setInviteSuccess(true)
      setInviteModalOpen(false)
    } catch (err) {
      setInviteError(err instanceof Error ? err.message : '초대 전송에 실패했습니다.')
    }
  }

  if (isLoading || !selectedMatch) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-8">
        <Button variant="ghost" onClick={() => navigate(-1)} leftIcon={<ArrowLeft className="w-4 h-4" />}>
          뒤로
        </Button>
        <div className="flex justify-center py-20">
          <LoadingSpinner size="lg" />
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-8">
        <Button variant="ghost" onClick={() => navigate(-1)} leftIcon={<ArrowLeft className="w-4 h-4" />}>
          뒤로
        </Button>
        <Alert type="error" className="mt-6">{error}</Alert>
      </div>
    )
  }

  const { profile, matchScore, explanation, traitResult, trustScore } = selectedMatch
  const roleLabel = profile.roleNeed?.length 
    ? profile.roleNeed.map(r => ROLE_OPTIONS.find(opt => opt.value === r)?.label || r).join(', ')
    : '역할 미지정'
  const domainLabel = profile.domains?.length
    ? profile.domains.map(d => DOMAIN_OPTIONS.find(opt => opt.value === d)?.label || d).join(', ')
    : '도메인 미지정'
  const goalLabel = GOAL_OPTIONS.find(g => g.value === profile.goal)?.label || profile.goal
  const locationLabel = LOCATION_OPTIONS.find(l => l.value === profile.locationPref)?.label || profile.locationPref

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      {/* Back Button */}
      <Button 
        variant="ghost" 
        onClick={() => navigate(-1)} 
        leftIcon={<ArrowLeft className="w-4 h-4" />}
        className="mb-6"
      >
        뒤로
      </Button>

      {inviteSuccess && (
        <Alert type="success" className="mb-6">
          초대가 성공적으로 전송되었습니다!
        </Alert>
      )}

      {/* Profile Header */}
      <Card className="mb-6">
        <CardContent className="py-6">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-6">
            <Avatar name={selectedMatch.nickname || '사용자'} size="xl" />
            <div className="flex-1 text-center sm:text-left">
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 sm:gap-3 mb-2">
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900">{selectedMatch.nickname}</h1>
                {matchScore && (
                  <Badge variant={matchScore.total >= 80 ? 'success' : matchScore.total >= 60 ? 'warning' : 'danger'} size="md">
                    {matchScore.total}점
                  </Badge>
                )}
              </div>
              <p className="text-gray-600 mb-4 text-sm sm:text-base">{roleLabel} · {domainLabel}</p>
              
              <div className="flex flex-wrap justify-center sm:justify-start gap-3 sm:gap-4 text-xs sm:text-sm text-gray-600">
                <div className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  <span>주 {profile.availabilityHours}시간</span>
                </div>
                <div className="flex items-center gap-1">
                  <MapPin className="w-4 h-4" />
                  <span>{locationLabel}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Target className="w-4 h-4" />
                  <span>{goalLabel}</span>
                </div>
              </div>
            </div>
            <Button 
              onClick={() => setInviteModalOpen(true)}
              leftIcon={<MessageSquare className="w-4 h-4" />}
              className="w-full sm:w-auto mt-4 sm:mt-0"
            >
              초대하기
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Match Explanation */}
      {explanation && (
        <Card className="mb-6">
          <CardHeader>
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Star className="w-5 h-5 text-primary-600" />
              매칭 분석
            </h2>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Match Reasons */}
              <div className="p-4 bg-primary-50 rounded-lg">
                <h3 className="font-medium text-primary-800 mb-2">추천 이유</h3>
                <ul className="space-y-1">
                  {explanation.reasons?.map((reason, idx) => (
                    <li key={idx} className="text-primary-700 flex items-start gap-2">
                      <span className="text-primary-600">•</span>
                      {reason}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Caution */}
              {explanation.caution && (
                <div className="p-4 bg-warning-50 rounded-lg">
                  <h3 className="font-medium text-warning-800 mb-2 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4" />
                    주의할 점
                  </h3>
                  <p className="text-warning-700">{explanation.caution}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Score Breakdown */}
      {matchScore && (
        <Card className="mb-6">
          <CardHeader>
            <h2 className="text-lg font-semibold">점수 상세</h2>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-gray-700">안정성 (60%)</span>
                  <span className="text-sm text-gray-600">{matchScore.stability}/100</span>
                </div>
                <ProgressBar value={matchScore.stability} variant="primary" />
              </div>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-gray-700">시너지 (30%)</span>
                  <span className="text-sm text-gray-600">{matchScore.synergy}/100</span>
                </div>
                <ProgressBar value={matchScore.synergy} variant="success" />
              </div>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-gray-700">신뢰도 (10%)</span>
                  <span className="text-sm text-gray-600">{matchScore.trust}/100</span>
                </div>
                <ProgressBar value={matchScore.trust} variant="warning" />
              </div>
              {matchScore.penalties > 0 && (
                <div className="p-3 bg-danger-50 rounded-lg text-danger-700 text-sm">
                  패널티: -{matchScore.penalties}점
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Bio */}
      {profile.bio && (
        <Card className="mb-6">
          <CardHeader>
            <h2 className="text-lg font-semibold">자기소개</h2>
          </CardHeader>
          <CardContent>
            <p className="text-gray-700 whitespace-pre-wrap">{profile.bio}</p>
          </CardContent>
        </Card>
      )}

      {/* Trust Score */}
      {trustScore && (
        <Card className="mb-6">
          <CardHeader>
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Shield className="w-5 h-5" />
              신뢰 점수
            </h2>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <div className="text-3xl font-bold text-gray-900">{trustScore.total}점</div>
              <div className="text-sm text-gray-600">
                <p>프로필 완성도: {trustScore.completeness}%</p>
                <p>근거 강도: {trustScore.evidenceStrength}%</p>
                <p>활동성: {trustScore.activity}%</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Evidence Links */}
      {profile.evidenceLinks && profile.evidenceLinks.length > 0 && (
        <Card className="mb-6">
          <CardHeader>
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <LinkIcon className="w-5 h-5" />
              증빙 링크
            </h2>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {profile.evidenceLinks.map((link) => (
                <a
                  key={link.id}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
                >
                  <Badge variant={link.verifiedByUser ? 'success' : 'default'} size="sm">
                    {link.type}
                  </Badge>
                  <span className="text-primary-600 truncate flex-1">{link.url}</span>
                  {link.verifiedByUser && (
                    <Badge variant="success" size="sm">인증됨</Badge>
                  )}
                </a>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Traits */}
      {traitResult && (
        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold">창업 MBTI</h2>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              {TRAIT_QUESTIONS.map((q) => {
                const value = traitResult?.[q.traitAxis as keyof typeof traitResult]
                if (typeof value !== 'number') return null
                return (
                  <div key={q.id} className="p-3 bg-gray-50 rounded-lg">
                    <div className="text-sm text-gray-600 mb-1">{q.traitAxis}</div>
                    <div className="flex items-center gap-2">
                      <ProgressBar value={value * 50} className="flex-1" />
                      <span className="text-sm font-medium text-gray-700">{value === 1 ? 'A' : 'B'}</span>
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Invite Modal */}
      <Modal
        isOpen={inviteModalOpen}
        onClose={() => setInviteModalOpen(false)}
        title="팀원 초대하기"
        size="md"
      >
        <div className="space-y-4">
          <p className="text-gray-600">
            <strong className="text-gray-900">{selectedMatch.nickname}</strong>님에게 초대 메시지를 보내시겠습니까?
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
            <Button variant="secondary" onClick={() => setInviteModalOpen(false)}>
              취소
            </Button>
            <Button onClick={handleSendInvite} isLoading={isSending}>
              초대 보내기
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
