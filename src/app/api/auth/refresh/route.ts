import { NextRequest, NextResponse } from 'next/server';
import { verifyRefreshToken, generateAccessToken } from '@/lib/auth/jwt';
import { User } from '@/database/models/User';
import connectDB from '@/config/database';

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    // Получаем refresh token из body или cookie
    let refreshToken = request.cookies.get('refreshToken')?.value;
    
    if (!refreshToken) {
      // Пытаемся получить из body
      const body = await request.json();
      refreshToken = body.refreshToken;
    }

    console.log('Refresh API - refreshToken received:', refreshToken ? refreshToken.substring(0, 20) + '...' : 'No token');

    if (!refreshToken) {
      return NextResponse.json(
        {
          success: false,
          error: 'Refresh token not found',
        },
        { status: 401 }
      );
    }

    // Верифицируем refresh token
    console.log('Refresh API - verifying refresh token...');
    const { userId } = verifyRefreshToken(refreshToken);
    console.log('Refresh API - userId from token:', userId);

    // Ищем пользователя
    const user = await User.findById(userId);
    if (!user) {
      console.log('Refresh API - user not found:', userId);
      return NextResponse.json(
        {
          success: false,
          error: 'User not found',
        },
        { status: 404 }
      );
    }

    console.log('Refresh API - user found:', user.email, user.role);

    // Генерируем новый access token
    const accessToken = generateAccessToken({
      _id: user._id.toString(),
      email: user.email,
      role: user.role,
    });

    console.log('Refresh API - new access token generated:', accessToken.substring(0, 20) + '...');

    return NextResponse.json(
      {
        success: true,
        data: {
          accessToken,
        },
        message: 'Token refreshed successfully',
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Token refresh error:', error);

    // Если refresh token недействителен, очищаем cookie
    const response = NextResponse.json(
      {
        success: false,
        error: 'Invalid refresh token',
      },
      { status: 401 }
    );

    response.cookies.delete('refreshToken');

    return response;
  }
}
