import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/middleware';
import { User } from '@/database/models/User';
import connectDB from '@/config/database';
import { UserRole } from '@/types';
import { hashPassword } from '@/lib/auth/password';

// POST /api/admin/test-users - Создать тестовых пользователей
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

    // Тестовые пользователи для каждой роли
    const testUsers = [
      {
        email: 'producer@test.com',
        password: 'password123',
        role: UserRole.PRODUCER,
        profile: {
          firstName: 'Иван',
          lastName: 'Производитель',
          phone: '+7 777 123 4567',
          company: 'ООО "Тестовые продукты"',
          position: 'Директор',
        },
        preferences: {
          currency: 'KZT',
          language: 'ru',
          notifications: {
            email: true,
            push: true,
            sms: false,
          },
        },
        isVerified: true,
        isActive: true,
      },
      {
        email: 'distributor@test.com',
        password: 'password123',
        role: UserRole.DISTRIBUTOR,
        profile: {
          firstName: 'Мария',
          lastName: 'Дистрибьютор',
          phone: '+7 777 234 5678',
          company: 'ИП "Оптовые поставки"',
          position: 'Менеджер по закупкам',
        },
        preferences: {
          currency: 'KZT',
          language: 'ru',
          notifications: {
            email: true,
            push: true,
            sms: false,
          },
        },
        isVerified: true,
        isActive: true,
      },
      {
        email: 'investor@test.com',
        password: 'password123',
        role: UserRole.INVESTOR,
        profile: {
          firstName: 'Алексей',
          lastName: 'Инвестор',
          phone: '+7 777 345 6789',
          company: 'ООО "Инвестиционная компания"',
          position: 'Инвестиционный менеджер',
        },
        preferences: {
          currency: 'KZT',
          language: 'ru',
          notifications: {
            email: true,
            push: true,
            sms: false,
          },
        },
        isVerified: true,
        isActive: true,
      },
      {
        email: 'admin@test.com',
        password: 'password123',
        role: UserRole.ADMIN,
        profile: {
          firstName: 'Админ',
          lastName: 'Администратор',
          phone: '+7 777 456 7890',
          company: 'Gigross.com',
          position: 'Системный администратор',
        },
        preferences: {
          currency: 'KZT',
          language: 'ru',
          notifications: {
            email: true,
            push: true,
            sms: false,
          },
        },
        isVerified: true,
        isActive: true,
      },
    ];

    const createdUsers = [];
    const errors = [];

    for (const userData of testUsers) {
      try {
        // Проверяем, существует ли пользователь
        const existingUser = await User.findOne({ email: userData.email });
        if (existingUser) {
          errors.push(`Пользователь ${userData.email} уже существует`);
          continue;
        }

        // Хешируем пароль
        const hashedPassword = await hashPassword(userData.password);

        // Создаем пользователя
        const user = new User({
          ...userData,
          password: hashedPassword,
        });

        await user.save();
        createdUsers.push({
          id: user._id,
          email: user.email,
          role: user.role,
          name: `${user.profile.firstName} ${user.profile.lastName}`,
        });
      } catch (error) {
        console.error(`Error creating user ${userData.email}:`, error);
        errors.push(`Ошибка создания пользователя ${userData.email}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    return NextResponse.json(
      {
        success: true,
        data: {
          created: createdUsers,
          errors: errors,
          total: testUsers.length,
          successful: createdUsers.length,
        },
        message: `Создано ${createdUsers.length} из ${testUsers.length} тестовых пользователей`,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Create test users error:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
      },
      { status: 500 }
    );
  }
}

// GET /api/admin/test-users - Получить список тестовых пользователей
export async function GET(request: NextRequest) {
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

    // Получаем тестовых пользователей
    const testUsers = await User.find({
      email: { $in: ['producer@test.com', 'distributor@test.com', 'investor@test.com', 'admin@test.com'] }
    }).select('_id email role profile.firstName profile.lastName isVerified isActive createdAt');

    return NextResponse.json(
      {
        success: true,
        data: testUsers,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Get test users error:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
      },
      { status: 500 }
    );
  }
}
