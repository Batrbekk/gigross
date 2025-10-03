import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/middleware';
import { Transaction } from '@/database/models/Transaction';
import connectDB from '@/config/database';
import { TransactionType, TransactionStatus } from '@/types';

// GET /api/transactions/balance - Получить баланс пользователя (mock)
export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const authResult = await requireAuth(request);
    if (!authResult.success) {
      return authResult.response;
    }

    const userId = authResult.userId;

    // Получаем все завершенные транзакции пользователя
    const transactions = await Transaction.find({
      userId: userId,
      status: TransactionStatus.COMPLETED,
    }).exec();

    // Вычисляем баланс
    let balance = 0;
    const balanceByType: Record<string, number> = {};

    transactions.forEach((transaction) => {
      const amount = (transaction as any).amount;
      
      // Увеличиваем баланс для поступлений, уменьшаем для списаний
      switch ((transaction as any).type) {
        case TransactionType.DEPOSIT:
          balance += amount;
          break;
        case TransactionType.WITHDRAWAL:
        case TransactionType.PAYMENT:
        case TransactionType.FEE:
          balance -= amount;
          break;
        case TransactionType.REFUND:
          balance += amount;
          break;
        case TransactionType.INVESTMENT:
          balance -= amount;
          break;
      }

      // Группировка по типам
      if (!balanceByType[(transaction as any).type]) {
        balanceByType[(transaction as any).type] = 0;
      }
      balanceByType[(transaction as any).type] += amount;
    });

    // Mock данные для демонстрации
    const mockBalanceData = {
      currentBalance: balance,
      currency: 'RUB',
      availableBalance: balance * 0.95, // 95% доступно (5% заморожено)
      frozenBalance: balance * 0.05,
      totalTransactions: transactions.length,
      balanceByType,
      lastUpdated: new Date(),
      mockData: {
        creditLimit: 100000, // Кредитный лимит
        monthlyTurnover: Math.floor(Math.random() * 500000) + 100000,
        averageTransactionAmount: transactions.length > 0 ? balance / transactions.length : 0,
        accountStatus: balance > 0 ? 'active' : 'low_balance',
        riskScore: Math.floor(Math.random() * 100) + 1,
      },
      recentActivity: {
        depositsThisMonth: Math.floor(Math.random() * 10) + 1,
        withdrawalsThisMonth: Math.floor(Math.random() * 5) + 1,
        paymentsThisMonth: Math.floor(Math.random() * 15) + 1,
      },
    };

    return NextResponse.json(
      {
        success: true,
        data: mockBalanceData,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Get balance error:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
      },
      { status: 500 }
    );
  }
}
