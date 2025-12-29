import { useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Users, Calendar, CheckCircle, ArrowRight, Plus } from 'lucide-react'
import { useTeamStore } from '../../stores/team.store'
import { 
  Button, 
  Card, 
  CardContent, 
  Badge, 
  Avatar, 
  LoadingSpinner, 
  EmptyState 
} from '../../components/common'

export default function TeamListPage() {
  const navigate = useNavigate()
  const { activeTeams, finishedTeams, isLoading, fetchTeams } = useTeamStore()

  useEffect(() => {
    fetchTeams()
  }, [fetchTeams])

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return <Badge variant="success">진행중</Badge>
      case 'FINISHED':
        return <Badge variant="default">종료</Badge>
      case 'CANCELLED':
        return <Badge variant="danger">취소됨</Badge>
      default:
        return <Badge>{status}</Badge>
    }
  }

  if (isLoading && activeTeams.length === 0 && finishedTeams.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex justify-center py-20">
          <LoadingSpinner size="lg" />
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center flex-shrink-0">
            <Users className="w-5 h-5 text-gray-600" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">내 팀</h1>
            <p className="text-sm sm:text-base text-gray-600">케미 테스트 중인 팀을 관리하세요</p>
          </div>
        </div>
        <Link to="/recommend">
          <Button leftIcon={<Plus className="w-4 h-4" />} className="w-full sm:w-auto">
            새 팀원 찾기
          </Button>
        </Link>
      </div>

      {/* Active Teams */}
      {activeTeams.length > 0 && (
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            진행 중인 팀 ({activeTeams.length})
          </h2>
          <div className="grid gap-4">
            {activeTeams.map((team) => (
              <Card 
                key={team.id} 
                hoverable 
                onClick={() => navigate(`/teams/${team.id}`)}
              >
                <CardContent className="p-5">
                  <div className="flex items-center gap-4">
                    <div className="flex -space-x-2">
                      {(team as any).members?.slice(0, 3).map((member: any) => (
                        <Avatar 
                          key={member.userId} 
                          name={member.user?.name || '사용자'} 
                          size="md"
                          className="ring-2 ring-white"
                        />
                      ))}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-gray-900">{team.name}</h3>
                        {getStatusBadge(team.status)}
                      </div>
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <span className="flex items-center gap-1">
                          <Users className="w-4 h-4" />
                          {(team as any).members?.length || 0}명
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          {new Date(team.createdAt).toLocaleDateString('ko-KR')}
                        </span>
                      </div>
                    </div>
                    <ArrowRight className="w-5 h-5 text-gray-400" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Finished Teams */}
      {finishedTeams.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            종료된 팀 ({finishedTeams.length})
          </h2>
          <div className="grid gap-4">
            {finishedTeams.map((team) => (
              <Card 
                key={team.id} 
                hoverable 
                onClick={() => navigate(`/teams/${team.id}`)}
                className="opacity-75"
              >
                <CardContent className="p-5">
                  <div className="flex items-center gap-4">
                    <div className="flex -space-x-2">
                      {(team as any).members?.slice(0, 3).map((member: any) => (
                        <Avatar 
                          key={member.userId} 
                          name={member.user?.name || '사용자'} 
                          size="md"
                          className="ring-2 ring-white"
                        />
                      ))}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-medium text-gray-900">{team.name}</h3>
                        {getStatusBadge(team.status)}
                      </div>
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <span className="flex items-center gap-1">
                          <CheckCircle className="w-4 h-4 text-success-500" />
                          완료됨
                        </span>
                      </div>
                    </div>
                    <ArrowRight className="w-5 h-5 text-gray-400" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {activeTeams.length === 0 && finishedTeams.length === 0 && (
        <EmptyState
          icon={<Users className="w-full h-full" />}
          title="아직 팀이 없습니다"
          description="추천 팀원에게 초대를 보내거나, 초대를 수락하여 팀을 시작해보세요."
          action={
            <Button onClick={() => navigate('/recommend')}>
              추천 팀원 보기
            </Button>
          }
        />
      )}
    </div>
  )
}
