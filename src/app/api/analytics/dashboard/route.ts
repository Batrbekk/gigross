import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth/jwt';
import connectDB from '@/config/database';
import { User } from '@/database/models/User';
import { Product } from '@/database/models/Product';
import { Lot } from '@/database/models/Lot';
import { Bid } from '@/database/models/Bid';
import { UserRole } from '@/types';
import { convertCurrency, CurrencyCode } from '@/lib/currency';
import { 
  calculateProductGrowth, 
  calculateLotGrowth, 
  calculateSoldLotsGrowth, 
  calculateRevenueGrowth 
} from '@/lib/statistics';

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

// Функция для получения активности по дням недели
async function getWeeklyActivity(user: any, startDate: Date) {
  const daysOfWeek = ['Воскресенье', 'Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота'];
  
  // Получаем активность в зависимости от роли пользователя
  let activityQuery: any = {};
  let activityCollection: any;

  switch (user.role) {
    case UserRole.PRODUCER:
      // Для производителя - ставки на его лоты
      const myLots = await Lot.find({ producerId: user._id }).select('_id');
      const myLotIds = myLots.map(lot => lot._id);
      activityQuery = { lotId: { $in: myLotIds } };
      activityCollection = Bid;
      break;
    
    case UserRole.DISTRIBUTOR:
      // Для дистрибьютора - его ставки
      activityQuery = { bidderId: user._id };
      activityCollection = Bid;
      break;
    
    case UserRole.INVESTOR:
      // Для инвестора - его ставки
      activityQuery = { bidderId: user._id };
      activityCollection = Bid;
      break;
    
    case UserRole.ADMIN:
    default:
      // Для админа - все ставки
      activityQuery = {};
      activityCollection = Bid;
      break;
  }

  // Получаем активность по дням недели за период
  const weeklyStats = await activityCollection.aggregate([
    {
      $match: {
        ...activityQuery,
        createdAt: { $gte: startDate }
      }
    },
    {
      $group: {
        _id: { $dayOfWeek: '$createdAt' }, // 1 = Воскресенье, 2 = Понедельник, и т.д.
        count: { $sum: 1 },
        totalAmount: { $sum: '$amount' }
      }
    }
  ]) as Array<{ _id: number; count: number; totalAmount: number }>;

  // Создаем массив с данными для каждого дня недели
  const weeklyActivity = daysOfWeek.map((day, index) => {
    const dayData = weeklyStats.find(stat => stat._id === (index + 1));
    const count = dayData?.count || 0;
    const totalCount = weeklyStats.reduce((sum: number, stat) => sum + stat.count, 0);
    const percentage = totalCount > 0 ? Math.round((count / totalCount) * 100) : 0;
    
    return {
      day,
      count,
      percentage,
      totalAmount: dayData?.totalAmount || 0
    };
  });

  return weeklyActivity;
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
    const period = parseInt(searchParams.get('period') || '30');

    // Вычисляем дату начала периода
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - period);

    let overview = {};
    let charts = {};

    // Получаем данные в зависимости от роли пользователя
    switch (user.role) {
      case UserRole.ADMIN:
        // Общая статистика для админа
        const totalUsers = await User.countDocuments();
        const activeLots = await Lot.countDocuments({ status: 'active' });
        const totalProducts = await Product.countDocuments();
        
        // Подсчет общего оборота из ставок с конвертацией валют
        const totalBids = await Bid.aggregate([
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
        
        const totalRevenue = totalBids[0]?.total || 0;
        const revenueCurrency = totalBids[0]?.currency || 'KZT';
        
        // Конвертируем в валюту пользователя
        const convertedRevenue = await convertToUserCurrency(
          totalRevenue, 
          revenueCurrency, 
          user.preferences?.currency || 'KZT'
        );

        const totalTransactions = await Bid.countDocuments();

        overview = {
          totalUsers,
          activeLots,
          totalProducts,
          totalRevenue: convertedRevenue,
          totalTransactions,
          currency: user.preferences?.currency || 'KZT',
        };

        // Данные для графиков (последние 30 дней)
        const dailyStats = await Bid.aggregate([
          {
            $match: {
              createdAt: { $gte: startDate }
            }
          },
          {
            $group: {
              _id: {
                $dateToString: { format: '%Y-%m-%d', date: '$createdAt' }
              },
              revenue: { $sum: '$amount' },
              transactions: { $sum: 1 }
            }
          },
          { $sort: { _id: 1 } }
        ]);

        charts = {
          revenue: dailyStats.map(stat => ({
            date: stat._id,
            value: stat.revenue
          })),
          transactions: dailyStats.map(stat => ({
            date: stat._id,
            value: stat.transactions
          }))
        };
        break;

      case UserRole.PRODUCER:
        // Статистика для производителя
        const myProducts = await Product.countDocuments({ producerId: user._id });
        const myActiveLots = await Lot.countDocuments({ 
          producerId: user._id, 
          status: 'active' 
        });
        
        const mySoldLots = await Lot.countDocuments({ 
          producerId: user._id, 
          status: 'sold' 
        });
        
        // Доходы от продаж (ставки на лоты пользователя)
        const myLots = await Lot.find({ producerId: user._id }).select('_id');
        const myLotIds = myLots.map(lot => lot._id);
        
        const myRevenueBids = await Bid.aggregate([
          { $match: { lotId: { $in: myLotIds } } },
          { $group: { _id: null, total: { $sum: '$amount' } } }
        ]);
        const myRevenue = myRevenueBids[0]?.total || 0;

        const myOrders = await Bid.countDocuments({ lotId: { $in: myLotIds } });

        // Рассчитываем динамические проценты роста
        let growthStats = {
          products: { percentage: 0, isPositive: true },
          activeLots: { percentage: 0, isPositive: true },
          soldLots: { percentage: 0, isPositive: true },
          revenue: { percentage: 0, isPositive: true },
        };

        try {
          const [productsStats, lotsStats, soldLotsStats, revenueStats] = await Promise.all([
            calculateProductGrowth(user._id),
            calculateLotGrowth(user._id),
            calculateSoldLotsGrowth(user._id),
            calculateRevenueGrowth(user._id),
          ]);

          growthStats = {
            products: productsStats,
            activeLots: lotsStats,
            soldLots: soldLotsStats,
            revenue: revenueStats,
          };
        } catch (error) {
          console.error('Error calculating growth stats:', error);
        }

        overview = {
          totalProducts: myProducts,
          activeLots: myActiveLots,
          soldLots: mySoldLots,
          totalRevenue: myRevenue,
          totalOrders: myOrders,
          currency: user.preferences?.currency || 'KZT',
          // Добавляем динамические проценты
          productsChange: `${growthStats.products.isPositive ? '+' : '-'}${growthStats.products.percentage}%`,
          activeLotsChange: `${growthStats.activeLots.isPositive ? '+' : '-'}${growthStats.activeLots.percentage}%`,
          soldLotsChange: `${growthStats.soldLots.isPositive ? '+' : '-'}${growthStats.soldLots.percentage}%`,
          revenueChange: `${growthStats.revenue.isPositive ? '+' : '-'}${growthStats.revenue.percentage}%`,
        };

        // График доходов по дням
        const producerDailyStats = await Bid.aggregate([
          {
            $match: {
              lotId: { $in: myLotIds },
              createdAt: { $gte: startDate }
            }
          },
          {
            $group: {
              _id: {
                $dateToString: { format: '%Y-%m-%d', date: '$createdAt' }
              },
              revenue: { $sum: '$amount' },
              orders: { $sum: 1 }
            }
          },
          { $sort: { _id: 1 } }
        ]);

        charts = {
          revenue: producerDailyStats.map(stat => ({
            date: stat._id,
            value: stat.revenue
          })),
          orders: producerDailyStats.map(stat => ({
            date: stat._id,
            value: stat.orders
          }))
        };
        break;

      case UserRole.DISTRIBUTOR:
        // Статистика для дистрибьютора
        const myBids = await Bid.countDocuments({ bidderId: user._id });
        const mySpent = await Bid.aggregate([
          { $match: { bidderId: user._id } },
          { $group: { _id: null, total: { $sum: '$amount' } } }
        ]);
        const totalSpent = mySpent[0]?.total || 0;

        // Выигранные аукционы (упрощенная логика)
        const wonAuctions = await Bid.countDocuments({ 
          bidderId: user._id,
          // Здесь должна быть более сложная логика определения победителя
        });

        const activeBids = await Bid.countDocuments({ 
          bidderId: user._id,
          // Ставки на активные лоты
        });

        overview = {
          totalBids: myBids,
          totalSpent,
          wonAuctions,
          activeBids,
        };

        // График трат по дням
        const distributorDailyStats = await Bid.aggregate([
          {
            $match: {
              bidderId: user._id,
              createdAt: { $gte: startDate }
            }
          },
          {
            $group: {
              _id: {
                $dateToString: { format: '%Y-%m-%d', date: '$createdAt' }
              },
              spent: { $sum: '$amount' },
              bids: { $sum: 1 }
            }
          },
          { $sort: { _id: 1 } }
        ]);

        charts = {
          spent: distributorDailyStats.map(stat => ({
            date: stat._id,
            value: stat.spent
          })),
          bids: distributorDailyStats.map(stat => ({
            date: stat._id,
            value: stat.bids
          }))
        };
        break;

      case UserRole.INVESTOR:
        // Статистика для инвестора (упрощенная)
        const investmentBids = await Bid.countDocuments({ bidderId: user._id });
        const investmentAmount = await Bid.aggregate([
          { $match: { bidderId: user._id } },
          { $group: { _id: null, total: { $sum: '$amount' } } }
        ]);
        const totalInvestment = investmentAmount[0]?.total || 0;

        overview = {
          totalInvestments: investmentBids,
          totalInvested: totalInvestment,
          portfolioValue: totalInvestment * 1.12, // Примерный рост 12%
          monthlyReturn: totalInvestment * 0.02, // Примерная доходность 2%
        };

        // График инвестиций
        const investorDailyStats = await Bid.aggregate([
          {
            $match: {
              bidderId: user._id,
              createdAt: { $gte: startDate }
            }
          },
          {
            $group: {
              _id: {
                $dateToString: { format: '%Y-%m-%d', date: '$createdAt' }
              },
              invested: { $sum: '$amount' },
              count: { $sum: 1 }
            }
          },
          { $sort: { _id: 1 } }
        ]);

        charts = {
          invested: investorDailyStats.map(stat => ({
            date: stat._id,
            value: stat.invested
          })),
          returns: investorDailyStats.map(stat => ({
            date: stat._id,
            value: stat.invested * 0.12 // Примерная доходность
          }))
        };
        break;

      default:
        overview = {};
        charts = {};
    }

    // Получаем активность по дням недели
    const weeklyActivity = await getWeeklyActivity(user, startDate);

    return NextResponse.json({
      success: true,
      data: {
        overview,
        charts,
        weeklyActivity,
        period,
        user: {
          role: user.role,
          name: `${user.profile.firstName} ${user.profile.lastName}`,
        }
      },
    });
  } catch (error) {
    console.error('Dashboard analytics error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}