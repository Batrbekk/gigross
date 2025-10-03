import { NextRequest, NextResponse } from 'next/server';
import { loginSchema } from '@/lib/validation/schemas';
import { comparePassword } from '@/lib/auth/password';
import { generateTokenPair } from '@/lib/auth/jwt';
import { User } from '@/database/models/User';
import connectDB from '@/config/database';

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const body = await request.json();

    // Валидация входных данных
    const validationResult = loginSchema.safeParse(body);
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

    const { email, password } = validationResult.data;

    // Ищем пользователя по email
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid email or password',
        },
        { status: 401 }
      );
    }

    // Проверяем пароль
    const isPasswordValid = await comparePassword(password, user.password);
    if (!isPasswordValid) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid email or password',
        },
        { status: 401 }
      );
    }

    // Проверяем, подтвержден ли email
    if (!user.verification.email) {
      return NextResponse.json(
        {
          success: false,
          error: 'Email not verified',
          data: {
            email: user.email,
            requiresVerification: true,
          },
        },
        { status: 403 }
      );
    }

    // Обновляем время последнего входа
    user.lastLogin = new Date();
    await user.save();

    // Генерируем токены
    const tokens = generateTokenPair({
      _id: user._id.toString(),
      email: user.email,
      role: user.role,
    });

    // Возвращаем пользователя без пароля и токены
    const userResponse = user.toJSON();
    delete userResponse.password;

    const response = NextResponse.json(
      {
        success: true,
        data: {
          user: userResponse,
          tokens,
        },
        message: 'Login successful',
      },
      { status: 200 }
    );

    // Устанавливаем refresh token в httpOnly cookie
    response.cookies.set('refreshToken', tokens.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 30 * 24 * 60 * 60, // 30 дней
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('Login error:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
      },
      { status: 500 }
    );
  }
}
