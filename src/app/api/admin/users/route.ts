import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth/middleware';
import { paginationSchema } from '@/lib/validation/schemas';
import { User } from '@/database/models/User';
import connectDB from '@/config/database';

// GET /api/admin/users - Получить список всех пользователей (только для админов)
export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const authResult = await requireAdmin(request);
    if (!authResult.success) {
      return authResult.response;
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

    // Фильтр по роли
    if (filters.role) {
      query.role = filters.role;
    }

    // Фильтр по статусу верификации
    if (filters.verified !== undefined) {
      query['verification.email'] = filters.verified === 'true';
    }

    // Поиск по email или имени
    if (filters.search) {
      query.$or = [
        { email: { $regex: filters.search, $options: 'i' } },
        { 'profile.firstName': { $regex: filters.search, $options: 'i' } },
        { 'profile.lastName': { $regex: filters.search, $options: 'i' } },
        { 'profile.company': { $regex: filters.search, $options: 'i' } },
      ];
    }

    // Подсчет общего количества
    const total = await User.countDocuments(query);
    const totalPages = Math.ceil(total / limit);

    // Построение сортировки
    const sort: Record<string, 1 | -1> = {};
    if (sortBy) {
      sort[sortBy] = sortOrder === 'asc' ? 1 : -1;
    } else {
      sort.createdAt = -1;
    }

    // Получение пользователей (без паролей)
    const users = await User.find(query)
      .select('-password')
      .sort(sort)
      .skip((page - 1) * limit)
      .limit(limit)
      .exec();

    // Статистика по ролям
    const roleStats = await User.aggregate([
      { $group: { _id: '$role', count: { $sum: 1 } } },
    ]);

    return NextResponse.json(
      {
        success: true,
        data: {
          data: users,
          pagination: {
            page,
            limit,
            total,
            totalPages,
          },
          statistics: {
            totalUsers: total,
            roleDistribution: roleStats.reduce((acc, stat) => {
              acc[stat._id] = stat.count;
              return acc;
            }, {}),
          },
        },
      },
      { status: 200 }
    );
  } catch {
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
