import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/middleware';
import { User } from '@/database/models/User';
import connectDB from '@/config/database';
import { UserRole } from '@/types';

// DELETE /api/admin/test-users/cleanup - Удалить всех тестовых пользователей
export async function DELETE(request: NextRequest) {
  try {
    await connectDB();

    const authResult = await requireAuth(request);
    if (!authResult.success) {
      return authResult.response;
    }

    // Проверяем, что пользователь - админ
    if (authResult.userRole !== UserRole.ADMIN) {
      return NextResponse.json(
        {
          success: false,
          error: 'Access denied. Admin role required.',
        },
        { status: 403 }
      );
    }

    // Удаляем тестовых пользователей
    const result = await User.deleteMany({
      email: { $in: ['producer@test.com', 'distributor@test.com', 'investor@test.com', 'admin@test.com'] }
    });

    return NextResponse.json(
      {
        success: true,
        data: {
          deletedCount: result.deletedCount,
        },
        message: `Удалено ${result.deletedCount} тестовых пользователей`,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Delete test users error:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
      },
      { status: 500 }
    );
  }
}
