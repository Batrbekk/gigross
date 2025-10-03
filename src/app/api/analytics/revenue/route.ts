import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth/jwt';
import connectDB from '@/config/database';
import { User } from '@/database/models/User';
import { Lot } from '@/database/models/Lot';
import { Bid } from '@/database/models/Bid';
import { UserRole } from '@/types';
import { convertCurrency, CurrencyCode } from '@/lib/currency';

// Функция для конвертации суммы в валюту пользователя
async function convertToUserCurrency(
  amount: number, 
  fromCurrency: string, 
  toCurrency: string
): Promise<number> {
  if (fromCurrency === toCurrency) {
    return amount;
  }
  
  try {
    return await convertCurrency(amount, fromCurrency as CurrencyCode, toCurrency as CurrencyCode);
  } catch {
    // Если конвертация не удалась, возвращаем исходную сумму
    return amount;
  }
}

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    // Проверяем авторизацию
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json({ success: false, error: 'Invalid token' }, { status: 401 });
    }

    const user = await User.findById(decoded.userId);
    if (!user) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
    }

    const { searchParams } = new URL(request.url);
    const period = parseInt(searchParams.get('period') || '12');

    // Вычисляем дату начала периода
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - period);

    const userCurrency = user.preferences?.currency || 'KZT';

    const revenueData = {
      totalRevenue: 0,
      monthlyRevenue: 0,
      revenueGrowth: 0,
      topProducts: [] as Array<{ productId: string; productName: string; revenue: number; sales: number }>,
      monthlyData: [] as Array<{ month: string; revenue: number; orders: number }>,
      revenueByCategory: [] as Array<{ category: string; revenue: number; percentage: number }>,
    };

    // Получаем данные в зависимости от роли пользователя
    switch (user.role) {
      case UserRole.PRODUCER:
        // Для производителя - доходы от его лотов
        const myLots = await Lot.find({ producerId: user._id }).select('_id currency');
        const myLotIds = myLots.map(lot => lot._id);

        // Общий доход
        const totalBids = await Bid.aggregate([
          { 
            $match: { 
              lotId: { $in: myLotIds },
              createdAt: { $gte: startDate }
            }
          },
          { 
            $lookup: {
              from: 'lots',
              localField: 'lotId',
              foreignField: '_id',
              as: 'lot'
            }
          },
          { $unwind: '$lot' },
          { 
            $group: { 
              _id: null, 
              total: { $sum: '$amount' },
              currency: { $first: '$lot.currency' }
            } 
          }
        ]);

        if (totalBids.length > 0) {
          const totalRevenue = totalBids[0].total;
          const revenueCurrency = totalBids[0].currency;
          revenueData.totalRevenue = await convertToUserCurrency(
            totalRevenue, 
            revenueCurrency, 
            userCurrency
          );
        }

        // Месячный доход
        const currentMonth = new Date();
        currentMonth.setDate(1);
        currentMonth.setHours(0, 0, 0, 0);

        const monthlyBids = await Bid.aggregate([
          { 
            $match: { 
              lotId: { $in: myLotIds },
              createdAt: { $gte: currentMonth }
            }
          },
          { 
            $lookup: {
              from: 'lots',
              localField: 'lotId',
              foreignField: '_id',
              as: 'lot'
            }
          },
          { $unwind: '$lot' },
          { 
            $group: { 
              _id: null, 
              total: { $sum: '$amount' },
              currency: { $first: '$lot.currency' }
            } 
          }
        ]);

        if (monthlyBids.length > 0) {
          const monthlyRevenue = monthlyBids[0].total;
          const revenueCurrency = monthlyBids[0].currency;
          revenueData.monthlyRevenue = await convertToUserCurrency(
            monthlyRevenue, 
            revenueCurrency, 
            userCurrency
          );
        }

        // Данные по месяцам
        const monthlyStats = await Bid.aggregate([
          { 
            $match: { 
              lotId: { $in: myLotIds },
              createdAt: { $gte: startDate }
            }
          },
          { 
            $lookup: {
              from: 'lots',
              localField: 'lotId',
              foreignField: '_id',
              as: 'lot'
            }
          },
          { $unwind: '$lot' },
          {
            $group: {
              _id: {
                year: { $year: '$createdAt' },
                month: { $month: '$createdAt' }
              },
              revenue: { $sum: '$amount' },
              orders: { $sum: 1 },
              currency: { $first: '$lot.currency' }
            }
          },
          { $sort: { '_id.year': 1, '_id.month': 1 } }
        ]);

        // Конвертируем данные по месяцам
        for (const stat of monthlyStats) {
          const convertedRevenue = await convertToUserCurrency(
            stat.revenue, 
            stat.currency, 
            userCurrency
          );
          
          revenueData.monthlyData.push({
            month: `${stat._id.year}-${stat._id.month.toString().padStart(2, '0')}`,
            revenue: convertedRevenue,
            orders: stat.orders,
          });
        }

        // Топ продукты
        const topProducts = await Bid.aggregate([
          { 
            $match: { 
              lotId: { $in: myLotIds },
              createdAt: { $gte: startDate }
            }
          },
          { 
            $lookup: {
              from: 'lots',
              localField: 'lotId',
              foreignField: '_id',
              as: 'lot'
            }
          },
          { $unwind: '$lot' },
          { 
            $lookup: {
              from: 'products',
              localField: 'lot.productId',
              foreignField: '_id',
              as: 'product'
            }
          },
          { $unwind: '$product' },
          {
            $group: {
              _id: '$product._id',
              productName: { $first: '$product.name' },
              revenue: { $sum: '$amount' },
              sales: { $sum: 1 },
              currency: { $first: '$lot.currency' }
            }
          },
          { $sort: { revenue: -1 } },
          { $limit: 10 }
        ]);

        // Конвертируем данные по продуктам
        for (const product of topProducts) {
          const convertedRevenue = await convertToUserCurrency(
            product.revenue, 
            product.currency, 
            userCurrency
          );
          
          revenueData.topProducts.push({
            productId: product._id,
            productName: product.productName,
            revenue: convertedRevenue,
            sales: product.sales,
          });
        }

        // Доходы по категориям
        const revenueByCategory = await Bid.aggregate([
          { 
            $match: { 
              lotId: { $in: myLotIds },
              createdAt: { $gte: startDate }
            }
          },
          { 
            $lookup: {
              from: 'lots',
              localField: 'lotId',
              foreignField: '_id',
              as: 'lot'
            }
          },
          { $unwind: '$lot' },
          { 
            $lookup: {
              from: 'products',
              localField: 'lot.productId',
              foreignField: '_id',
              as: 'product'
            }
          },
          { $unwind: '$product' },
          {
            $group: {
              _id: '$product.category',
              revenue: { $sum: '$amount' },
              currency: { $first: '$lot.currency' }
            }
          }
        ]);

        // Конвертируем данные по категориям
        for (const category of revenueByCategory) {
          const convertedRevenue = await convertToUserCurrency(
            category.revenue, 
            category.currency, 
            userCurrency
          );
          
          const percentage = revenueData.totalRevenue > 0 
            ? (convertedRevenue / revenueData.totalRevenue) * 100 
            : 0;
          
          revenueData.revenueByCategory.push({
            category: category._id,
            revenue: convertedRevenue,
            percentage,
          });
        }

        break;

      case UserRole.DISTRIBUTOR:
      case UserRole.INVESTOR:
        // Для дистрибьютора и инвестора - их расходы (отрицательный доход)
        const myBids = await Bid.aggregate([
          { 
            $match: { 
              bidderId: user._id,
              createdAt: { $gte: startDate }
            }
          },
          { 
            $lookup: {
              from: 'lots',
              localField: 'lotId',
              foreignField: '_id',
              as: 'lot'
            }
          },
          { $unwind: '$lot' },
          { 
            $group: { 
              _id: null, 
              total: { $sum: '$amount' },
              currency: { $first: '$lot.currency' }
            } 
          }
        ]);

        if (myBids.length > 0) {
          const totalSpent = myBids[0].total;
          const currency = myBids[0].currency;
          revenueData.totalRevenue = await convertToUserCurrency(
            totalSpent, 
            currency, 
            userCurrency
          );
        }

        break;

      case UserRole.ADMIN:
        // Для админа - общая статистика
        const adminBids = await Bid.aggregate([
          { 
            $match: { 
              createdAt: { $gte: startDate }
            }
          },
          { 
            $lookup: {
              from: 'lots',
              localField: 'lotId',
              foreignField: '_id',
              as: 'lot'
            }
          },
          { $unwind: '$lot' },
          { 
            $group: { 
              _id: null, 
              total: { $sum: '$amount' },
              currency: { $first: '$lot.currency' }
            } 
          }
        ]);

        if (adminBids.length > 0) {
          const totalRevenue = adminBids[0].total;
          const currency = adminBids[0].currency;
          revenueData.totalRevenue = await convertToUserCurrency(
            totalRevenue, 
            currency, 
            userCurrency
          );
        }

        break;
    }

    // Вычисляем рост доходов (сравниваем с предыдущим периодом)
    const previousPeriodStart = new Date(startDate);
    previousPeriodStart.setMonth(previousPeriodStart.getMonth() - period);

    const previousPeriodBids = await Bid.aggregate([
      { 
        $match: { 
          createdAt: { 
            $gte: previousPeriodStart,
            $lt: startDate
          }
        }
      },
      { 
        $lookup: {
          from: 'lots',
          localField: 'lotId',
          foreignField: '_id',
          as: 'lot'
        }
      },
      { $unwind: '$lot' },
      { 
        $group: { 
          _id: null, 
          total: { $sum: '$amount' },
          currency: { $first: '$lot.currency' }
        } 
      }
    ]);

    if (previousPeriodBids.length > 0) {
      const previousRevenue = previousPeriodBids[0].total;
      const currency = previousPeriodBids[0].currency;
      const convertedPreviousRevenue = await convertToUserCurrency(
        previousRevenue, 
        currency, 
        userCurrency
      );
      
      if (convertedPreviousRevenue > 0) {
        revenueData.revenueGrowth = ((revenueData.totalRevenue - convertedPreviousRevenue) / convertedPreviousRevenue) * 100;
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        ...revenueData,
        currency: userCurrency,
      },
    });

  } catch (error) {
    console.error('Revenue analytics error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
      },
      { status: 500 }
    );
  }
}
