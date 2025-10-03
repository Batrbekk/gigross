'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { CardShimmer } from '@/components/ui/animated-skeleton';
import { useAuthStore } from '@/stores/authStore';
import { useApi } from '@/hooks/useApi';
import { UserRole } from '@/types';
import { formatCurrency, CurrencyCode } from '@/lib/currency';
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Package,
  Gavel,
  Wallet,
  Users,
  Activity,
  DollarSign,
  ShoppingCart,
  Award,
} from 'lucide-react';
import Link from 'next/link';
import { DashboardChart } from '@/components/dashboard/DashboardChart';
import { RecentActivity } from '@/components/dashboard/RecentActivity';
import { EmptyState } from '@/components/ui/empty-state';

interface DashboardData {
  overview: Record<string, number | string>;
  charts: Record<string, Array<{ date: string; value: number }>>;
  period: string;
  generatedAt: string;
  userRole: string;
}

export default function DashboardPage() {
  const { user } = useAuthStore();
  const { execute, isLoading } = useApi();
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const response = await execute('/api/analytics/dashboard?period=30', { method: 'GET' });
        if (response && response.success) {
          setDashboardData(response.data as DashboardData);
        }
      } catch {
        // Обработка ошибки загрузки данных dashboard
        setDashboardData(null);
      }
    };

    fetchDashboardData();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const getWelcomeMessage = () => {
    const roleMessages = {
      [UserRole.ADMIN]: 'Добро пожаловать в панель администратора',
      [UserRole.PRODUCER]: 'Управляйте своими продуктами и продажами',
      [UserRole.DISTRIBUTOR]: 'Находите лучшие предложения для закупок',
      [UserRole.INVESTOR]: 'Отслеживайте свои инвестиции и доходность',
    };
    return roleMessages[user?.role as UserRole] || 'Добро пожаловать в систему';
  };

  const getOverviewCards = () => {
    if (!dashboardData?.overview) return [];

    const role = user?.role as UserRole;
    
    switch (role) {
      case UserRole.ADMIN:
        return [
          {
            title: 'Всего пользователей',
            value: dashboardData.overview.totalUsers || 0,
            change: '+12%',
            trend: 'up',
            icon: Users,
            color: 'text-blue-600',
          },
          {
            title: 'Активные лоты',
            value: dashboardData.overview.activeLots || 0,
            change: '+8%',
            trend: 'up',
            icon: Gavel,
            color: 'text-green-600',
          },
          {
            title: 'Общий оборот',
            value: formatCurrency(
              (dashboardData.overview.totalRevenue as number) || 0, 
              (dashboardData.overview.currency as CurrencyCode) || 'KZT'
            ),
            change: '+23%',
            trend: 'up',
            icon: DollarSign,
            color: 'text-emerald-600',
          },
          {
            title: 'Транзакции',
            value: dashboardData.overview.totalTransactions || 0,
            change: '+15%',
            trend: 'up',
            icon: Activity,
            color: 'text-purple-600',
          },
        ];

      case UserRole.PRODUCER:
        return [
          {
            title: 'Мои продукты',
            value: dashboardData.overview.totalProducts || 0,
            change: dashboardData.overview.productsChange || '+0%',
            trend: (dashboardData.overview.productsChange || '+0%').startsWith('+') ? 'up' : 'down',
            icon: Package,
            color: 'text-blue-600',
          },
          {
            title: 'Активные лоты',
            value: dashboardData.overview.activeLots || 0,
            change: dashboardData.overview.activeLotsChange || '+0%',
            trend: (dashboardData.overview.activeLotsChange || '+0%').startsWith('+') ? 'up' : 'down',
            icon: Gavel,
            color: 'text-green-600',
          },
          {
            title: 'Проданные лоты',
            value: dashboardData.overview.soldLots || 0,
            change: dashboardData.overview.soldLotsChange || '+0%',
            trend: (dashboardData.overview.soldLotsChange || '+0%').startsWith('+') ? 'up' : 'down',
            icon: ShoppingCart,
            color: 'text-emerald-600',
          },
          {
            title: 'Доход',
            value: formatCurrency(
              (dashboardData.overview.totalRevenue as number) || 0,
              (dashboardData.overview.currency as CurrencyCode) || 'KZT'
            ),
            change: dashboardData.overview.revenueChange || '+0%',
            trend: (dashboardData.overview.revenueChange || '+0%').startsWith('+') ? 'up' : 'down',
            icon: Wallet,
            color: 'text-purple-600',
          },
        ];

      case UserRole.DISTRIBUTOR:
        return [
          {
            title: 'Мои ставки',
            value: dashboardData.overview.totalBids || 0,
            change: '+8%',
            trend: 'up',
            icon: Gavel,
            color: 'text-blue-600',
          },
          {
            title: 'Выигранные лоты',
            value: dashboardData.overview.wonBids || 0,
            change: '+15%',
            trend: 'up',
            icon: Award,
            color: 'text-green-600',
          },
          {
            title: 'Процент побед',
            value: `${dashboardData.overview.winRate || 0}%`,
            change: '+3%',
            trend: 'up',
            icon: TrendingUp,
            color: 'text-emerald-600',
          },
          {
            title: 'Потрачено',
            value: formatCurrency(
              (dashboardData.overview.totalSpent as number) || 0,
              (dashboardData.overview.currency as CurrencyCode) || 'KZT'
            ),
            change: '+20%',
            trend: 'up',
            icon: Wallet,
            color: 'text-purple-600',
          },
        ];

      case UserRole.INVESTOR:
        return [
          {
            title: 'Инвестиции',
            value: formatCurrency(
              (dashboardData.overview.totalInvested as number) || 0,
              (dashboardData.overview.currency as CurrencyCode) || 'KZT'
            ),
            change: '+12%',
            trend: 'up',
            icon: Wallet,
            color: 'text-blue-600',
          },
          {
            title: 'Доходность',
            value: `${dashboardData.overview.totalReturns || 0}%`,
            change: '+2.5%',
            trend: 'up',
            icon: TrendingUp,
            color: 'text-green-600',
          },
          {
            title: 'Активные проекты',
            value: dashboardData.overview.activeInvestments || 0,
            change: '+1',
            trend: 'up',
            icon: Activity,
            color: 'text-emerald-600',
          },
          {
            title: 'Прибыль',
            value: formatCurrency(
              (dashboardData.overview.totalProfit as number) || 0,
              (dashboardData.overview.currency as CurrencyCode) || 'KZT'
            ),
            change: '+18%',
            trend: 'up',
            icon: DollarSign,
            color: 'text-purple-600',
          },
        ];

      default:
        return [];
    }
  };

  const overviewCards = getOverviewCards();

  // Показываем skeleton только если загружается и нет данных
  if (isLoading && !dashboardData) {
    return (
      <div className="space-y-6 bg-white" key="dashboard-loading-state">
        <div>
          <Skeleton className="h-8 w-64" />
          <Skeleton className="mt-2 h-4 w-96" />
        </div>
        <CardShimmer count={4} />
      </div>
    );
  }


  return (
    <div className="space-y-6 bg-white" key="dashboard-main-content">
      {/* Заголовок */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-text-heading">Dashboard</h1>
        <p className="text-text-body">{getWelcomeMessage()}</p>
      </div>

      {/* Карточки обзора */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {overviewCards.map((card, index) => (
          <Card key={`dashboard-overview-card-${index}-${card.title.replace(/\s+/g, '-').toLowerCase()}`}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{card.title}</CardTitle>
              <card.icon className={`h-4 w-4 ${card.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{card.value}</div>
              <div className="flex items-center text-xs text-muted-foreground">
                {card.trend === 'up' ? (
                  <TrendingUp className="mr-1 h-3 w-3 text-green-500" />
                ) : (
                  <TrendingDown className="mr-1 h-3 w-3 text-red-500" />
                )}
                <span className={card.trend === 'up' ? 'text-green-500' : 'text-red-500'}>
                  {card.change}
                </span>
                <span className="ml-1">за месяц</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Графики и активность */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Аналитика
            </CardTitle>
            <CardDescription>
              Динамика за последние 30 дней
            </CardDescription>
          </CardHeader>
          <CardContent>
            {dashboardData?.charts ? (
              <DashboardChart data={dashboardData.charts} userRole={user?.role as UserRole} />
            ) : (
              <EmptyState
                icon={BarChart3}
                title="Нет данных аналитики"
                description="Данные для графика пока недоступны. Они появятся после накопления статистики."
                className="h-[300px] min-h-[300px]"
              />
            )}
          </CardContent>
        </Card>

        <Card className="col-span-3">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Последняя активность
            </CardTitle>
            <CardDescription>
              Недавние события в системе
            </CardDescription>
          </CardHeader>
          <CardContent>
            <RecentActivity userRole={user?.role as UserRole} />
          </CardContent>
        </Card>
      </div>

      {/* Быстрые действия */}
      <Card>
        <CardHeader>
          <CardTitle>Быстрые действия</CardTitle>
          <CardDescription>
            Часто используемые функции для вашей роли
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {user?.role === UserRole.PRODUCER && (
              <>
                <Button asChild>
                  <Link href="/dashboard/products/new">Добавить продукт</Link>
                </Button>
                <Button variant="outline" asChild>
                  <Link href="/dashboard/lots/new">Создать лот</Link>
                </Button>
                <Button variant="outline" asChild>
                  <Link href="/dashboard/analytics">Посмотреть аналитику</Link>
                </Button>
              </>
            )}
            {user?.role === UserRole.DISTRIBUTOR && (
              <>
                <Button asChild>
                  <Link href="/dashboard/catalog">Каталог товаров</Link>
                </Button>
                <Button variant="outline" asChild>
                  <Link href="/dashboard/auctions">Активные аукционы</Link>
                </Button>
                <Button variant="outline" asChild>
                  <Link href="/dashboard/bids">Мои ставки</Link>
                </Button>
              </>
            )}
            {user?.role === UserRole.INVESTOR && (
              <>
                <Button asChild>
                  <Link href="/dashboard/opportunities">Инвестиционные возможности</Link>
                </Button>
                <Button variant="outline" asChild>
                  <Link href="/dashboard/portfolio">Мой портфель</Link>
                </Button>
              </>
            )}
            {user?.role === UserRole.ADMIN && (
              <>
                <Button asChild>
                  <Link href="/dashboard/users">Управление пользователями</Link>
                </Button>
                <Button variant="outline" asChild>
                  <Link href="/dashboard/analytics">Системная аналитика</Link>
                </Button>
                <Button variant="outline" asChild>
                  <Link href="/dashboard/reports">Отчеты</Link>
                </Button>
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
