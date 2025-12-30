import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Save } from 'lucide-react'
import { ROLE_OPTIONS, DOMAIN_OPTIONS, GOAL_OPTIONS, LOCATION_OPTIONS, MEETING_FREQ_OPTIONS } from '@matchlab/shared'
import type { LocationPref, MeetingFreq, Goal, Domain, Role } from '@matchlab/shared'
import { profileService } from '../../services'
import { 
  Button, 
  Card, 
  CardContent, 
  Select, 
  Textarea,
  LoadingSpinner, 
  Alert 
} from '../../components/common'

export default function EditProfilePage() {
  const navigate = useNavigate()
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const [formData, setFormData] = useState({
    roleWant: [] as Role[],
    domains: [] as Domain[],
    availabilityHours: 20,
    locationPref: 'remote_only' as LocationPref,
    meetingFreq: 'weekly' as MeetingFreq,
    goal: '' as Goal | '',
    bio: '',
  })

  useEffect(() => {
    fetchProfile()
  }, [])

  const fetchProfile = async () => {
    setIsLoading(true)
    try {
      const data = await profileService.getMyProfile()
      setFormData({
        roleWant: data.roleWant || [],
        domains: data.domains || [],
        availabilityHours: data.availabilityHours || 20,
        locationPref: data.locationPref || 'remote_only',
        meetingFreq: data.meetingFreq || 'weekly',
        goal: data.goal || '',
        bio: data.bio || '',
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : '프로필을 불러오는데 실패했습니다.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSave = async () => {
    setIsSaving(true)
    setError(null)
    try {
      await profileService.updateProfile({
        ...formData,
        goal: formData.goal || undefined,
      })
      setSuccess(true)
      setTimeout(() => navigate('/my-profile'), 1500)
    } catch (err) {
      setError(err instanceof Error ? err.message : '프로필 저장에 실패했습니다.')
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="flex justify-center py-20">
          <LoadingSpinner size="lg" />
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 sm:py-8">
      {/* Back Button */}
      <Button 
        variant="ghost" 
        onClick={() => navigate('/my-profile')} 
        leftIcon={<ArrowLeft className="w-4 h-4" />}
        className="mb-4 sm:mb-6"
      >
        뒤로
      </Button>

      <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4 sm:mb-6">프로필 수정</h1>

      {error && (
        <Alert type="error" className="mb-6" onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert type="success" className="mb-6">
          프로필이 저장되었습니다!
        </Alert>
      )}

      <Card className="mb-6">
        <CardContent className="py-6 space-y-6">
          {/* Role */}
          <Select
            label="하고 싶은 역할"
            value={formData.roleWant[0] || ''}
            onChange={(e) => setFormData({ ...formData, roleWant: [e.target.value as Role] })}
            options={ROLE_OPTIONS.map(r => ({ value: r.value, label: r.label }))}
          />

          {/* Domain */}
          <Select
            label="관심 도메인"
            value={formData.domains[0] || ''}
            onChange={(e) => setFormData({ ...formData, domains: [e.target.value as Domain] })}
            options={DOMAIN_OPTIONS.map(d => ({ value: d.value, label: d.label }))}
          />

          {/* Goal */}
          <Select
            label="창업 목표"
            value={formData.goal}
            onChange={(e) => setFormData({ ...formData, goal: e.target.value as Goal })}
            options={GOAL_OPTIONS.map(g => ({ value: g.value, label: g.label }))}
          />

          {/* Commit Hours */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              주당 투입 가능 시간: <strong>{formData.availabilityHours}시간</strong>
            </label>
            <input
              type="range"
              min="5"
              max="60"
              step="5"
              value={formData.availabilityHours}
              onChange={(e) => setFormData({ ...formData, availabilityHours: parseInt(e.target.value) })}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-primary-600"
            />
          </div>

          {/* Location Preference */}
          <Select
            label="근무 형태"
            value={formData.locationPref}
            onChange={(e) => setFormData({ ...formData, locationPref: e.target.value as LocationPref })}
            options={LOCATION_OPTIONS.map(l => ({ value: l.value, label: l.label }))}
          />

          {/* Meeting Frequency */}
          <Select
            label="선호 미팅 빈도"
            value={formData.meetingFreq}
            onChange={(e) => setFormData({ ...formData, meetingFreq: e.target.value as MeetingFreq })}
            options={MEETING_FREQ_OPTIONS.map(m => ({ value: m.value, label: m.label }))}
          />

          {/* Bio */}
          <Textarea
            label="자기소개"
            value={formData.bio}
            onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
            placeholder="팀원에게 보여줄 자기소개를 작성하세요..."
            rows={5}
          />
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button
          onClick={handleSave}
          isLoading={isSaving}
          leftIcon={<Save className="w-4 h-4" />}
          size="lg"
        >
          저장
        </Button>
      </div>
    </div>
  )
}
