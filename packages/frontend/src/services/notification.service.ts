import api from '../lib/api'
import type { Notification } from '@matchlab/shared'

interface UnreadCountResponse {
  count: number
}

export const notificationService = {
  async getNotifications(): Promise<Notification[]> {
    const response = await api.get<Notification[]>('/notifications')
    return response.data
  },

  async markAsRead(notificationId: string): Promise<void> {
    await api.patch(`/notifications/${notificationId}/read`)
  },

  async markAllAsRead(): Promise<void> {
    await api.patch('/notifications/read-all')
  },

  async getUnreadCount(): Promise<number> {
    const response = await api.get<UnreadCountResponse>('/notifications/unread-count')
    return response.data.count
  },
}
