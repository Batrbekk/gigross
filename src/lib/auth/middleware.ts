import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';

interface AuthResult {
  success: boolean;
  userId?: string;
  userRole?: string;
  response?: NextResponse;
}

interface ProducerAuthResult {
  success: boolean;
  user?: { userId: string };
  response?: NextResponse;
}

export async function requireAuth(request: NextRequest): Promise<AuthResult> {
  try {
    const authHeader = request.headers.get('authorization');
    
    console.log('Auth middleware - Authorization header:', authHeader ? authHeader.substring(0, 20) + '...' : 'No header');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('Auth middleware - No valid authorization header');
      return {
        success: false,
        response: NextResponse.json(
          { success: false, error: 'Токен доступа не предоставлен' },
          { status: 401 }
        ),
      };
    }

    const token = authHeader.substring(7); // Убираем "Bearer " из начала
    console.log('Auth middleware - Token extracted:', token.substring(0, 20) + '...');

    if (!process.env.JWT_SECRET) {
      console.error('JWT_SECRET не установлен');
      return {
        success: false,
        response: NextResponse.json(
          { success: false, error: 'Ошибка конфигурации сервера' },
          { status: 500 }
        ),
      };
    }

    console.log('Auth middleware - Verifying token with secret...');
    const decoded = jwt.verify(token, process.env.JWT_SECRET) as { userId: string; role?: string };
    console.log('Auth middleware - Token verified successfully:', { userId: decoded.userId, role: decoded.role });

    return {
      success: true,
      userId: decoded.userId,
      userRole: decoded.role,
    };
  } catch (error) {
    console.error('Auth middleware error:', error);
    
    if (error instanceof jwt.JsonWebTokenError) {
      console.log('Auth middleware - Invalid token error');
      return {
        success: false,
        response: NextResponse.json(
          { success: false, error: 'Недействительный токен' },
          { status: 401 }
        ),
      };
    }

    if (error instanceof jwt.TokenExpiredError) {
      console.log('Auth middleware - Token expired error');
      return {
        success: false,
        response: NextResponse.json(
          { success: false, error: 'Токен истек' },
          { status: 401 }
        ),
      };
    }

    console.log('Auth middleware - General auth error');
    return {
      success: false,
      response: NextResponse.json(
        { success: false, error: 'Ошибка аутентификации' },
        { status: 401 }
      ),
    };
  }
}

export async function requireProducer(request: NextRequest): Promise<ProducerAuthResult> {
  const authResult = await requireAuth(request);
  
  if (!authResult.success) {
    return {
      success: false,
      response: authResult.response,
    };
  }

  return {
    success: true,
    user: { userId: authResult.userId! },
  };
}

export async function requireAdmin(request: NextRequest): Promise<AuthResult> {
  const authResult = await requireAuth(request);
  
  if (!authResult.success) {
    return authResult;
  }

  // Здесь можно добавить проверку роли администратора
  // Пока что просто возвращаем успешный результат
  return authResult;
}

export async function requireOwnership(request: NextRequest, _resourceId: string, _resourceType: 'product' | 'lot'): Promise<AuthResult> {
  const authResult = await requireAuth(request);
  
  if (!authResult.success) {
    return authResult;
  }

  // Здесь можно добавить проверку владения ресурсом
  // Пока что просто возвращаем успешный результат
  return authResult;
}