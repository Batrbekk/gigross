import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import connectDB from '@/config/database';
import { OTP } from '@/database/models/OTP';
import { User } from '@/database/models/User';
import { hashPassword } from '@/lib/auth/password';
import { sendPasswordChangeNotification } from '@/lib/email';

const resetPasswordSchema = z.object({
  resetToken: z.string().min(1, 'Reset token is required'),
  newPassword: z.string().min(8, 'Password must be at least 8 characters'),
});

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const body = await request.json();
    const validationResult = resetPasswordSchema.safeParse(body);

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

    const { resetToken, newPassword } = validationResult.data;

    // Находим OTP запись по ID (resetToken)
    const otpRecord = await OTP.findById(resetToken);

    if (!otpRecord || otpRecord.type !== 'password-reset' || !otpRecord.verified) {
      return NextResponse.json(
        { success: false, error: 'Invalid or expired reset token' },
        { status: 400 }
      );
    }

    // Находим пользователя
    const user = await User.findOne({ email: otpRecord.email });
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    // Хешируем новый пароль
    const hashedPassword = await hashPassword(newPassword);

    // Обновляем пароль пользователя
    user.password = hashedPassword;
    await user.save();

    // Удаляем использованный OTP
    await OTP.findByIdAndDelete(resetToken);

    // Отправляем уведомление на почту
    try {
      const userName = user.profile?.firstName && user.profile?.lastName 
        ? `${user.profile.firstName} ${user.profile.lastName}`
        : undefined;
      await sendPasswordChangeNotification(user.email, userName);
    } catch (emailError) {
      // Логируем ошибку отправки email, но не прерываем процесс
      console.error('Failed to send password change notification:', emailError);
    }

    return NextResponse.json(
      {
        success: true,
        message: 'Password reset successfully',
      },
      { status: 200 }
    );

  } catch (error) {
    console.error('Reset password error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
