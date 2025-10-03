import { NextRequest } from 'next/server';
import { authMiddleware } from '@/middleware/auth';

export function middleware(request: NextRequest) {
  // Применяем middleware аутентификации
  return authMiddleware(request);
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|public/).*)',
  ],
};
