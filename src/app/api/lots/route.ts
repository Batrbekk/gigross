import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, requireProducer } from '@/lib/auth/middleware';
import { createLotSchema, lotFiltersSchema } from '@/lib/validation/schemas';
import { Lot } from '@/database/models/Lot';
import { Product } from '@/database/models/Product';
import connectDB from '@/config/database';

// GET /api/lots - Получить список лотов с фильтрацией
export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const filters = Object.fromEntries(searchParams.entries());

    // Валидация фильтров
    const validationResult = lotFiltersSchema.safeParse(filters);
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

    const { page, limit, sortBy, sortOrder, category, producerId, excludeProducerId, minPrice, maxPrice, location, status, excludeStatus, auctionType } =
      validationResult.data;

    // Построение запроса
    const query: any = {};

    if (producerId && excludeProducerId) {
      // Если переданы оба параметра, исключаем исключаемого из списка
      query.producerId = { $in: [producerId], $ne: excludeProducerId };
    } else if (producerId) {
      query.producerId = producerId;
    } else if (excludeProducerId) {
      query.producerId = { $ne: excludeProducerId };
    }

    if (status) {
      query.status = status;
    }

    if (excludeStatus) {
      query.status = { $ne: excludeStatus };
    }

    if (auctionType) {
      query['auction.type'] = auctionType;
    }

    if (minPrice !== undefined || maxPrice !== undefined) {
      query.currentPrice = {};
      if (minPrice !== undefined) {
        query.currentPrice.$gte = minPrice;
      }
      if (maxPrice !== undefined) {
        query.currentPrice.$lte = maxPrice;
      }
    }

    if (location) {
      query.$or = [
        { 'location.city': { $regex: location, $options: 'i' } },
        { 'location.country': { $regex: location, $options: 'i' } },
      ];
    }

    // Подсчет общего количества
    const total = await Lot.countDocuments(query);
    const totalPages = Math.ceil(total / limit);

    // Построение сортировки
    const sort: any = {};
    if (sortBy) {
      sort[sortBy] = sortOrder === 'asc' ? 1 : -1;
    } else {
      sort.createdAt = -1;
    }

    // Получение лотов
    const lots = await Lot.find(query)
      .sort(sort)
      .skip((page - 1) * limit)
      .limit(limit)
      .populate('productId', 'name category images')
      .populate('producerId', 'profile.firstName profile.lastName profile.company')
      .exec();

    return NextResponse.json(
      {
        success: true,
        data: {
          data: lots,
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
    console.error('Get lots error:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
      },
      { status: 500 }
    );
  }
}

// POST /api/lots - Создать новый лот
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
    const validationResult = createLotSchema.safeParse(body);
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

    const lotData = validationResult.data;

    // Проверяем, что продукт существует и принадлежит пользователю
    const product = await Product.findById(lotData.productId);
    if (!product) {
      return NextResponse.json(
        {
          success: false,
          error: 'Product not found',
        },
        { status: 404 }
      );
    }

    if (product.producerId !== user.userId) {
      return NextResponse.json(
        {
          success: false,
          error: 'You can only create lots for your own products',
        },
        { status: 403 }
      );
    }

    // Создание лота
    const lotObject = {
      ...lotData,
      producerId: user.userId,
      currentPrice: lotData.startingPrice,
      auction: {
        ...lotData.auction,
        startDate: new Date(lotData.auction.startDate),
        endDate: new Date(lotData.auction.endDate),
      },
    };

    // Убираем coordinates если они не заданы
    if (!lotObject.location.coordinates) {
      delete (lotObject.location as any).coordinates;
    }

    const lot = new Lot(lotObject);

    await lot.save();

    return NextResponse.json(
      {
        success: true,
        data: lot,
        message: 'Lot created successfully',
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Create lot error:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
      },
      { status: 500 }
    );
  }
}
