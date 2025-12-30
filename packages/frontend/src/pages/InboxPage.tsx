import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Mail, Check, X, Clock, MessageSquare } from 'lucide-react'
import { useInviteStore } from '../stores/invite.store'
import {
  Button,
  Card,
  CardContent,
  Badge,
  Avatar,
  LoadingSpinner,
  EmptyState,
  Alert
} from '../components/common'
import { ROLE_OPTIONS } from '@matchlab/shared'

export default function InboxPage() {
  const navigate = useNavigate()
  const {
    sentInvites,
    receivedInvites,
    isLoading,
    error,
    fetchInvites,
    acceptInvite,
    declineInvite
  } = useInviteStore()

  useEffect(() => {
    fetchInvites()
  }, [fetchInvites])

  const handleAccept = async (inviteId: string) => {
    try {
      await acceptInvite(inviteId)
      // Refetch to get updated data
      fetchInvites()
    } catch (err) {
      // Error handled in store
    }
  }

  const handleDecline = async (inviteId: string) => {
    try {
      await declineInvite(inviteId)
    } catch (err) {
      // Error handled in store
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="warning"><Clock className="w-3 h-3 mr-1" /> 대기중</Badge>
      case 'accepted':
        return <Badge variant="success"><Check className="w-3 h-3 mr-1" /> 수락됨</Badge>
      case 'declined':
        return <Badge variant="danger"><X className="w-3 h-3 mr-1" /> 거절됨</Badge>
      default:
        return <Badge>{status}</Badge>
    }
  }

  const pendingReceived = receivedInvites.filter(i => i.status === 'pending')
  const processedReceived = receivedInvites.filter(i => i.status !== 'pending')

  if (isLoading && receivedInvites.length === 0 && sentInvites.length === 0) {
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
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center">
          <Mail className="w-5 h-5 text-gray-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">받은 요청</h1>
          <p className="text-gray-600">팀원 초대를 확인하고 응답하세요</p>
        </div>
      </div>

      {error && (
        <Alert type="error" className="mb-6">{error}</Alert>
      )}

      {/* Pending Invites */}
      {pendingReceived.length > 0 && (
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            대기 중인 초대 ({pendingReceived.length})
          </h2>
          <div className="space-y-4">
            {pendingReceived.map((invite) => {
              const senderProfile = invite.fromUser?.profile
              const roleLabel = senderProfile ? ROLE_OPTIONS.find(r => r.value === senderProfile.roleWant?.[0])?.label : ''

              return (
                <Card key={invite.id}>
                  <CardContent className="p-4 sm:p-5">
                    <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                      <Avatar name={invite.fromUser?.nickname || '사용자'} size="lg" className="mx-auto sm:mx-0" />
                      <div className="flex-1 text-center sm:text-left">
                        <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mb-1">
                          <h3 className="font-semibold text-gray-900">
                            {invite.fromUser?.nickname}
                          </h3>
                          {getStatusBadge(invite.status)}
                        </div>
                        <p className="text-sm text-gray-500">{roleLabel}</p>
                        {invite.message && (
                          <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                            <div className="flex items-start gap-2">
                              <MessageSquare className="w-4 h-4 text-gray-400 mt-0.5" />
                              <p className="text-sm text-gray-700">{invite.message}</p>
                            </div>
                          </div>
                        )}
                      </div>
                      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto mt-4 sm:mt-0">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => navigate(`/profile/${invite.fromUserId}`)}
                          className="w-full sm:w-auto"
                        >
                          프로필
                        </Button>
                        <div className="flex gap-2">
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => handleDecline(invite.id)}
                            leftIcon={<X className="w-4 h-4" />}
                            className="flex-1 sm:flex-none"
                          >
                            거절
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => handleAccept(invite.id)}
                            leftIcon={<Check className="w-4 h-4" />}
                            className="flex-1 sm:flex-none"
                          >
                            수락
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>
      )}

      {/* Sent Invites */}
      {sentInvites.length > 0 && (
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            보낸 초대 ({sentInvites.length})
          </h2>
          <div className="space-y-4">
            {sentInvites.map((invite) => {
              const targetProfile = invite.toUser?.profile
              const roleLabel = targetProfile ? ROLE_OPTIONS.find(r => r.value === targetProfile.roleWant?.[0])?.label : ''

              return (
                <Card key={invite.id}>
                  <CardContent className="p-5">
                    <div className="flex items-center gap-4">
                      <Avatar name={invite.toUser?.nickname || '사용자'} size="md" />
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-medium text-gray-900">
                            {invite.toUser?.nickname}
                          </h3>
                          {getStatusBadge(invite.status)}
                        </div>
                        <p className="text-sm text-gray-500">{roleLabel}</p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => navigate(`/profile/${invite.toUserId}`)}
                      >
                        프로필 보기
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>
      )}

      {/* Processed Received */}
      {processedReceived.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            처리된 초대 ({processedReceived.length})
          </h2>
          <div className="space-y-4">
            {processedReceived.map((invite) => (
              <Card key={invite.id} className="opacity-75">
                <CardContent className="p-5">
                  <div className="flex items-center gap-4">
                    <Avatar name={invite.fromUser?.nickname || '사용자'} size="md" />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium text-gray-900">
                          {invite.fromUser?.nickname}
                        </h3>
                        {getStatusBadge(invite.status)}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {receivedInvites.length === 0 && sentInvites.length === 0 && (
        <EmptyState
          icon={<Mail className="w-full h-full" />}
          title="아직 초대가 없습니다"
          description="추천 팀원에게 초대를 보내거나, 다른 사용자의 초대를 기다려보세요."
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
