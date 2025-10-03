import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import connectDB from '@/config/database';
import { OTP } from '@/database/models/OTP';
import { User } from '@/database/models/User';
import { generateOTP, sendOTPEmail } from '@/lib/email';

const sendOTPSchema = z.object({
  email: z.string().email('Invalid email address'),
  type: z.enum(['registration', 'password-reset']),
});

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    // Проверяем наличие переменных окружения для email
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      console.error('EMAIL_USER or EMAIL_PASS not configured');
      return NextResponse.json(
        { 
          success: false, 
          error: 'Email service not configured. Please set EMAIL_USER and EMAIL_PASS environment variables.' 
        },
        { status: 500 }
      );
    }

    const body = await request.json();
    const validationResult = sendOTPSchema.safeParse(body);

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

    const { email, type } = validationResult.data;

    // Проверяем существование пользователя в зависимости от типа
    if (type === 'registration') {
      const existingUser = await User.findOne({ email });
      if (existingUser && existingUser.verification.email) {
        return NextResponse.json(
          { success: false, error: 'User already exists and verified' },
          { status: 400 }
        );
      }
    } else if (type === 'password-reset') {
      const existingUser = await User.findOne({ email });
      if (!existingUser) {
        return NextResponse.json(
          { success: false, error: 'User not found' },
          { status: 404 }
        );
      }
    }

    // Удаляем старые OTP коды для этого email и типа
    await OTP.deleteMany({ email, type });

    // Генерируем новый OTP код
    const otpCode = generateOTP();

    // Сохраняем OTP в базе данных
    const otp = new OTP({
      email,
      code: otpCode,
      type,
    });

    await otp.save();

    // Отправляем OTP на email
    await sendOTPEmail(email, otpCode, type);

    return NextResponse.json(
      { 
        success: true, 
        message: 'OTP code sent successfully',
        data: {
          email,
          type,
          expiresIn: 600, // 10 минут в секундах
        }
      },
      { status: 200 }
    );

  } catch (error) {
    console.error('Send OTP error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
