import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import connectDB from '@/config/database';
import { OTP } from '@/database/models/OTP';
import { User } from '@/database/models/User';
import { generateAccessToken, generateRefreshToken } from '@/lib/auth/jwt';

const verifyOTPSchema = z.object({
  email: z.string().email('Invalid email address'),
  code: z.string().length(6, 'OTP code must be 6 digits'),
  type: z.enum(['registration', 'password-reset']),
});

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const body = await request.json();
    const validationResult = verifyOTPSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Invalid request data', 
          details: validationResult.error.issues 
        },
        { status: 400 }
      );
    }

    const { email, code, type } = validationResult.data;

    // Находим OTP код
    const otpRecord = await OTP.findOne({ 
      email, 
      code, 
      type, 
      verified: false,
      expiresAt: { $gt: new Date() }
    });

    if (!otpRecord) {
      return NextResponse.json(
        { success: false, error: 'Invalid or expired OTP code' },
        { status: 400 }
      );
    }

    // Отмечаем OTP как использованный
    otpRecord.verified = true;
    await otpRecord.save();

    if (type === 'registration') {
      // Для регистрации - подтверждаем email пользователя
      const user = await User.findOne({ email });
      if (!user) {
        return NextResponse.json(
          { success: false, error: 'User not found' },
          { status: 404 }
        );
      }

      // Подтверждаем email
      user.verification.email = true;
      await user.save();

      // Генерируем токены для автоматической авторизации
      const accessToken = generateAccessToken({
        _id: user._id.toString(),
        email: user.email,
        role: user.role,
      });

      const refreshToken = generateRefreshToken(user._id.toString());

      // Устанавливаем refresh token в httpOnly cookie
      const response = NextResponse.json(
        {
          success: true,
          message: 'Email verified successfully',
          data: {
            user: {
              id: user._id.toString(),
              email: user.email,
              role: user.role,
              profile: user.profile,
              preferences: user.preferences,
              verification: user.verification,
              createdAt: user.createdAt,
              updatedAt: user.updatedAt,
            },
            accessToken,
          },
        },
        { status: 200 }
      );

      response.cookies.set('refreshToken', refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 дней
        path: '/',
      });

      return response;

    } else if (type === 'password-reset') {
      // Для сброса пароля - возвращаем токен для смены пароля
      return NextResponse.json(
        {
          success: true,
          message: 'OTP verified successfully',
          data: {
            email,
            resetToken: (otpRecord._id as string).toString(), // Используем ID OTP как токен сброса
          },
        },
        { status: 200 }
      );
    }

  } catch (error) {
    console.error('Verify OTP error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
