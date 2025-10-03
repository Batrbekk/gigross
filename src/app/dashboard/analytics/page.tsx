'use client';

import { useEffect, useState, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuthStore } from '@/stores/authStore';
import { useApi } from '@/hooks/useApi';
import { UserRole } from '@/types';
import { formatCurrency, CurrencyCode } from '@/lib/currency';
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Users,
  Package,
  Gavel,
  Activity,
  Calendar,
  Download,
  RefreshCw,
} from 'lucide-react';
import { DashboardChart } from '@/components/dashboard/DashboardChart';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface AnalyticsData {
  overview: Record<string, unknown>;
  charts: Record<string, unknown>;
  weeklyActivity: Array<{
    day: string;
    count: number;
    percentage: number;
    totalAmount: number;
  }>;
  period: string;
  generatedAt: string;
  userRole: string;
}

export default function AnalyticsPage() {
  const { user } = useAuthStore();
  const { execute, isLoading } = useApi();
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState('30');
  const [activeTab, setActiveTab] = useState('overview');

  const fetchAnalyticsData = useCallback(async (period = '30') => {
    try {
      const response = await execute(`/api/analytics/dashboard?period=${period}`, { method: 'GET' });
      if (response && response.success) {
        setAnalyticsData(response.data as AnalyticsData);
      }
    } catch {
      // Обработка ошибки загрузки данных аналитики
      setAnalyticsData(null);
    }
  }, [execute]);

  useEffect(() => {
    fetchAnalyticsData(selectedPeriod);
  }, [selectedPeriod, fetchAnalyticsData]);

  const handlePeriodChange = (period: string) => {
    setSelectedPeriod(period);
  };

  const handleRefresh = () => {
    fetchAnalyticsData(selectedPeriod);
  };

  const getMetricsCards = () => {
    if (!analyticsData?.overview) return [];

    const role = user?.role as UserRole;
    
    switch (role) {
      case UserRole.ADMIN:
        return [
          {
            title: 'Общий оборот',
            value: formatCurrency(
              (analyticsData.overview.totalRevenue as number) || 0,
              (analyticsData.overview.currency as CurrencyCode) || 'KZT'
            ),
            change: analyticsData.overview.revenueChange || '0%',
            trend: (analyticsData.overview.revenueChange && String(analyticsData.overview.revenueChange).startsWith('+')) ? 'up' : 'down',
            icon: DollarSign,
            description: 'За выбранный период',
          },
          {
            title: 'Активные пользователи',
            value: analyticsData.overview.activeUsers || 0,
            change: analyticsData.overview.usersChange || '0%',
            trend: (analyticsData.overview.usersChange && String(analyticsData.overview.usersChange).startsWith('+')) ? 'up' : 'down',
            icon: Users,
            description: 'Пользователи с активностью',
          },
          {
            title: 'Завершенные сделки',
            value: analyticsData.overview.completedDeals || 0,
            change: analyticsData.overview.dealsChange || '0%',
            trend: (analyticsData.overview.dealsChange && String(analyticsData.overview.dealsChange).startsWith('+')) ? 'up' : 'down',
            icon: Activity,
            description: 'Успешные транзакции',
          },
          {
            title: 'Средний чек',
            value: formatCurrency(
              (analyticsData.overview.averageOrderValue as number) || 0,
              (analyticsData.overview.currency as CurrencyCode) || 'KZT'
            ),
            change: analyticsData.overview.averageOrderChange || '0%',
            trend: (analyticsData.overview.averageOrderChange && String(analyticsData.overview.averageOrderChange).startsWith('+')) ? 'up' : 'down',
            icon: BarChart3,
            description: 'Средняя сумма сделки',
          },
        ];

      case UserRole.PRODUCER:
        return [
          {
            title: 'Доходы',
            value: formatCurrency(
              (analyticsData.overview.totalRevenue as number) || 0,
              (analyticsData.overview.currency as CurrencyCode) || 'KZT'
            ),
            change: analyticsData.overview.revenueChange || '0%',
            trend: (analyticsData.overview.revenueChange && String(analyticsData.overview.revenueChange).startsWith('+')) ? 'up' : 'down',
            icon: DollarSign,
            description: 'Общий доход от продаж',
          },
          {
            title: 'Проданные лоты',
            value: analyticsData.overview.soldLots || 0,
            change: analyticsData.overview.soldLotsChange || '0%',
            trend: (analyticsData.overview.soldLotsChange && String(analyticsData.overview.soldLotsChange).startsWith('+')) ? 'up' : 'down',
            icon: Gavel,
            description: 'Успешно проданные лоты',
          },
          {
            title: 'Активные продукты',
            value: analyticsData.overview.activeProducts || 0,
            change: analyticsData.overview.activeProductsChange || '0%',
            trend: (analyticsData.overview.activeProductsChange && String(analyticsData.overview.activeProductsChange).startsWith('+')) ? 'up' : 'down',
            icon: Package,
            description: 'Продукты в продаже',
          },
          {
            title: 'Конверсия',
            value: `${analyticsData.overview.conversionRate || 0}%`,
            change: analyticsData.overview.conversionRateChange || '0%',
            trend: (analyticsData.overview.conversionRateChange && String(analyticsData.overview.conversionRateChange).startsWith('+')) ? 'up' : 'down',
            icon: TrendingUp,
            description: 'Лоты → Продажи',
          },
        ];

      case UserRole.DISTRIBUTOR:
        return [
          {
            title: 'Потрачено',
            value: `${(analyticsData.overview.totalSpent || 0).toLocaleString()} ₽`,
            change: analyticsData.overview.totalSpentChange || '0%',
            trend: (analyticsData.overview.totalSpentChange && String(analyticsData.overview.totalSpentChange).startsWith('+')) ? 'up' : 'down',
            icon: DollarSign,
            description: 'Общие расходы на закупки',
          },
          {
            title: 'Выигранные лоты',
            value: analyticsData.overview.wonBids || 0,
            change: analyticsData.overview.wonBidsChange || '0%',
            trend: (analyticsData.overview.wonBidsChange && String(analyticsData.overview.wonBidsChange).startsWith('+')) ? 'up' : 'down',
            icon: Gavel,
            description: 'Успешные покупки',
          },
          {
            title: 'Процент побед',
            value: `${analyticsData.overview.winRate || 0}%`,
            change: analyticsData.overview.winRateChange || '0%',
            trend: (analyticsData.overview.winRateChange && String(analyticsData.overview.winRateChange).startsWith('+')) ? 'up' : 'down',
            icon: TrendingUp,
            description: 'Ставки → Победы',
          },
          {
            title: 'Средняя ставка',
            value: `${(analyticsData.overview.averageBidAmount || 0).toLocaleString()} ₽`,
            change: analyticsData.overview.averageBidAmountChange || '0%',
            trend: (analyticsData.overview.averageBidAmountChange && String(analyticsData.overview.averageBidAmountChange).startsWith('+')) ? 'up' : 'down',
            icon: BarChart3,
            description: 'Средний размер ставки',
          },
        ];

      case UserRole.INVESTOR:
        return [
          {
            title: 'Портфель',
            value: `${(analyticsData.overview.totalInvested || 0).toLocaleString()} ₽`,
            change: analyticsData.overview.totalInvestedChange || '0%',
            trend: (analyticsData.overview.totalInvestedChange && String(analyticsData.overview.totalInvestedChange).startsWith('+')) ? 'up' : 'down',
            icon: DollarSign,
            description: 'Общая сумма инвестиций',
          },
          {
            title: 'Доходность',
            value: `${analyticsData.overview.totalReturns || 0}%`,
            change: analyticsData.overview.totalReturnsChange || '0%',
            trend: (analyticsData.overview.totalReturnsChange && String(analyticsData.overview.totalReturnsChange).startsWith('+')) ? 'up' : 'down',
            icon: TrendingUp,
            description: 'Годовая доходность',
          },
          {
            title: 'Активные проекты',
            value: analyticsData.overview.activeInvestments || 0,
            change: analyticsData.overview.activeInvestmentsChange || '0',
            trend: (analyticsData.overview.activeInvestmentsChange && String(analyticsData.overview.activeInvestmentsChange).startsWith('+')) ? 'up' : 'down',
            icon: Activity,
            description: 'Проекты в портфеле',
          },
          {
            title: 'Прибыль',
            value: `${(analyticsData.overview.totalProfit || 0).toLocaleString()} ₽`,
            change: analyticsData.overview.totalProfitChange || '0%',
            trend: (analyticsData.overview.totalProfitChange && String(analyticsData.overview.totalProfitChange).startsWith('+')) ? 'up' : 'down',
            icon: BarChart3,
            description: 'Чистая прибыль',
          },
        ];

      default:
        return [];
    }
  };

  const metricsCards = getMetricsCards();

  if (isLoading && !analyticsData) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <Skeleton className="h-8 w-48" />
            <Skeleton className="mt-2 h-4 w-96" />
          </div>
          <div className="flex gap-2">
            <Skeleton className="h-10 w-32" />
            <Skeleton className="h-10 w-24" />
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={`analytics-skeleton-${i}`}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-4" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-16" />
                <Skeleton className="mt-2 h-3 w-20" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Заголовок */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-text-heading">Аналитика</h1>
          <p className="text-text-body">
            Подробная статистика и анализ вашей деятельности
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={selectedPeriod} onValueChange={handlePeriodChange}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Выберите период" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Последние 7 дней</SelectItem>
              <SelectItem value="30">Последние 30 дней</SelectItem>
              <SelectItem value="90">Последние 90 дней</SelectItem>
              <SelectItem value="365">Последний год</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="icon" onClick={handleRefresh}>
            <RefreshCw className="h-4 w-4" />
          </Button>
          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Экспорт
          </Button>
        </div>
      </div>

      {/* Метрики */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {metricsCards.map((card, index) => (
          <Card key={`metrics-${index}`}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{card.title}</CardTitle>
              <card.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{String(card.value)}</div>
              <div className="flex items-center text-xs text-muted-foreground">
                {card.trend === 'up' ? (
                  <TrendingUp className="mr-1 h-3 w-3 text-green-500" />
                ) : (
                  <TrendingDown className="mr-1 h-3 w-3 text-red-500" />
                )}
                <span className={card.trend === 'up' ? 'text-green-500' : 'text-red-500'}>
                  {String(card.change)}
                </span>
                <span className="ml-1">за период</span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">{card.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Детальная аналитика */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Обзор</TabsTrigger>
          <TabsTrigger value="trends">Тренды</TabsTrigger>
          <TabsTrigger value="performance">Эффективность</TabsTrigger>
          <TabsTrigger value="comparison">Сравнение</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Динамика показателей
                </CardTitle>
                <CardDescription>
                  Изменение ключевых метрик за {selectedPeriod} дней
                </CardDescription>
              </CardHeader>
              <CardContent>
                {analyticsData?.charts && (
                  <DashboardChart data={analyticsData.charts} userRole={user?.role as UserRole} />
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Активность по дням
                </CardTitle>
                <CardDescription>
                  Распределение активности в течение недели
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {analyticsData?.weeklyActivity ? (
                    analyticsData.weeklyActivity.map((dayData) => (
                      <div key={dayData.day} className="flex items-center justify-between">
                        <span className="text-sm font-medium">{dayData.day}</span>
                        <div className="flex items-center gap-2">
                          <div className="w-24 bg-muted rounded-full h-2">
                            <div 
                              className="bg-primary h-2 rounded-full" 
                              style={{ width: `${dayData.percentage}%` }}
                            />
                          </div>
                          <span className="text-sm text-muted-foreground w-8">{dayData.percentage}%</span>
                        </div>
                      </div>
                    ))
                  ) : (
                    // Показываем скелетон пока данные загружаются
                    ['Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота', 'Воскресенье'].map((day) => (
                      <div key={day} className="flex items-center justify-between">
                        <span className="text-sm font-medium">{day}</span>
                        <div className="flex items-center gap-2">
                          <div className="w-24 bg-muted rounded-full h-2">
                            <div className="bg-muted-foreground/20 h-2 rounded-full animate-pulse" />
                          </div>
                          <span className="text-sm text-muted-foreground w-8">--</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="trends" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Анализ трендов</CardTitle>
              <CardDescription>
                Долгосрочные тенденции и прогнозы
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <TrendingUp className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Анализ трендов</h3>
                <p className="text-muted-foreground">
                  Детальный анализ трендов будет доступен в следующих версиях
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="performance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Показатели эффективности</CardTitle>
              <CardDescription>
                KPI и метрики производительности
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Анализ эффективности</h3>
                <p className="text-muted-foreground">
                  Подробные KPI и метрики будут добавлены в ближайшее время
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="comparison" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Сравнительный анализ</CardTitle>
              <CardDescription>
                Сравнение с предыдущими периодами
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <Activity className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Сравнительный анализ</h3>
                <p className="text-muted-foreground">
                  Функция сравнения периодов находится в разработке
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Дополнительная информация */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Информация о данных
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <div className="text-sm font-medium">Период анализа</div>
              <div className="text-2xl font-bold">{selectedPeriod} дней</div>
              <div className="text-xs text-muted-foreground">
                {analyticsData?.period || 'Данные загружаются...'}
              </div>
            </div>
            <div>
              <div className="text-sm font-medium">Последнее обновление</div>
              <div className="text-2xl font-bold">
                {analyticsData?.generatedAt 
                  ? new Date(analyticsData.generatedAt).toLocaleTimeString('ru-RU', { 
                      hour: '2-digit', 
                      minute: '2-digit' 
                    })
                  : '--:--'
                }
              </div>
              <div className="text-xs text-muted-foreground">
                {analyticsData?.generatedAt 
                  ? new Date(analyticsData.generatedAt).toLocaleDateString('ru-RU')
                  : 'Данные загружаются...'
                }
              </div>
            </div>
            <div>
              <div className="text-sm font-medium">Роль пользователя</div>
              <div className="text-2xl font-bold">
                <Badge variant="outline" className="text-base">
                  {user?.role === UserRole.ADMIN && 'Администратор'}
                  {user?.role === UserRole.PRODUCER && 'Производитель'}
                  {user?.role === UserRole.DISTRIBUTOR && 'Дистрибьютор'}
                  {user?.role === UserRole.INVESTOR && 'Инвестор'}
                </Badge>
              </div>
              <div className="text-xs text-muted-foreground">
                Данные адаптированы под вашу роль
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
