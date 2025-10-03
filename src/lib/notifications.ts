import { Notification } from '@/database/models/Notification';
import { NotificationType, NotificationStatus } from '@/types';
import connectDB from '@/config/database';

export interface CreateNotificationData {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  data?: Record<string, any>;
}

export async function createNotification(data: CreateNotificationData) {
  try {
    await connectDB();
    
    const notification = new Notification({
      ...data,
      status: NotificationStatus.UNREAD,
    });
    
    await notification.save();
    
    return notification;
  } catch (error) {
    console.error('Error creating notification:', error);
    throw error;
  }
}

export async function createCertificateNotification(
  userId: string,
  certificateTitle: string,
  status: 'approved' | 'rejected',
  notes?: string
) {
  const type = status === 'approved' ? NotificationType.CERTIFICATE_APPROVED : NotificationType.CERTIFICATE_REJECTED;
  const title = status === 'approved' ? 'Сертификат одобрен' : 'Сертификат отклонен';
  const message = status === 'approved' 
    ? `Ваш сертификат "${certificateTitle}" был одобрен и теперь доступен для использования.`
    : `Ваш сертификат "${certificateTitle}" был отклонен.${notes ? ` Причина: ${notes}` : ''}`;

  return createNotification({
    userId,
    type,
    title,
    message,
    data: {
      certificateTitle,
      status,
      notes,
    },
  });
}

export async function createLotNotification(
  userId: string,
  lotTitle: string,
  status: 'activated' | 'deactivated'
) {
  const type = status === 'activated' ? NotificationType.LOT_ACTIVATED : NotificationType.LOT_DEACTIVATED;
  const title = status === 'activated' ? 'Лот активирован' : 'Лот деактивирован';
  const message = status === 'activated'
    ? `Ваш лот "${lotTitle}" был активирован и теперь доступен для участия в торгах.`
    : `Ваш лот "${lotTitle}" был деактивирован и больше не доступен для участия в торгах.`;

  return createNotification({
    userId,
    type,
    title,
    message,
    data: {
      lotTitle,
      status,
    },
  });
}
