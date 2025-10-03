import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/middleware';
import { Bid } from '@/database/models/Bid';
import { Lot } from '@/database/models/Lot';
import connectDB from '@/config/database';
import { UserRole } from '@/types';

// GET /api/purchases - Получить покупки пользователя
export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const authResult = await requireAuth(request);
    if (!authResult.success) {
      return authResult.response;
    }

    // Проверяем, что пользователь - дистрибьютор или инвестор
    if (![UserRole.DISTRIBUTOR, UserRole.INVESTOR].includes(authResult.userRole)) {
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

    // Находим выигранные ставки пользователя
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
      case 'amount_high':
        sortOptions = { amount: -1 };
        break;
      case 'amount_low':
        sortOptions = { amount: 1 };
        break;
      default:
        sortOptions = { createdAt: -1 };
    }

    // Подсчет общего количества
    const total = await Bid.countDocuments(query);
    const totalPages = Math.ceil(total / limit);

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

    // Преобразуем ставки в формат покупок
    const purchases = bids.map(bid => ({
      _id: bid._id,
      lotId: bid.lotId,
      winningBid: {
        amount: bid.amount,
        placedAt: bid.createdAt,
      },
      status: 'pending', // По умолчанию ожидает подтверждения
      paymentStatus: 'pending', // По умолчанию ожидает оплаты
      shippingAddress: {
        street: 'Улица не указана',
        city: 'Город не указан',
        postalCode: '000000',
        country: 'Казахстан',
      },
      createdAt: bid.createdAt,
      updatedAt: bid.updatedAt,
    }));

    // Фильтрация по статусу (если нужно)
    let filteredPurchases = purchases;
    if (status !== 'all') {
      filteredPurchases = purchases.filter(purchase => purchase.status === status);
    }

    return NextResponse.json(
      {
        success: true,
        data: filteredPurchases,
        pagination: {
          page,
          limit,
          total: filteredPurchases.length,
          totalPages: Math.ceil(filteredPurchases.length / limit),
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Get purchases error:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
      },
      { status: 500 }
    );
  }
}
