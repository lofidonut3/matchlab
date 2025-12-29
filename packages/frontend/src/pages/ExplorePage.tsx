import { useState, useEffect } from 'react'
import { Search, Filter, X } from 'lucide-react'
import { ROLE_OPTIONS, DOMAIN_OPTIONS, LOCATION_OPTIONS } from '@matchlab/shared'
import { useMatchingStore } from '../stores/matching.store'
import { useInviteStore } from '../stores/invite.store'
import { MatchCard } from '../components/matching'
import { Button, Input, Select, LoadingSpinner, EmptyState, Modal, Textarea, Alert } from '../components/common'

export default function ExplorePage() {
  const { exploreResults, isExploring, error, explore, filters, setFilters } = useMatchingStore()
  const { sendInvite, isLoading: isSending } = useInviteStore()
  
  const [showFilters, setShowFilters] = useState(false)
  const [inviteModalOpen, setInviteModalOpen] = useState(false)
  const [inviteTargetId, setInviteTargetId] = useState<string | null>(null)
  const [inviteMessage, setInviteMessage] = useState('')
  const [inviteError, setInviteError] = useState<string | null>(null)

  useEffect(() => {
    explore(filters)
  }, [])

  const handleSearch = () => {
    explore(filters)
    setShowFilters(false)
  }

  const handleResetFilters = () => {
    setFilters({})
    explore({})
  }

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
      setInviteModalOpen(false)
    } catch (err) {
      setInviteError(err instanceof Error ? err.message : '초대 전송에 실패했습니다.')
    }
  }

  const hasActiveFilters = Object.keys(filters).some(key => (filters as any)[key])
  const targetMatch = exploreResults.find(r => r.userId === inviteTargetId)

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 sm:py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center flex-shrink-0">
            <Search className="w-5 h-5 text-gray-600" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">탐색</h1>
            <p className="text-sm sm:text-base text-gray-600">조건에 맞는 팀원을 찾아보세요</p>
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6">
        <div className="flex items-center gap-3 flex-wrap">
          <Button
            variant={showFilters ? 'primary' : 'secondary'}
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
            leftIcon={<Filter className="w-4 h-4" />}
          >
            필터
            {hasActiveFilters && (
              <span className="ml-1 w-5 h-5 bg-primary-600 text-white text-xs rounded-full flex items-center justify-center">
                !
              </span>
            )}
          </Button>

          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleResetFilters}
              leftIcon={<X className="w-4 h-4" />}
            >
              초기화
            </Button>
          )}

          <div className="ml-auto text-sm text-gray-500">
            {exploreResults.length}명 검색됨
          </div>
        </div>

        {/* Expanded Filters */}
        {showFilters && (
          <div className="mt-4 pt-4 border-t border-gray-200 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            <Select
              label="역할"
              value={filters.roles?.[0] || ''}
              onChange={(e) => setFilters({ roles: e.target.value ? [e.target.value] : undefined })}
              options={[
                { value: '', label: '모든 역할' },
                ...ROLE_OPTIONS.map(r => ({ value: r.value, label: r.label }))
              ]}
            />
            <Select
              label="도메인"
              value={filters.domains?.[0] || ''}
              onChange={(e) => setFilters({ domains: e.target.value ? [e.target.value] : undefined })}
              options={[
                { value: '', label: '모든 도메인' },
                ...DOMAIN_OPTIONS.map(d => ({ value: d.value, label: d.label }))
              ]}
            />
            <Select
              label="근무 형태"
              value={filters.locationPref?.[0] || ''}
              onChange={(e) => setFilters({ locationPref: e.target.value ? [e.target.value] : undefined })}
              options={[
                { value: '', label: '모든 형태' },
                ...LOCATION_OPTIONS.map(l => ({ value: l.value, label: l.label }))
              ]}
            />
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                최소 투입 시간
              </label>
              <Input
                type="number"
                value={filters.minHours || ''}
                onChange={(e) => setFilters({ minHours: e.target.value ? parseInt(e.target.value) : undefined })}
                placeholder="예: 20"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                최대 투입 시간
              </label>
              <Input
                type="number"
                value={filters.maxHours || ''}
                onChange={(e) => setFilters({ maxHours: e.target.value ? parseInt(e.target.value) : undefined })}
                placeholder="예: 40"
              />
            </div>
            <div className="flex items-end">
              <Button onClick={handleSearch} className="w-full">
                검색
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Results */}
      {isExploring ? (
        <div className="flex justify-center py-20">
          <LoadingSpinner size="lg" />
        </div>
      ) : error ? (
        <Alert type="error">{error}</Alert>
      ) : exploreResults.length === 0 ? (
        <EmptyState
          icon={<Search className="w-full h-full" />}
          title="검색 결과가 없습니다"
          description="다른 조건으로 다시 검색해보세요."
          action={
            <Button onClick={handleResetFilters}>필터 초기화</Button>
          }
        />
      ) : (
        <div className="grid gap-4">
          {exploreResults.map((match) => (
            <MatchCard
              key={match.userId}
              match={match}
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
              <Button variant="secondary" onClick={() => setInviteModalOpen(false)}>
                취소
              </Button>
              <Button onClick={handleSendInvite} isLoading={isSending}>
                초대 보내기
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
