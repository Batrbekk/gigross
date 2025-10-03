import { NextRequest, NextResponse } from 'next/server';

// Публичные маршруты, которые не требуют аутентификации
// const PUBLIC_ROUTES = ['/'];

// API маршруты, которые не требуют аутентификации
const PUBLIC_API_ROUTES = ['/api/auth/', '/api/health'];

// Защищенные маршруты, которые требуют аутентификации
const PROTECTED_ROUTES = ['/dashboard', '/auction'];

export function authMiddleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Получаем данные авторизации из cookie
  const authStorage = request.cookies.get('auth-storage')?.value;
  
  let isAuthenticated = false;
  let user = null;
  
  if (authStorage) {
    try {
      // Декодируем URL-encoded cookie
      const decodedAuthStorage = decodeURIComponent(authStorage);
      const parsed = JSON.parse(decodedAuthStorage);
      isAuthenticated = parsed?.state?.isAuthenticated || false;
      user = parsed?.state?.user || null;
      
      // Дополнительная проверка: пользователь должен иметь ID
      if (isAuthenticated && user && !user._id && !user.id) {
        isAuthenticated = false;
        user = null;
      }
    } catch {
      // Игнорируем ошибки парсинга
    }
  }

  // Проверяем API маршруты
  const isPublicApiRoute = PUBLIC_API_ROUTES.some(route => pathname.startsWith(route));
  if (pathname.startsWith('/api/') && isPublicApiRoute) {
    return NextResponse.next();
  }

  // Определяем защищенные и публичные маршруты
  const isProtectedRoute = PROTECTED_ROUTES.some(route => pathname.startsWith(route));
  const isPublicRoute = pathname === '/' || pathname.startsWith('/login') || pathname.startsWith('/register');

  // Если пользователь авторизован и на публичной странице (кроме API)
  if (isAuthenticated && user && isPublicRoute && !pathname.startsWith('/api/')) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  // Если пользователь не авторизован и пытается попасть на защищенную страницу
  if (isProtectedRoute && !isAuthenticated) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  return NextResponse.next();
}
