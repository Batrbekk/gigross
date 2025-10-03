import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/middleware';
import { paginationSchema } from '@/lib/validation/schemas';
import { Transaction } from '@/database/models/Transaction';
import connectDB from '@/config/database';
import { TransactionType, TransactionStatus, PaymentMethodType } from '@/types';

// GET /api/transactions - Получить список транзакций пользователя
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

    // Построение запроса
    const query: any = { userId: user.userId };

    // Фильтр по типу транзакции
    if (filters.type) {
      query.type = filters.type;
    }

    // Фильтр по статусу
    if (filters.status) {
      query.status = filters.status;
    }

    // Подсчет общего количества
    const total = await Transaction.countDocuments(query);
    const totalPages = Math.ceil(total / limit);

    // Построение сортировки
    const sort: any = {};
    if (sortBy) {
      sort[sortBy] = sortOrder === 'asc' ? 1 : -1;
    } else {
      sort.createdAt = -1;
    }

    // Получение транзакций
    const transactions = await Transaction.find(query)
      .sort(sort)
      .skip((page - 1) * limit)
      .limit(limit)
      .exec();

    return NextResponse.json(
      {
        success: true,
        data: {
          data: transactions,
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
    console.error('Get transactions error:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
      },
      { status: 500 }
    );
  }
}

// POST /api/transactions - Создать новую транзакцию (mock)
export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const authResult = await requireAuth(request);
    if (!authResult.success) {
      return authResult.response;
    }

    const { user } = authResult;
    const body = await request.json();

    // Простая валидация
    if (!body.type || !body.amount || !body.paymentMethod) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required fields: type, amount, paymentMethod',
        },
        { status: 400 }
      );
    }

    // Mock обработка транзакции
    const mockProcessTransaction = (type: string, amount: number) => {
      // Имитируем различные сценарии
      const random = Math.random();
      
      if (random < 0.1) {
        // 10% шанс на ошибку
        return TransactionStatus.FAILED;
      } else if (random < 0.3) {
        // 20% шанс на ожидание
        return TransactionStatus.PENDING;
      } else {
        // 70% шанс на успех
        return TransactionStatus.COMPLETED;
      }
    };

    const status = mockProcessTransaction(body.type, body.amount);

    // Создание транзакции
    const transaction = new Transaction({
      userId: user.userId,
      type: body.type,
      amount: body.amount,
      currency: body.currency || 'RUB',
      status,
      relatedTo: body.relatedTo,
      paymentMethod: {
        type: body.paymentMethod.type || PaymentMethodType.BANK_TRANSFER,
        details: body.paymentMethod.details || {},
      },
      metadata: {
        mockTransaction: true,
        processedAt: new Date(),
        userAgent: request.headers.get('user-agent'),
      },
    });

    await transaction.save();

    // Mock данные для демонстрации
    const mockTransactionDetails = {
      ...transaction.toJSON(),
      mockInfo: {
        processingTime: Math.floor(Math.random() * 5000) + 1000, // 1-6 секунд
        transactionId: `TXN_${Date.now()}_${Math.random().toString(36).substr(2, 8)}`,
        bankReference: status === TransactionStatus.COMPLETED ? `BNK_${Math.random().toString(36).substr(2, 12)}` : null,
      },
    };

    return NextResponse.json(
      {
        success: true,
        data: mockTransactionDetails,
        message: `Transaction ${status.toLowerCase()} successfully`,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Create transaction error:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
      },
      { status: 500 }
    );
  }
}
