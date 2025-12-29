import { create } from 'zustand'
import type { Notification } from '@matchlab/shared'
import { notificationService } from '../services'

interface NotificationState {
  notifications: Notification[]
  unreadCount: number
  isLoading: boolean
  error: string | null

  // Actions
  fetchNotifications: () => Promise<void>
  fetchUnreadCount: () => Promise<void>
  markAsRead: (notificationId: string) => Promise<void>
  markAllAsRead: () => Promise<void>
}

export const useNotificationStore = create<NotificationState>((set, get) => ({
  notifications: [],
  unreadCount: 0,
  isLoading: false,
  error: null,

  fetchNotifications: async () => {
    set({ isLoading: true, error: null })
    try {
      const notifications = await notificationService.getNotifications()
      const unreadCount = notifications.filter(n => !n.isRead).length
      set({ notifications, unreadCount, isLoading: false })
    } catch (error) {
      const message = error instanceof Error ? error.message : '알림을 불러오는데 실패했습니다.'
      set({ error: message, isLoading: false })
    }
  },

  fetchUnreadCount: async () => {
    try {
      const count = await notificationService.getUnreadCount()
      set({ unreadCount: count })
    } catch (error) {
      console.error('Failed to fetch unread count:', error)
    }
  },

  markAsRead: async (notificationId: string) => {
    try {
      await notificationService.markAsRead(notificationId)
      set({
        notifications: get().notifications.map(n =>
          n.id === notificationId ? { ...n, isRead: true } : n
        ),
        unreadCount: Math.max(0, get().unreadCount - 1),
      })
    } catch (error) {
      console.error('Failed to mark as read:', error)
    }
  },

  markAllAsRead: async () => {
    try {
      await notificationService.markAllAsRead()
      set({
        notifications: get().notifications.map(n => ({ ...n, isRead: true })),
        unreadCount: 0,
      })
    } catch (error) {
      console.error('Failed to mark all as read:', error)
    }
  },
}))
