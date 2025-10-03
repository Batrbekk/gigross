import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, requireProducer } from '@/lib/auth/middleware';
import { createProductSchema, productFiltersSchema } from '@/lib/validation/schemas';
import { Product } from '@/database/models/Product';
import connectDB from '@/config/database';

// GET /api/products - Получить список продуктов с фильтрацией
export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const filters = Object.fromEntries(searchParams.entries());

    // Валидация фильтров
    const validationResult = productFiltersSchema.safeParse(filters);
    if (!validationResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid filters',
          details: validationResult.error.issues,
        },
        { status: 400 }
      );
    }

    const { page, limit, sortBy, sortOrder, category, producerId, status, certificationStatus } =
      validationResult.data;

    // Построение запроса
    const query: any = {};

    if (category) {
      query.category = { $regex: category, $options: 'i' };
    }

    if (producerId) {
      if (producerId === 'me') {
        // Если producerId=me, нужно получить ID текущего пользователя
        const authResult = await requireAuth(request);
        if (!authResult.success) {
          return authResult.response;
        }
        query.producerId = authResult.userId;
      } else {
        query.producerId = producerId;
      }
    }

    if (status) {
      query.status = status;
    }

    if (certificationStatus) {
      query.certificationStatus = certificationStatus;
    }

    // Подсчет общего количества
    const total = await Product.countDocuments(query);
    const totalPages = Math.ceil(total / limit);

    // Построение сортировки
    const sort: any = {};
    if (sortBy) {
      sort[sortBy] = sortOrder === 'asc' ? 1 : -1;
    } else {
      sort.createdAt = -1;
    }

    // Получение продуктов
    const products = await Product.find(query)
      .sort(sort)
      .skip((page - 1) * limit)
      .limit(limit)
      .populate('producerId', 'profile.firstName profile.lastName profile.company')
      .exec();

    return NextResponse.json(
      {
        success: true,
        data: {
          data: products,
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
    console.error('Get products error:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
      },
      { status: 500 }
    );
  }
}

// POST /api/products - Создать новый продукт
export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const authResult = await requireProducer(request);
    if (!authResult.success) {
      return authResult.response;
    }

    const { user } = authResult;
    const body = await request.json();

    // Валидация входных данных
    const validationResult = createProductSchema.safeParse(body);
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

    const productData = validationResult.data;

    // Создание продукта
    const product = new Product({
      ...productData,
      producerId: user?.userId || '',
    });

    await product.save();

    // Популяция данных производителя
    await product.populate('producerId', 'profile.firstName profile.lastName profile.company');

    return NextResponse.json(
      {
        success: true,
        data: product,
        message: 'Product created successfully',
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Create product error:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
      },
      { status: 500 }
    );
  }
}
