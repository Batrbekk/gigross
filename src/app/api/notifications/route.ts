import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/middleware';
import { Notification } from '@/database/models/Notification';
import connectDB from '@/config/database';
import { NotificationStatus } from '@/types';

// GET /api/notifications - Получить уведомления пользователя
export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const authResult = await requireAuth(request);
    if (!authResult.success) {
      return authResult.response;
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') as NotificationStatus || 'all';
    const limit = parseInt(searchParams.get('limit') || '20');
    const page = parseInt(searchParams.get('page') || '1');

    // Построение запроса
    const query: any = { userId: authResult.userId };
    if (status !== 'all') {
      query.status = status;
    }

    // Подсчет общего количества
    const total = await Notification.countDocuments(query);
    const totalPages = Math.ceil(total / limit);

    // Получение уведомлений
    const notifications = await Notification.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .exec();

    return NextResponse.json(
      {
        success: true,
        data: {
          data: notifications,
          pagination: {
            page,
            limit,
            total,
            totalPages,
          },
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Get notifications error:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
      },
      { status: 500 }
    );
  }
}

// POST /api/notifications/mark-read - Отметить уведомления как прочитанные
export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const authResult = await requireAuth(request);
    if (!authResult.success) {
      return authResult.response;
    }

    const body = await request.json();
    const { notificationIds } = body;

    if (!notificationIds || !Array.isArray(notificationIds)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Notification IDs array is required',
        },
        { status: 400 }
      );
    }

    // Обновляем статус уведомлений
    await Notification.updateMany(
      {
        _id: { $in: notificationIds },
        userId: authResult.userId,
        status: NotificationStatus.UNREAD,
      },
      {
        $set: {
          status: NotificationStatus.READ,
          readAt: new Date(),
        },
      }
    );

    return NextResponse.json(
      {
        success: true,
        message: 'Notifications marked as read',
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Mark notifications as read error:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
      },
      { status: 500 }
    );
  }
}