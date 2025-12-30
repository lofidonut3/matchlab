import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Bell, Check, CheckCheck, UserPlus, Users, MessageSquare, AlertTriangle } from 'lucide-react'
import { useNotificationStore } from '../stores/notification.store'
import { 
  Button, 
  Card, 
  CardContent,
  LoadingSpinner, 
  EmptyState 
} from '../components/common'
import { timeAgo } from '@matchlab/shared'

export default function NotificationsPage() {
  const navigate = useNavigate()
  const { 
    notifications, 
    isLoading, 
    fetchNotifications, 
    markAsRead, 
    markAllAsRead,
    unreadCount 
  } = useNotificationStore()

  useEffect(() => {
    fetchNotifications()
  }, [fetchNotifications])

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'INVITE_RECEIVED':
        return <UserPlus className="w-5 h-5 text-primary-600" />
      case 'INVITE_ACCEPTED':
        return <Check className="w-5 h-5 text-success-600" />
      case 'TEAM_CREATED':
        return <Users className="w-5 h-5 text-success-600" />
      case 'CHECKIN_REMINDER':
        return <MessageSquare className="w-5 h-5 text-warning-600" />
      case 'SPRINT_END':
        return <AlertTriangle className="w-5 h-5 text-warning-600" />
      case 'FEEDBACK_RECEIVED':
        return <MessageSquare className="w-5 h-5 text-primary-600" />
      default:
        return <Bell className="w-5 h-5 text-gray-600" />
    }
  }

  const handleNotificationClick = async (notification: any) => {
    if (!notification.read) {
      await markAsRead(notification.id)
    }

    // Navigate based on type
    if (notification.data?.teamId) {
      navigate(`/teams/${notification.data.teamId}`)
    } else if (notification.data?.inviteId) {
      navigate('/inbox')
    } else if (notification.type === 'INVITE_RECEIVED') {
      navigate('/inbox')
    }
  }

  if (isLoading && notifications.length === 0) {
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
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 sm:mb-8">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center flex-shrink-0">
            <Bell className="w-5 h-5 text-gray-600" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">알림</h1>
            {unreadCount > 0 && (
              <p className="text-sm sm:text-base text-gray-600">{unreadCount}개의 읽지 않은 알림</p>
            )}
          </div>
        </div>
        {unreadCount > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={markAllAsRead}
            leftIcon={<CheckCheck className="w-4 h-4" />}
            className="w-full sm:w-auto"
          >
            모두 읽음
          </Button>
        )}
      </div>

      {/* Notifications List */}
      {notifications.length === 0 ? (
        <EmptyState
          icon={<Bell className="w-full h-full" />}
          title="알림이 없습니다"
          description="새로운 소식이 있으면 여기에 표시됩니다."
        />
      ) : (
        <div className="space-y-3">
          {notifications.map((notification) => (
            <Card
              key={notification.id}
              hoverable
              onClick={() => handleNotificationClick(notification)}
              className={!notification.read ? 'border-primary-200 bg-primary-50/50' : ''}
            >
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 mt-0.5">
                    {getNotificationIcon(notification.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-gray-900 ${!notification.read ? 'font-medium' : ''}`}>
                      {notification.message}
                    </p>
                    <p className="text-sm text-gray-500 mt-1">
                      {timeAgo(new Date(notification.createdAt))}
                    </p>
                  </div>
                  {!notification.read && (
                    <div className="w-2 h-2 bg-primary-600 rounded-full flex-shrink-0 mt-2" />
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
