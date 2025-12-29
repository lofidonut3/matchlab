import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Save } from 'lucide-react'
import { ROLE_OPTIONS, DOMAIN_OPTIONS, GOAL_OPTIONS, LOCATION_OPTIONS, MEETING_FREQ_OPTIONS } from '@matchlab/shared'
import { profileService } from '../../services'
import { 
  Button, 
  Card, 
  CardContent, 
  Select, 
  Textarea, 
  Input,
  LoadingSpinner, 
  Alert 
} from '../../components/common'
import type { Profile } from '@matchlab/shared'

export default function EditProfilePage() {
  const navigate = useNavigate()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const [formData, setFormData] = useState({
    role: '',
    domain: '',
    commitHoursPerWeek: 20,
    locationPref: 'REMOTE',
    meetingFreq: 'WEEKLY',
    goal: '',
    bio: '',
    prevFounderExp: false,
    prevCofounderExp: false,
  })

  useEffect(() => {
    fetchProfile()
  }, [])

  const fetchProfile = async () => {
    setIsLoading(true)
    try {
      const data = await profileService.getMyProfile()
      setProfile(data)
      setFormData({
        role: data.role || '',
        domain: data.domain || '',
        commitHoursPerWeek: data.commitHoursPerWeek || 20,
        locationPref: data.locationPref || 'REMOTE',
        meetingFreq: data.meetingFreq || 'WEEKLY',
        goal: data.goal || '',
        bio: data.bio || '',
        prevFounderExp: data.prevFounderExp || false,
        prevCofounderExp: data.prevCofounderExp || false,
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
      await profileService.updateProfile(formData)
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
            label="역할"
            value={formData.role}
            onChange={(e) => setFormData({ ...formData, role: e.target.value })}
            options={ROLE_OPTIONS.map(r => ({ value: r.value, label: r.label }))}
          />

          {/* Domain */}
          <Select
            label="관심 도메인"
            value={formData.domain}
            onChange={(e) => setFormData({ ...formData, domain: e.target.value })}
            options={DOMAIN_OPTIONS.map(d => ({ value: d.value, label: d.label }))}
          />

          {/* Goal */}
          <Select
            label="창업 목표"
            value={formData.goal}
            onChange={(e) => setFormData({ ...formData, goal: e.target.value })}
            options={GOAL_OPTIONS.map(g => ({ value: g.value, label: g.label }))}
          />

          {/* Commit Hours */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              주당 투입 가능 시간: <strong>{formData.commitHoursPerWeek}시간</strong>
            </label>
            <input
              type="range"
              min="5"
              max="60"
              step="5"
              value={formData.commitHoursPerWeek}
              onChange={(e) => setFormData({ ...formData, commitHoursPerWeek: parseInt(e.target.value) })}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-primary-600"
            />
          </div>

          {/* Location Preference */}
          <Select
            label="근무 형태"
            value={formData.locationPref}
            onChange={(e) => setFormData({ ...formData, locationPref: e.target.value })}
            options={LOCATION_OPTIONS.map(l => ({ value: l.value, label: l.label }))}
          />

          {/* Meeting Frequency */}
          <Select
            label="선호 미팅 빈도"
            value={formData.meetingFreq}
            onChange={(e) => setFormData({ ...formData, meetingFreq: e.target.value })}
            options={MEETING_FREQ_OPTIONS.map(m => ({ value: m.value, label: m.label }))}
          />

          {/* Experience */}
          <div className="space-y-3">
            <label className="block text-sm font-medium text-gray-700">경험</label>
            <label className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 cursor-pointer hover:bg-gray-50">
              <input
                type="checkbox"
                checked={formData.prevFounderExp}
                onChange={(e) => setFormData({ ...formData, prevFounderExp: e.target.checked })}
                className="w-5 h-5 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
              />
              <span className="text-gray-700">창업 경험이 있습니다 (대표)</span>
            </label>
            <label className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 cursor-pointer hover:bg-gray-50">
              <input
                type="checkbox"
                checked={formData.prevCofounderExp}
                onChange={(e) => setFormData({ ...formData, prevCofounderExp: e.target.checked })}
                className="w-5 h-5 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
              />
              <span className="text-gray-700">공동창업 경험이 있습니다</span>
            </label>
          </div>

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
