'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/empty-state';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useApi } from '@/hooks/useApi';
import { useAuthStore } from '@/stores/authStore';
import { formatCurrency as formatCurrencyUtil, CurrencyCode } from '@/lib/currency';
import { 
  DollarSign,
  TrendingUp,
  TrendingDown,
  Calendar,
  BarChart3,
  PieChart,
  Download
} from 'lucide-react';

interface RevenueData {
  totalRevenue: number;
  monthlyRevenue: number;
  revenueGrowth: number;
  topProducts: Array<{
    productId: string;
    productName: string;
    revenue: number;
    sales: number;
  }>;
  monthlyData: Array<{
    month: string;
    revenue: number;
    orders: number;
  }>;
  revenueByCategory: Array<{
    category: string;
    revenue: number;
    percentage: number;
  }>;
}

export default function RevenuePage() {
  const { user } = useAuthStore();
  const { execute, isLoading } = useApi();
  const [revenueData, setRevenueData] = useState<RevenueData | null>(null);
  const [period, setPeriod] = useState('12'); // months

  const fetchRevenueData = async (selectedPeriod = '12') => {
    try {
      const response = await execute(`/api/analytics/revenue?period=${selectedPeriod}`, { method: 'GET' });
      if (response && response.success) {
        setRevenueData(response.data as RevenueData);
      }
    } catch (error) {
      console.error('Failed to fetch revenue data:', error);
    }
  };

  useEffect(() => {
    fetchRevenueData(period);
  }, [period]); // eslint-disable-line react-hooks/exhaustive-deps

  const handlePeriodChange = (newPeriod: string) => {
    setPeriod(newPeriod);
    fetchRevenueData(newPeriod);
  };

  const formatCurrency = (amount: number) => {
    const userCurrency = user?.preferences?.currency || 'KZT';
    return formatCurrencyUtil(amount, userCurrency as CurrencyCode);
  };

  const formatPercentage = (value: number) => {
    const sign = value >= 0 ? '+' : '';
    return `${sign}${value.toFixed(1)}%`;
  };

  if (isLoading && !revenueData) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <Skeleton className="h-8 w-48" />
            <Skeleton className="mt-2 h-4 w-96" />
          </div>
          <Skeleton className="h-10 w-32" />
        </div>
        
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={`revenue-skeleton-${i}`}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-4" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-20" />
                <Skeleton className="mt-2 h-3 w-16" />
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-32" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-[300px] w-full" />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-32" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-[300px] w-full" />
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Заголовок */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Доходы</h1>
          <p className="text-muted-foreground">
            Анализ доходов и финансовых показателей
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={period} onValueChange={handlePeriodChange}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Выберите период" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="3">Последние 3 месяца</SelectItem>
              <SelectItem value="6">Последние 6 месяцев</SelectItem>
              <SelectItem value="12">Последний год</SelectItem>
              <SelectItem value="24">Последние 2 года</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Экспорт
          </Button>
        </div>
      </div>

      {!revenueData ? (
        <EmptyState
          icon={DollarSign}
          title="Нет данных о доходах"
          description="Данные о доходах пока недоступны. Они появятся после совершения продаж."
          className="h-[400px] min-h-[400px]"
        />
      ) : (
        <>
          {/* Основные метрики */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Общий доход
                </CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatCurrency(revenueData.totalRevenue)}
                </div>
                <p className="text-xs text-muted-foreground">
                  За выбранный период
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Месячный доход
                </CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatCurrency(revenueData.monthlyRevenue)}
                </div>
                <p className="text-xs text-muted-foreground">
                  Текущий месяц
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Рост доходов
                </CardTitle>
                {revenueData.revenueGrowth >= 0 ? (
                  <TrendingUp className="h-4 w-4 text-green-600" />
                ) : (
                  <TrendingDown className="h-4 w-4 text-red-600" />
                )}
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatPercentage(revenueData.revenueGrowth)}
                </div>
                <p className="text-xs text-muted-foreground">
                  По сравнению с предыдущим периодом
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Средний чек
                </CardTitle>
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatCurrency(
                    revenueData.monthlyData.reduce((sum, item) => sum + item.orders, 0) > 0
                      ? revenueData.totalRevenue / revenueData.monthlyData.reduce((sum, item) => sum + item.orders, 0)
                      : 0
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  За выбранный период
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Графики и таблицы */}
          <div className="grid gap-6 md:grid-cols-2">
            {/* Топ продукты */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Топ продукты по доходам
                </CardTitle>
                <CardDescription>
                  Самые прибыльные продукты за период
                </CardDescription>
              </CardHeader>
              <CardContent>
                {revenueData.topProducts.length === 0 ? (
                  <EmptyState
                    icon={BarChart3}
                    title="Нет данных"
                    description="Данные о продуктах пока недоступны"
                    className="h-[200px] min-h-[200px]"
                  />
                ) : (
                  <div className="space-y-4">
                    {revenueData.topProducts.slice(0, 5).map((product, index) => (
                      <div key={product.productId} className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary font-semibold text-sm">
                            {index + 1}
                          </div>
                          <div>
                            <div className="font-medium">{product.productName}</div>
                            <div className="text-sm text-muted-foreground">
                              {product.sales} продаж
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-medium">
                            {formatCurrency(product.revenue)}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Доходы по категориям */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieChart className="h-5 w-5" />
                  Доходы по категориям
                </CardTitle>
                <CardDescription>
                  Распределение доходов по категориям продуктов
                </CardDescription>
              </CardHeader>
              <CardContent>
                {revenueData.revenueByCategory.length === 0 ? (
                  <EmptyState
                    icon={PieChart}
                    title="Нет данных"
                    description="Данные по категориям пока недоступны"
                    className="h-[200px] min-h-[200px]"
                  />
                ) : (
                  <div className="space-y-4">
                    {revenueData.revenueByCategory.map((category) => (
                      <div key={category.category} className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="font-medium">{category.category}</div>
                          <Badge variant="outline">
                            {category.percentage.toFixed(1)}%
                          </Badge>
                        </div>
                        <div className="font-medium">
                          {formatCurrency(category.revenue)}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Месячная динамика */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Динамика доходов
              </CardTitle>
              <CardDescription>
                Помесячная динамика доходов и количества заказов
              </CardDescription>
            </CardHeader>
            <CardContent>
              {revenueData.monthlyData.length === 0 ? (
                <EmptyState
                  icon={TrendingUp}
                  title="Нет данных"
                  description="Данные по месяцам пока недоступны"
                  className="h-[300px] min-h-[300px]"
                />
              ) : (
                <div className="space-y-4">
                  {revenueData.monthlyData.map((month) => (
                    <div key={month.month} className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <div className="font-medium">{month.month}</div>
                        <div className="text-sm text-muted-foreground">
                          {month.orders} заказов
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-medium text-lg">
                          {formatCurrency(month.revenue)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
