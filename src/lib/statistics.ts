import { Product } from '@/database/models/Product';
import { Lot } from '@/database/models/Lot';
import { Bid } from '@/database/models/Bid';
import { LotStatus } from '@/types';

export interface GrowthStats {
  current: number;
  previous: number;
  percentage: number;
  isPositive: boolean;
}

export async function calculateProductGrowth(userId: string): Promise<GrowthStats> {
  const now = new Date();
  const currentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const previousMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const previousMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);

  // Текущий месяц
  const currentProducts = await Product.countDocuments({
    producerId: userId,
    createdAt: { $gte: currentMonth },
  });

  // Предыдущий месяц
  const previousProducts = await Product.countDocuments({
    producerId: userId,
    createdAt: { $gte: previousMonth, $lte: previousMonthEnd },
  });

  const percentage = previousProducts === 0 
    ? (currentProducts > 0 ? 100 : 0)
    : Math.round(((currentProducts - previousProducts) / previousProducts) * 100);

  return {
    current: currentProducts,
    previous: previousProducts,
    percentage: Math.abs(percentage),
    isPositive: percentage >= 0,
  };
}

export async function calculateLotGrowth(userId: string): Promise<GrowthStats> {
  const now = new Date();
  const currentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const previousMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const previousMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);

  // Текущий месяц - активные лоты
  const currentLots = await Lot.countDocuments({
    producerId: userId,
    status: LotStatus.ACTIVE,
    createdAt: { $gte: currentMonth },
  });

  // Предыдущий месяц - активные лоты
  const previousLots = await Lot.countDocuments({
    producerId: userId,
    status: LotStatus.ACTIVE,
    createdAt: { $gte: previousMonth, $lte: previousMonthEnd },
  });

  const percentage = previousLots === 0 
    ? (currentLots > 0 ? 100 : 0)
    : Math.round(((currentLots - previousLots) / previousLots) * 100);

  return {
    current: currentLots,
    previous: previousLots,
    percentage: Math.abs(percentage),
    isPositive: percentage >= 0,
  };
}

export async function calculateSoldLotsGrowth(userId: string): Promise<GrowthStats> {
  const now = new Date();
  const currentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const previousMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const previousMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);

  // Текущий месяц - проданные лоты
  const currentSoldLots = await Lot.countDocuments({
    producerId: userId,
    status: LotStatus.SOLD,
    updatedAt: { $gte: currentMonth },
  });

  // Предыдущий месяц - проданные лоты
  const previousSoldLots = await Lot.countDocuments({
    producerId: userId,
    status: LotStatus.SOLD,
    updatedAt: { $gte: previousMonth, $lte: previousMonthEnd },
  });

  const percentage = previousSoldLots === 0 
    ? (currentSoldLots > 0 ? 100 : 0)
    : Math.round(((currentSoldLots - previousSoldLots) / previousSoldLots) * 100);

  return {
    current: currentSoldLots,
    previous: previousSoldLots,
    percentage: Math.abs(percentage),
    isPositive: percentage >= 0,
  };
}

export async function calculateRevenueGrowth(userId: string): Promise<GrowthStats> {
  const now = new Date();
  const currentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const previousMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const previousMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);

  // Текущий месяц - доходы (выигранные ставки)
  const currentRevenue = await Bid.aggregate([
    {
      $match: {
        bidderId: userId,
        isWinning: true,
        createdAt: { $gte: currentMonth },
      },
    },
    {
      $group: {
        _id: null,
        total: { $sum: '$amount' },
      },
    },
  ]);

  // Предыдущий месяц - доходы
  const previousRevenue = await Bid.aggregate([
    {
      $match: {
        bidderId: userId,
        isWinning: true,
        createdAt: { $gte: previousMonth, $lte: previousMonthEnd },
      },
    },
    {
      $group: {
        _id: null,
        total: { $sum: '$amount' },
      },
    },
  ]);

  const currentAmount = currentRevenue[0]?.total || 0;
  const previousAmount = previousRevenue[0]?.total || 0;

  const percentage = previousAmount === 0 
    ? (currentAmount > 0 ? 100 : 0)
    : Math.round(((currentAmount - previousAmount) / previousAmount) * 100);

  return {
    current: currentAmount,
    previous: previousAmount,
    percentage: Math.abs(percentage),
    isPositive: percentage >= 0,
  };
}
