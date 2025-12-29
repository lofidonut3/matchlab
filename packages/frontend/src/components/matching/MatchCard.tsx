import { useNavigate } from 'react-router-dom'
import { 
  Star, 
  Clock, 
  MapPin, 
  AlertTriangle,
  MessageSquare,
  ChevronRight 
} from 'lucide-react'
import type { MatchRecommendation } from '@matchlab/shared'
import { ROLE_OPTIONS, DOMAIN_OPTIONS } from '@matchlab/shared'
import { Card, CardContent, Badge, Avatar, Button } from '../common'

interface MatchCardProps {
  match: MatchRecommendation
  rank?: number
  onInvite?: (userId: string) => void
  showInviteButton?: boolean
}

export default function MatchCard({ 
  match, 
  rank, 
  onInvite,
  showInviteButton = true 
}: MatchCardProps) {
  const navigate = useNavigate()

  // Get first domain from profile domains array or use single domain
  const profileDomains = match.profile.domains || []
  const primaryDomain = profileDomains[0] || ''
  const profileRoles = match.profile.roleCan || []
  const primaryRole = profileRoles[0] || ''
  
  const roleLabel = ROLE_OPTIONS.find(r => r.value === primaryRole)?.label || primaryRole
  const domainLabel = DOMAIN_OPTIONS.find(d => d.value === primaryDomain)?.label || primaryDomain

  const handleViewProfile = () => {
    navigate(`/profile/${match.userId}`)
  }

  const handleInvite = (e: React.MouseEvent) => {
    e.stopPropagation()
    onInvite?.(match.userId)
  }

  const getScoreVariant = (score: number): 'success' | 'warning' | 'danger' => {
    if (score >= 80) return 'success'
    if (score >= 60) return 'warning'
    return 'danger'
  }

  return (
    <Card hoverable onClick={handleViewProfile} className="overflow-hidden">
      <CardContent className="p-5">
        {/* Header */}
        <div className="flex items-start gap-4">
          {rank && (
            <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-sm font-bold text-primary-700">#{rank}</span>
            </div>
          )}
          <Avatar name={match.nickname} size="lg" />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-gray-900 truncate">{match.nickname}</h3>
              <Badge variant={getScoreVariant(match.matchScore?.total || 0)}>
                {match.matchScore?.total || 0}점
              </Badge>
            </div>
            <p className="text-sm text-gray-500">{roleLabel} · {domainLabel}</p>
          </div>
        </div>

        {/* Quick Info */}
        <div className="flex flex-wrap gap-3 mt-4 text-sm text-gray-600">
          <div className="flex items-center gap-1">
            <Clock className="w-4 h-4" />
            <span>주 {match.profile.availabilityHours || 0}시간</span>
          </div>
          <div className="flex items-center gap-1">
            <MapPin className="w-4 h-4" />
            <span>
              {match.profile.locationPref === 'remote_only' ? '원격' : 
               match.profile.locationPref === 'onsite_only' ? '오프라인' : 
               match.profile.locationPref === 'hybrid' ? '하이브리드' : '유연'}
            </span>
          </div>
        </div>

        {/* Match Reasons */}
        <div className="mt-4 p-3 bg-primary-50 rounded-lg">
          <div className="flex items-start gap-2">
            <Star className="w-4 h-4 text-primary-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-primary-800">
              {match.explanation?.reasons?.slice(0, 2).map((reason: string, idx: number) => (
                <p key={idx}>{reason}</p>
              ))}
            </div>
          </div>
        </div>

        {/* Caution */}
        {match.explanation?.caution && (
          <div className="mt-2 p-3 bg-warning-50 rounded-lg">
            <div className="flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-warning-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-warning-800">{match.explanation.caution}</p>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 mt-4 pt-4 border-t border-gray-100">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleViewProfile}
            rightIcon={<ChevronRight className="w-4 h-4" />}
            className="w-full sm:w-auto justify-center sm:justify-start"
          >
            프로필 보기
          </Button>
          {showInviteButton && onInvite && (
            <Button
              size="sm"
              onClick={handleInvite}
              leftIcon={<MessageSquare className="w-4 h-4" />}
              className="w-full sm:w-auto"
            >
              초대하기
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
