import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/middleware';
import { Bid } from '@/database/models/Bid';
import { Lot } from '@/database/models/Lot';
import connectDB from '@/config/database';
import { UserRole } from '@/types';
import { z } from 'zod';

const createBidSchema = z.object({
  lotId: z.string().min(1, 'Lot ID is required'),
  amount: z.number().positive('Amount must be positive'),
});


// GET /api/bids - Получить ставки пользователя
export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const authResult = await requireAuth(request);
    if (!authResult.success) {
      return authResult.response;
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || 'all';
    const sort = searchParams.get('sort') || 'newest';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    // Построение запроса
    const query: Record<string, unknown> = { bidderId: authResult.userId };
    
    if (status !== 'all') {
      query.status = status;
    }

    // Поиск по названию лота
    if (search) {
      const lots = await Lot.find({ 
        title: { $regex: search, $options: 'i' } 
      }).select('_id');
      const lotIds = lots.map(lot => lot._id);
      query.lotId = { $in: lotIds };
    }

    // Сортировка
    let sortOptions: Record<string, 1 | -1> = {};
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

    // Получение ставок с пагинацией
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
      .populate('bidderId', 'email profile.firstName profile.lastName profile.company')
      .sort(sortOptions)
      .skip((page - 1) * limit)
      .limit(limit)
      .exec();

    return NextResponse.json(
      {
        success: true,
        data: bids,
        pagination: {
          page,
          limit,
          total,
          totalPages,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Get bids error:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
      },
      { status: 500 }
    );
  }
}

// POST /api/bids - Создать ставку
export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const authResult = await requireAuth(request);
    if (!authResult.success) {
      return authResult.response;
    }

    // Проверяем, что пользователь - дистрибьютор или инвестор
    if (![UserRole.DISTRIBUTOR, UserRole.INVESTOR].includes(authResult.userRole as UserRole)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Access denied. Distributor or Investor role required.',
        },
        { status: 403 }
      );
    }

    const body = await request.json();

    // Валидация входных данных
    const validationResult = createBidSchema.safeParse(body);
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

    const { lotId, amount } = validationResult.data;

    // Проверяем, что лот существует и активен
    const lot = await Lot.findById(lotId);
    if (!lot) {
      return NextResponse.json(
        {
          success: false,
          error: 'Lot not found',
        },
        { status: 404 }
      );
    }

    if (lot.status !== 'active') {
      return NextResponse.json(
        {
          success: false,
          error: 'Lot is not active',
        },
        { status: 400 }
      );
    }

    // Проверяем, что ставка больше текущей цены
    if (amount <= lot.currentPrice) {
      return NextResponse.json(
        {
          success: false,
          error: 'Bid amount must be higher than current price',
        },
        { status: 400 }
      );
    }

    // Проверяем, что пользователь не является владельцем лота
    if (lot.producerId === authResult.userId) {
      return NextResponse.json(
        {
          success: false,
          error: 'Cannot bid on your own lot',
        },
        { status: 400 }
      );
    }

    // Создаем ставку
    const bid = new Bid({
      lotId: lotId,
      bidderId: authResult.userId,
      amount: amount,
      status: 'active',
      isWinning: true, // Новая ставка становится выигрывающей
    });

    await bid.save();

    // Обновляем текущую цену лота
    lot.currentPrice = amount;
    lot.updatedAt = new Date();
    await lot.save();

    // Обновляем количество ставок в лоте
    const bidsCount = await Bid.countDocuments({ lotId: lotId });
    lot.bidsCount = bidsCount;
    await lot.save();

    // Помечаем предыдущие ставки как не выигрывающие
    await Bid.updateMany(
      { 
        lotId: lotId, 
        _id: { $ne: bid._id },
        status: 'active'
      },
      { isWinning: false }
    );

    // Получаем обновленную ставку с популяцией
    const populatedBid = await Bid.findById(bid._id)
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
      .exec();

    return NextResponse.json(
      {
        success: true,
        data: populatedBid,
        message: 'Bid placed successfully',
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Create bid error:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
      },
      { status: 500 }
    );
  }
}