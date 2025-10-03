import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/middleware';
import { paginationSchema } from '@/lib/validation/schemas';
import { Certificate } from '@/database/models/Certificate';
import connectDB from '@/config/database';
import { UserRole } from '@/types';

// GET /api/admin/certificates - Получить все сертификаты для модерации
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

    const { searchParams } = new URL(request.url);
    const filters = Object.fromEntries(searchParams.entries());

    // Валидация пагинации
    const validationResult = paginationSchema.safeParse(filters);
    if (!validationResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid pagination parameters',
          details: validationResult.error.issues,
        },
        { status: 400 }
      );
    }

    const { page, limit, sortBy, sortOrder } = validationResult.data;

    // Построение запроса
    const query: Record<string, unknown> = {};

    // Фильтр по статусу
    if (filters.status) {
      query.status = filters.status;
    }

    // Подсчет общего количества
    const total = await Certificate.countDocuments(query);
    const totalPages = Math.ceil(total / limit);

    // Построение сортировки
    const sort: Record<string, 1 | -1> = {};
    if (sortBy) {
      sort[sortBy] = sortOrder === 'asc' ? 1 : -1;
    } else {
      sort.createdAt = -1;
    }

    // Получение сертификатов с информацией о пользователе
    const certificates = await Certificate.find(query)
      .sort(sort)
      .skip((page - 1) * limit)
      .limit(limit)
      .populate('userId', 'email profile.firstName profile.lastName profile.company')
      .exec();

    return NextResponse.json(
      {
        success: true,
        data: {
          data: certificates,
          pagination: {
            page,
            limit,
            total,
            totalPages,
          },
        },
      },
      { status: 200 }
    );
  } catch (error) {
    // Log error for debugging purposes
    
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
      },
      { status: 500 }
    );
  }
}
