import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/middleware';
import { paginationSchema } from '@/lib/validation/schemas';
import { Shipment } from '@/database/models/Shipment';
import connectDB from '@/config/database';
import { ShipmentStatus } from '@/types';

// GET /api/shipments - Получить список отгрузок пользователя
export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const authResult = await requireAuth(request);
    if (!authResult.success) {
      return authResult.response;
    }

    const { user } = authResult;
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

    // Построение запроса - показываем отгрузки где пользователь продавец или покупатель
    const query = {
      $or: [{ sellerId: user.userId }, { buyerId: user.userId }],
    };

    // Подсчет общего количества
    const total = await Shipment.countDocuments(query);
    const totalPages = Math.ceil(total / limit);

    // Построение сортировки
    const sort: any = {};
    if (sortBy) {
      sort[sortBy] = sortOrder === 'asc' ? 1 : -1;
    } else {
      sort.createdAt = -1;
    }

    // Получение отгрузок
    const shipments = await Shipment.find(query)
      .sort(sort)
      .skip((page - 1) * limit)
      .limit(limit)
      .populate('sellerId', 'profile.firstName profile.lastName profile.company')
      .populate('buyerId', 'profile.firstName profile.lastName profile.company')
      .populate('lotId', 'title')
      .exec();

    return NextResponse.json(
      {
        success: true,
        data: {
          data: shipments,
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
    console.error('Get shipments error:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
      },
      { status: 500 }
    );
  }
}

// POST /api/shipments - Создать новую отгрузку (только для продавцов)
export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const authResult = await requireAuth(request);
    if (!authResult.success) {
      return authResult.response;
    }

    const { user } = authResult;
    const body = await request.json();

    // Простая валидация (можно расширить)
    if (!body.lotId || !body.buyerId || !body.carrier || !body.estimatedDelivery) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required fields: lotId, buyerId, carrier, estimatedDelivery',
        },
        { status: 400 }
      );
    }

    // Генерируем трекинг номер
    const trackingNumber = `GIG${Date.now()}${Math.random().toString(36).substr(2, 4).toUpperCase()}`;

    // Создание отгрузки
    const shipment = new Shipment({
      lotId: body.lotId,
      sellerId: user.userId,
      buyerId: body.buyerId,
      trackingNumber,
      carrier: body.carrier,
      origin: body.origin || {
        street: 'ул. Производителя, 1',
        city: 'Москва',
        country: 'Россия',
        zipCode: '101000',
      },
      destination: body.destination,
      status: ShipmentStatus.PENDING,
      timeline: [
        {
          event: 'Отгрузка создана',
          timestamp: new Date(),
          location: 'Склад отправителя',
        },
      ],
      estimatedDelivery: new Date(body.estimatedDelivery),
      documents: body.documents || {},
    });

    await shipment.save();

    return NextResponse.json(
      {
        success: true,
        data: shipment,
        message: 'Shipment created successfully',
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Create shipment error:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
      },
      { status: 500 }
    );
  }
}
