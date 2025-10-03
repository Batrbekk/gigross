import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/middleware';
import { User } from '@/database/models/User';
import connectDB from '@/config/database';
import { UserRole } from '@/types';

// POST /api/admin/verify-users - Верифицировать тестовых пользователей
export async function POST(request: NextRequest) {
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

    // Тестовые email адреса
    const testEmails = [
      'producer@test.com',
      'distributor@test.com',
      'investor@test.com',
      'admin@test.com'
    ];

    // Находим тестовых пользователей
    const testUsers = await User.find({ email: { $in: testEmails } });
    
    if (testUsers.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'Тестовые пользователи не найдены',
        },
        { status: 404 }
      );
    }

    // Верифицируем каждого пользователя
    const verifiedUsers = [];
    const errors = [];

    for (const user of testUsers) {
      try {
        user.isVerified = true;
        user.isActive = true;
        user.verifiedAt = new Date();
        
        await user.save();
        
        verifiedUsers.push({
          id: user._id,
          email: user.email,
          role: user.role,
          name: `${user.profile.firstName} ${user.profile.lastName}`,
        });
      } catch (error) {
        console.error(`Error verifying user ${user.email}:`, error);
        errors.push(`Ошибка верификации пользователя ${user.email}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    return NextResponse.json(
      {
        success: true,
        data: {
          verified: verifiedUsers,
          errors: errors,
          total: testUsers.length,
          successful: verifiedUsers.length,
        },
        message: `Верифицировано ${verifiedUsers.length} из ${testUsers.length} тестовых пользователей`,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Verify users error:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
      },
      { status: 500 }
    );
  }
}
