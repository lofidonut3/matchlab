import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { 
  User, 
  Edit, 
  Clock, 
  MapPin, 
  Target, 
  Link as LinkIcon,
  Shield,
  Plus
} from 'lucide-react'
import { ROLE_OPTIONS, DOMAIN_OPTIONS, GOAL_OPTIONS, LOCATION_OPTIONS, TRAIT_QUESTIONS } from '@matchlab/shared'
import { profileService } from '../../services'
import { useAuthStore } from '../../stores/auth.store'
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
  Input,
  Select
} from '../../components/common'
import type { Profile } from '@matchlab/shared'

export default function MyProfilePage() {
  const { user } = useAuthStore()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showEvidenceModal, setShowEvidenceModal] = useState(false)
  const [evidenceData, setEvidenceData] = useState({ type: 'LINKEDIN', url: '' })
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    fetchProfile()
  }, [])

  const fetchProfile = async () => {
    setIsLoading(true)
    try {
      const data = await profileService.getMyProfile()
      setProfile(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : '프로필을 불러오는데 실패했습니다.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleAddEvidence = async () => {
    setIsSubmitting(true)
    try {
      await profileService.addEvidenceLink({
        type: evidenceData.type,
        url: evidenceData.url,
      })
      setShowEvidenceModal(false)
      setEvidenceData({ type: 'LINKEDIN', url: '' })
      fetchProfile()
    } catch (err) {
      // Error handling
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="flex justify-center py-20">
          <LoadingSpinner size="lg" />
        </div>
      </div>
    )
  }

  if (error || !profile) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-8">
        <Alert type="error">{error || '프로필을 찾을 수 없습니다.'}</Alert>
      </div>
    )
  }

  const roleLabel = profile.roleNeed?.length 
    ? profile.roleNeed.map(r => ROLE_OPTIONS.find(opt => opt.value === r)?.label || r).join(', ')
    : '역할 미지정'
  const domainLabel = profile.domains?.length
    ? profile.domains.map(d => DOMAIN_OPTIONS.find(opt => opt.value === d)?.label || d).join(', ')
    : '도메인 미지정'
  const goalLabel = GOAL_OPTIONS.find(g => g.value === profile.goal)?.label || profile.goal
  const locationLabel = LOCATION_OPTIONS.find(l => l.value === profile.locationPref)?.label || profile.locationPref

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 sm:py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center flex-shrink-0">
            <User className="w-5 h-5 text-gray-600" />
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">내 프로필</h1>
        </div>
        <Link to="/my-profile/edit">
          <Button leftIcon={<Edit className="w-4 h-4" />} className="w-full sm:w-auto">수정</Button>
        </Link>
      </div>

      {/* Profile Header */}
      <Card className="mb-6">
        <CardContent className="py-6">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-6">
            <Avatar name={user?.nickname || '사용자'} size="xl" />
            <div className="text-center sm:text-left">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900">{user?.nickname}</h2>
              <p className="text-gray-600 text-sm sm:text-base">{roleLabel} · {domainLabel}</p>
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 sm:gap-4 mt-2 text-xs sm:text-sm text-gray-600">
                <span className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  주 {profile.availabilityHours}시간
                </span>
                <span className="flex items-center gap-1">
                  <MapPin className="w-4 h-4" />
                  {locationLabel}
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

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

      {/* Goal & Experience */}
      <Card className="mb-6">
        <CardHeader>
          <h2 className="text-lg font-semibold">목표 및 경험</h2>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <Target className="w-5 h-5 text-primary-600" />
              <div>
                <div className="text-sm text-gray-500">창업 목표</div>
                <div className="font-medium text-gray-900">{goalLabel}</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Trust Score */}
      {profile.trustScore && (
        <Card className="mb-6">
          <CardHeader>
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Shield className="w-5 h-5" />
              신뢰 점수
            </h2>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-6">
              <div className="text-4xl font-bold text-primary-600">
                {profile.trustScore.total}
              </div>
              <div className="text-sm text-gray-600 space-y-1">
                <p>프로필 완성도: {profile.trustScore.completeness}%</p>
                <p>근거 강도: {profile.trustScore.evidenceStrength}%</p>
                <p>활동성: {profile.trustScore.activity}%</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Evidence Links */}
      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <LinkIcon className="w-5 h-5" />
              증빙 링크
            </h2>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => setShowEvidenceModal(true)}
              leftIcon={<Plus className="w-4 h-4" />}
            >
              추가
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {profile.evidenceLinks && profile.evidenceLinks.length > 0 ? (
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
          ) : (
            <p className="text-gray-500 text-center py-4">
              아직 등록된 증빙 링크가 없습니다.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Traits */}
      {profile.traits && (
        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold">창업 MBTI</h2>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              {TRAIT_QUESTIONS.map((q) => {
                const value = profile.traits?.[q.traitAxis as keyof typeof profile.traits]
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

      {/* Add Evidence Modal */}
      <Modal
        isOpen={showEvidenceModal}
        onClose={() => setShowEvidenceModal(false)}
        title="증빙 링크 추가"
      >
        <div className="space-y-4">
          <Select
            label="유형"
            value={evidenceData.type}
            onChange={(e) => setEvidenceData({ ...evidenceData, type: e.target.value })}
            options={[
              { value: 'LINKEDIN', label: 'LinkedIn' },
              { value: 'GITHUB', label: 'GitHub' },
              { value: 'PORTFOLIO', label: '포트폴리오' },
              { value: 'NEWS', label: '뉴스 기사' },
              { value: 'OTHER', label: '기타' },
            ]}
          />

          <Input
            label="URL"
            value={evidenceData.url}
            onChange={(e) => setEvidenceData({ ...evidenceData, url: e.target.value })}
            placeholder="https://..."
            type="url"
          />

          <div className="flex justify-end gap-3 pt-4">
            <Button variant="secondary" onClick={() => setShowEvidenceModal(false)}>
              취소
            </Button>
            <Button 
              onClick={handleAddEvidence}
              disabled={!evidenceData.url}
              isLoading={isSubmitting}
            >
              추가
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
