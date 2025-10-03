import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/middleware';
import { Bid } from '@/database/models/Bid';
import { Lot } from '@/database/models/Lot';
import connectDB from '@/config/database';
import { UserRole } from '@/types';

// GET /api/deliveries - Получить доставки пользователя
export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const authResult = await requireAuth(request);
    if (!authResult.success) {
      return authResult.response;
    }

    // Проверяем, что пользователь - дистрибьютор или инвестор
    if (!authResult.userRole || ![UserRole.DISTRIBUTOR, UserRole.INVESTOR].includes(authResult.userRole as UserRole)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Access denied. Distributor or Investor role required.',
        },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || 'all';
    const sort = searchParams.get('sort') || 'newest';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    // Находим выигранные ставки пользователя (покупки)
    const query: any = { 
      bidderId: authResult.userId,
      isWinning: true,
      status: 'active'
    };

    // Поиск по названию лота
    if (search) {
      const lots = await Lot.find({ 
        title: { $regex: search, $options: 'i' } 
      }).select('_id');
      const lotIds = lots.map(lot => lot._id);
      query.lotId = { $in: lotIds };
    }

    // Сортировка
    let sortOptions: any = {};
    switch (sort) {
      case 'newest':
        sortOptions = { createdAt: -1 };
        break;
      case 'oldest':
        sortOptions = { createdAt: 1 };
        break;
      case 'delivery_date':
        sortOptions = { createdAt: -1 }; // Сортируем по дате создания ставки
        break;
      case 'status':
        sortOptions = { status: 1 };
        break;
      default:
        sortOptions = { createdAt: -1 };
    }

    // Получение покупок с пагинацией
    const bids = await Bid.find(query)
      .populate({
        path: 'lotId',
        populate: {
          path: 'producerId',
          select: 'profile.firstName profile.lastName profile.company'
        }
      })
      .populate({
        path: 'lotId',
        populate: {
          path: 'productId',
          select: 'name images'
        }
      })
      .sort(sortOptions)
      .skip((page - 1) * limit)
      .limit(limit)
      .exec();

    // Преобразуем ставки в формат доставок
    const deliveries = bids.map((bid, index) => {
      // Генерируем случайный статус доставки для демонстрации
      const deliveryStatuses = ['preparing', 'shipped', 'in_transit', 'delivered'];
      const randomStatus = deliveryStatuses[Math.floor(Math.random() * deliveryStatuses.length)];
      
      // Генерируем номер отслеживания
      const trackingNumber = `TRK${Date.now()}${index.toString().padStart(3, '0')}`;
      
      // Генерируем перевозчика
      const carriers = ['DHL', 'FedEx', 'UPS', 'Kazpost', 'СДЭК'];
      const randomCarrier = carriers[Math.floor(Math.random() * carriers.length)];
      
      return {
        _id: `delivery_${bid._id}`,
        purchaseId: bid._id,
        lotId: bid.lotId,
        status: randomStatus,
        trackingNumber: trackingNumber,
        carrier: randomCarrier,
        shippingAddress: {
          street: 'Улица Абая, 150',
          city: 'Алматы',
          postalCode: '050000',
          country: 'Казахстан',
          contactName: 'Иван Иванов',
          contactPhone: '+7 777 123 4567',
        },
        estimatedDelivery: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // +7 дней
        actualDelivery: randomStatus === 'delivered' ? new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString() : undefined,
        deliveryNotes: randomStatus === 'delivered' ? 'Доставлено успешно' : undefined,
        createdAt: bid.createdAt,
        updatedAt: bid.updatedAt,
      };
    });

    // Фильтрация по статусу (если нужно)
    let filteredDeliveries = deliveries;
    if (status !== 'all') {
      filteredDeliveries = deliveries.filter(delivery => delivery.status === status);
    }

    return NextResponse.json(
      {
        success: true,
        data: filteredDeliveries,
        pagination: {
          page,
          limit,
          total: filteredDeliveries.length,
          totalPages: Math.ceil(filteredDeliveries.length / limit),
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Get deliveries error:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
      },
      { status: 500 }
    );
  }
}
