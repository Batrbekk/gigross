import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth/jwt';
import connectDB from '@/config/database';
import { User } from '@/database/models/User';
import { Product } from '@/database/models/Product';
import { Lot } from '@/database/models/Lot';
import { Bid } from '@/database/models/Bid';
import { Certificate } from '@/database/models/Certificate';
import { UserRole } from '@/types';
import { 
  calculateProductGrowth, 
  calculateLotGrowth, 
  calculateSoldLotsGrowth, 
  calculateRevenueGrowth 
} from '@/lib/statistics';

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

    const activities = [];
    const now = new Date();

    // Базовые системные активности
    activities.push({
      id: `system-${Date.now()}`,
      type: 'system',
      title: 'Система обновлена',
      description: 'Установлены новые функции безопасности',
      time: new Date(now.getTime() - 2 * 60 * 60 * 1000), // 2 часа назад
      icon: 'Activity',
    });

    // Рассчитываем статистику роста
    let stats = {
      products: { current: 0, percentage: 0, isPositive: true },
      activeLots: { current: 0, percentage: 0, isPositive: true },
      soldLots: { current: 0, percentage: 0, isPositive: true },
      revenue: { current: 0, percentage: 0, isPositive: true },
    };

    try {
      const [productsStats, lotsStats, soldLotsStats, revenueStats] = await Promise.all([
        calculateProductGrowth(user._id),
        calculateLotGrowth(user._id),
        calculateSoldLotsGrowth(user._id),
        calculateRevenueGrowth(user._id),
      ]);

      stats = {
        products: productsStats,
        activeLots: lotsStats,
        soldLots: soldLotsStats,
        revenue: revenueStats,
      };
    } catch (error) {
      console.error('Error calculating stats:', error);
    }

    // Активности в зависимости от роли пользователя
    switch (user.role) {
      case UserRole.PRODUCER:
        // Последние продукты пользователя
        const recentProducts = await Product.find({ producerId: user._id })
          .sort({ createdAt: -1 })
          .limit(3);
        
        recentProducts.forEach((product) => {
          activities.push({
            id: `product-${product._id}`,
            type: 'product',
            title: 'Новый продукт добавлен',
            description: `Продукт "${product.name}" успешно создан`,
            time: product.createdAt,
            icon: 'Package',
            badge: product.status === 'active' ? { text: 'Активен', variant: 'default' } : undefined,
          });
        });

        // Последние лоты пользователя
        const recentLots = await Lot.find({ producerId: user._id })
          .sort({ createdAt: -1 })
          .limit(3);
        
        recentLots.forEach((lot) => {
          activities.push({
            id: `lot-${lot._id}`,
            type: 'lot',
            title: 'Новый лот создан',
            description: `Лот "${lot.title}" успешно создан`,
            time: lot.createdAt,
            icon: 'Tag',
            badge: lot.status === 'active' ? { text: 'Активен', variant: 'default' } : 
                   lot.status === 'draft' ? { text: 'Черновик', variant: 'secondary' } : undefined,
          });
        });

        // Последние сертификаты пользователя
        const recentCertificates = await Certificate.find({ userId: user._id })
          .sort({ createdAt: -1 })
          .limit(3);
        
        recentCertificates.forEach((certificate) => {
          activities.push({
            id: `certificate-${certificate._id}`,
            type: 'certificate',
            title: 'Новый сертификат загружен',
            description: `Сертификат "${certificate.title}" отправлен на модерацию`,
            time: certificate.createdAt,
            icon: 'Award',
            badge: certificate.status === 'approved' ? { text: 'Одобрен', variant: 'default' } : 
                   certificate.status === 'pending' ? { text: 'На модерации', variant: 'secondary' } :
                   certificate.status === 'rejected' ? { text: 'Отклонен', variant: 'destructive' } : undefined,
          });
        });
        break;

      case UserRole.DISTRIBUTOR:
        // Последние ставки пользователя
        const recentBids = await Bid.find({ bidderId: user._id })
          .populate('lotId', 'title')
          .sort({ createdAt: -1 })
          .limit(3);
        
        recentBids.forEach((bid) => {
          activities.push({
            id: `bid-${bid._id}`,
            type: 'bid',
            title: 'Новая ставка размещена',
            description: `Ставка ${bid.amount} ₽ на лот "${(bid.lotId as any)?.title || 'Неизвестный лот'}"`,
            time: bid.createdAt,
            icon: 'Gavel',
            badge: { text: 'Ставка', variant: 'secondary' },
          });
        });
        break;

      case UserRole.INVESTOR:
        // Активные инвестиции (лоты, в которых участвует)
        const investorBids = await Bid.find({ bidderId: user._id })
          .populate('lotId', 'title status')
          .sort({ createdAt: -1 })
          .limit(3);
        
        investorBids.forEach((bid) => {
          const lot = bid.lotId as any;
          activities.push({
            id: `investment-${bid._id}`,
            type: 'investment',
            title: 'Инвестиция активна',
            description: `Ваша ставка ${bid.amount} ₽ на "${lot?.title || 'лот'}"`,
            time: bid.createdAt,
            icon: 'TrendingUp',
            badge: lot?.status === 'active' ? { text: 'Активно', variant: 'default' } : undefined,
          });
        });
        break;

      case UserRole.ADMIN:
        // Последние пользователи
        const recentUsers = await User.find()
          .sort({ createdAt: -1 })
          .limit(2)
          .select('profile.firstName profile.lastName createdAt');
        
        recentUsers.forEach((newUser) => {
          activities.push({
            id: `user-${newUser._id}`,
            type: 'user',
            title: 'Новый пользователь',
            description: `${newUser.profile.firstName} ${newUser.profile.lastName} зарегистрировался`,
            time: newUser.createdAt,
            icon: 'UserPlus',
            badge: { text: 'Новый', variant: 'secondary' },
          });
        });

        // Последние лоты на модерации
        const pendingLots = await Lot.find({ status: 'pending' })
          .populate('producerId', 'profile.firstName profile.lastName')
          .sort({ createdAt: -1 })
          .limit(2);
        
        pendingLots.forEach((lot) => {
          const creator = lot.producerId as any;
          activities.push({
            id: `lot-moderation-${lot._id}`,
            type: 'moderation',
            title: 'Лот на модерации',
            description: `"${lot.title}" от ${creator?.profile?.firstName || 'пользователя'} ожидает проверки`,
            time: lot.createdAt,
            icon: 'Award',
            badge: { text: 'Модерация', variant: 'secondary' },
          });
        });
        break;
    }

    // Сортируем по времени (новые сначала)
    activities.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());

    // Ограничиваем количество активностей
    const limitedActivities = activities.slice(0, 10);

    return NextResponse.json({
      success: true,
      data: {
        activities: limitedActivities,
        stats: {
          products: {
            current: stats.products.current,
            percentage: stats.products.percentage,
            isPositive: stats.products.isPositive,
          },
          activeLots: {
            current: stats.activeLots.current,
            percentage: stats.activeLots.percentage,
            isPositive: stats.activeLots.isPositive,
          },
          soldLots: {
            current: stats.soldLots.current,
            percentage: stats.soldLots.percentage,
            isPositive: stats.soldLots.isPositive,
          },
          revenue: {
            current: stats.revenue.current,
            percentage: stats.revenue.percentage,
            isPositive: stats.revenue.isPositive,
          },
        },
      },
    });
  } catch (error) {
    console.error('Dashboard activity error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
