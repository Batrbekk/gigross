import { NextRequest, NextResponse } from 'next/server';
import { registerSchema } from '@/lib/validation/schemas';
import { hashPassword } from '@/lib/auth/password';
import { User } from '@/database/models/User';
import connectDB from '@/config/database';

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const body = await request.json();

    // Валидация входных данных
    const validationResult = registerSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Validation failed',
          details: validationResult.error.issues,
        },
        { status: 400 }
      );
    }

    const { email, password, role, profile } = validationResult.data;

    // Проверяем, существует ли пользователь с таким email
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return NextResponse.json(
        {
          success: false,
          error: 'User with this email already exists',
        },
        { status: 409 }
      );
    }

    // Хешируем пароль
    const hashedPassword = await hashPassword(password);

    // Создаем пользователя
    const user = new User({
      email,
      password: hashedPassword,
      role,
      profile,
      verification: {
        email: false,
        identity: false,
        business: false,
      },
      preferences: {
        notifications: true,
        language: 'ru',
        currency: 'KZT',
      },
    });

    await user.save();

    // Возвращаем успешный ответ без токенов
    // Пользователь должен подтвердить email через OTP
    return NextResponse.json(
      {
        success: true,
        message: 'User registered successfully. Please verify your email.',
        data: {
          email: user.email,
          requiresVerification: true,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Registration error:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
      },
      { status: 500 }
    );
  }
}
