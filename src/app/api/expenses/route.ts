import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/middleware';
import { Bid } from '@/database/models/Bid';
import { Lot } from '@/database/models/Lot';
import connectDB from '@/config/database';
import { UserRole } from '@/types';

// GET /api/expenses - Получить расходы пользователя
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
    const type = searchParams.get('type') || 'all';
    const status = searchParams.get('status') || 'all';
    const sort = searchParams.get('sort') || 'newest';
    const dateRange = searchParams.get('dateRange') || 'all';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    // Находим ставки пользователя (покупки)
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

    // Преобразуем ставки в формат расходов
    const expenses = [];
    
    // Основные расходы на покупки
    for (const bid of bids) {
      // Расход на покупку
      expenses.push({
        _id: `expense_purchase_${bid._id}`,
        type: 'purchase',
        category: 'Покупка товара',
        description: `Покупка: ${(bid.lotId as any).title}`,
        amount: bid.amount,
        currency: 'KZT',
        status: 'paid',
        paymentMethod: 'card',
        relatedPurchase: {
          _id: bid._id,
          lotId: {
            _id: (bid.lotId as any)._id,
            title: (bid.lotId as any).title,
          },
        },
        tags: ['покупка', 'товар'],
        receiptUrl: `https://example.com/receipts/${bid._id}.pdf`,
        createdAt: bid.createdAt,
        updatedAt: bid.updatedAt,
      });

      // Расход на доставку (случайно добавляем)
      if (Math.random() > 0.5) {
        const shippingAmount = Math.floor(bid.amount * 0.1); // 10% от стоимости
        expenses.push({
          _id: `expense_shipping_${bid._id}`,
          type: 'shipping',
          category: 'Доставка',
          description: `Доставка: ${(bid.lotId as any).title}`,
          amount: shippingAmount,
          currency: 'KZT',
          status: 'paid',
          paymentMethod: 'card',
          relatedPurchase: {
            _id: bid._id,
            lotId: {
              _id: (bid.lotId as any)._id,
              title: (bid.lotId as any).title,
            },
          },
          tags: ['доставка', 'логистика'],
          createdAt: new Date(bid.createdAt.getTime() + 24 * 60 * 60 * 1000), // +1 день
          updatedAt: new Date(bid.updatedAt.getTime() + 24 * 60 * 60 * 1000),
        });
      }

      // Комиссия платформы (случайно добавляем)
      if (Math.random() > 0.3) {
        const commissionAmount = Math.floor(bid.amount * 0.05); // 5% комиссия
        expenses.push({
          _id: `expense_commission_${bid._id}`,
          type: 'commission',
          category: 'Комиссия платформы',
          description: `Комиссия за покупку: ${(bid.lotId as any).title}`,
          amount: commissionAmount,
          currency: 'KZT',
          status: 'paid',
          paymentMethod: 'wallet',
          relatedPurchase: {
            _id: bid._id,
            lotId: {
              _id: (bid.lotId as any)._id,
              title: (bid.lotId as any).title,
            },
          },
          tags: ['комиссия', 'платформа'],
          createdAt: new Date(bid.createdAt.getTime() + 2 * 24 * 60 * 60 * 1000), // +2 дня
          updatedAt: new Date(bid.updatedAt.getTime() + 2 * 24 * 60 * 60 * 1000),
        });
      }
    }

    // Дополнительные расходы (не связанные с покупками)
    const additionalExpenses = [
      {
        _id: 'expense_other_1',
        type: 'other',
        category: 'Подписка',
        description: 'Подписка на премиум-функции',
        amount: 5000,
        currency: 'KZT',
        status: 'paid',
        paymentMethod: 'card',
        tags: ['подписка', 'премиум'],
        createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 дней назад
        updatedAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      },
      {
        _id: 'expense_other_2',
        type: 'other',
        category: 'Консультация',
        description: 'Консультация по инвестициям',
        amount: 15000,
        currency: 'KZT',
        status: 'paid',
        paymentMethod: 'bank_transfer',
        tags: ['консультация', 'инвестиции'],
        createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000), // 15 дней назад
        updatedAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
      },
    ];

    expenses.push(...additionalExpenses);

    // Фильтрация по типу
    let filteredExpenses = expenses;
    if (type !== 'all') {
      filteredExpenses = expenses.filter(expense => expense.type === type);
    }

    // Фильтрация по статусу
    if (status !== 'all') {
      filteredExpenses = filteredExpenses.filter(expense => expense.status === status);
    }

    // Фильтрация по дате
    if (dateRange !== 'all') {
      const now = new Date();
      let startDate: Date;
      
      switch (dateRange) {
        case 'week':
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case 'month':
          startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          break;
        case 'quarter':
          startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
          break;
        case 'year':
          startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
          break;
        default:
          startDate = new Date(0);
      }
      
      filteredExpenses = filteredExpenses.filter(expense => 
        new Date(expense.createdAt) >= startDate
      );
    }

    // Сортировка
    filteredExpenses.sort((a, b) => {
      switch (sort) {
        case 'newest':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case 'oldest':
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        case 'amount_high':
          return b.amount - a.amount;
        case 'amount_low':
          return a.amount - b.amount;
        default:
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
    });

    // Пагинация
    const total = filteredExpenses.length;
    const totalPages = Math.ceil(total / limit);
    const paginatedExpenses = filteredExpenses.slice((page - 1) * limit, page * limit);

    return NextResponse.json(
      {
        success: true,
        data: paginatedExpenses,
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
    console.error('Get expenses error:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
      },
      { status: 500 }
    );
  }
}
