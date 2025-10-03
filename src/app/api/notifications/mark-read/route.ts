import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/middleware';
import { Notification } from '@/database/models/Notification';
import connectDB from '@/config/database';

// PUT /api/notifications/mark-read - Отметить уведомления как прочитанные
export async function PUT(request: NextRequest) {
  try {
    await connectDB();

    const authResult = await requireAuth(request);
    if (!authResult.success) {
      return authResult.response;
    }

    const userId = authResult.userId;
    const body = await request.json();

    let updateResult;

    if (body.notificationIds && Array.isArray(body.notificationIds)) {
      // Отметить конкретные уведомления
      updateResult = await Notification.updateMany(
        {
          _id: { $in: body.notificationIds },
          userId: userId,
        },
        { read: true }
      );
    } else if (body.markAllAsRead) {
      // Отметить все уведомления как прочитанные
      updateResult = await Notification.updateMany(
        { userId: userId, read: false },
        { read: true }
      );
    } else {
      return NextResponse.json(
        {
          success: false,
          error: 'Either notificationIds array or markAllAsRead flag is required',
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        data: {
          modifiedCount: updateResult.modifiedCount,
          matchedCount: updateResult.matchedCount,
        },
        message: `${updateResult.modifiedCount} notifications marked as read`,
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
