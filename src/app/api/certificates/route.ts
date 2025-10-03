import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/middleware';
import { createCertificateSchema, paginationSchema } from '@/lib/validation/schemas';
import { Certificate } from '@/database/models/Certificate';
import connectDB from '@/config/database';
import { CertificateStatus } from '@/types';

// GET /api/certificates - Получить список сертификатов пользователя
export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const authResult = await requireAuth(request);
    if (!authResult.success) {
      return authResult.response;
    }

    const userId = authResult.userId;
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
    const query: any = { userId: userId };

    // Фильтр по статусу
    if (filters.status) {
      query.status = filters.status;
    }

    // Подсчет общего количества
    const total = await Certificate.countDocuments(query);
    const totalPages = Math.ceil(total / limit);

    // Построение сортировки
    const sort: any = {};
    if (sortBy) {
      sort[sortBy] = sortOrder === 'asc' ? 1 : -1;
    } else {
      sort.createdAt = -1;
    }

    // Получение сертификатов
    const certificates = await Certificate.find(query)
      .sort(sort)
      .skip((page - 1) * limit)
      .limit(limit)
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
    console.error('Get certificates error:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
      },
      { status: 500 }
    );
  }
}

// POST /api/certificates - Создать новый сертификат
export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const authResult = await requireAuth(request);
    if (!authResult.success) {
      return authResult.response;
    }

    const userId = authResult.userId;
    const body = await request.json();

    // Валидация входных данных
    const validationResult = createCertificateSchema.safeParse(body);
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

    const certificateData = validationResult.data;

    // Создание сертификата
    const certificate = new Certificate({
      ...certificateData,
      userId: userId,
      issueDate: new Date(certificateData.issueDate),
      expiryDate: new Date(certificateData.expiryDate),
      status: CertificateStatus.PENDING,
    });

    await certificate.save();

    return NextResponse.json(
      {
        success: true,
        data: certificate,
        message: 'Certificate created successfully',
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Create certificate error:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
      },
      { status: 500 }
    );
  }
}
