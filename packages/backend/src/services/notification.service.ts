import prisma from '../lib/prisma.js';

export interface CreateNotificationInput {
  userId: string;
  type: string;
  title: string;
  message: string;
  link?: string;
}

export class NotificationService {
  /**
   * 알림 생성
   */
  async create(input: CreateNotificationInput) {
    return prisma.notification.create({
      data: {
        userId: input.userId,
        type: input.type,
        title: input.title,
        message: input.message,
        link: input.link,
        read: false,
      },
    });
  }

  /**
   * 알림 목록 조회
   */
  async getNotifications(userId: string, page = 1, pageSize = 20) {
    const [notifications, total, unreadCount] = await Promise.all([
      prisma.notification.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.notification.count({ where: { userId } }),
      prisma.notification.count({ where: { userId, read: false } }),
    ]);

    return {
      items: notifications.map(n => ({
        id: n.id,
        type: n.type,
        title: n.title,
        message: n.message,
        link: n.link,
        read: n.read,
        createdAt: n.createdAt,
      })),
      total,
      unreadCount,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  /**
   * 알림 읽음 처리
   */
  async markAsRead(notificationId: string, userId: string) {
    const notification = await prisma.notification.findUnique({
      where: { id: notificationId },
    });

    if (!notification || notification.userId !== userId) {
      return null;
    }

    return prisma.notification.update({
      where: { id: notificationId },
      data: { read: true },
    });
  }

  /**
   * 모든 알림 읽음 처리
   */
  async markAllAsRead(userId: string) {
    return prisma.notification.updateMany({
      where: { userId, read: false },
      data: { read: true },
    });
  }

  /**
   * 읽지 않은 알림 수
   */
  async getUnreadCount(userId: string): Promise<number> {
    return prisma.notification.count({
      where: { userId, read: false },
    });
  }
}

export const notificationService = new NotificationService();
