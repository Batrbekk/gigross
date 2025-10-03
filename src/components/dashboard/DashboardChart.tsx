'use client';

import { Area, AreaChart, Bar, BarChart, ResponsiveContainer, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { EmptyState } from '@/components/ui/empty-state';
import { UserRole } from '@/types';
import { BarChart3 } from 'lucide-react';

interface DashboardChartProps {
  data: Record<string, any>;
  userRole: UserRole;
}

export function DashboardChart({ data, userRole }: DashboardChartProps) {
  // Используем реальные данные из API
  const chartData = data?.chartData || [];

  // Проверяем, есть ли данные для отображения
  if (!chartData || chartData.length === 0) {
    return (
      <EmptyState
        icon={BarChart3}
        title="Нет данных для графика"
        description="Данные для аналитики пока недоступны"
        className="h-[300px] min-h-[300px]"
      />
    );
  }

  const getChartConfig = () => {
    switch (userRole) {
      case UserRole.PRODUCER:
        return {
          revenue: {
            label: 'Доходы',
            color: 'hsl(var(--chart-1))',
          },
          orders: {
            label: 'Заказы',
            color: 'hsl(var(--chart-2))',
          },
          products: {
            label: 'Продукты',
            color: 'hsl(var(--chart-3))',
          },
        };
      case UserRole.DISTRIBUTOR:
        return {
          spending: {
            label: 'Расходы',
            color: 'hsl(var(--chart-1))',
          },
          bids: {
            label: 'Ставки',
            color: 'hsl(var(--chart-2))',
          },
          wins: {
            label: 'Победы',
            color: 'hsl(var(--chart-3))',
          },
        };
      case UserRole.INVESTOR:
        return {
          investments: {
            label: 'Инвестиции',
            color: 'hsl(var(--chart-1))',
          },
          returns: {
            label: 'Доходность',
            color: 'hsl(var(--chart-2))',
          },
          profit: {
            label: 'Прибыль',
            color: 'hsl(var(--chart-3))',
          },
        };
      case UserRole.ADMIN:
        return {
          users: {
            label: 'Пользователи',
            color: 'hsl(var(--chart-1))',
          },
          transactions: {
            label: 'Транзакции',
            color: 'hsl(var(--chart-2))',
          },
          revenue: {
            label: 'Оборот',
            color: 'hsl(var(--chart-3))',
          },
        };
      default:
        return {
          value: {
            label: 'Значение',
            color: 'hsl(var(--chart-1))',
          },
        };
    }
  };

  const chartConfig = getChartConfig();

  if (userRole === UserRole.PRODUCER) {
    return (
      <ChartContainer config={chartConfig} className="h-[300px]">
        <AreaChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" />
          <YAxis />
          <ChartTooltip content={<ChartTooltipContent />} />
          <Area
            type="monotone"
            dataKey="revenue"
            stackId="1"
            stroke={chartConfig.revenue.color}
            fill={chartConfig.revenue.color}
            fillOpacity={0.6}
          />
        </AreaChart>
      </ChartContainer>
    );
  }

  if (userRole === UserRole.DISTRIBUTOR) {
    return (
      <ChartContainer config={chartConfig} className="h-[300px]">
        <BarChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" />
          <YAxis />
          <ChartTooltip content={<ChartTooltipContent />} />
          <Bar dataKey="bids" fill={chartConfig.bids.color} />
          <Bar dataKey="wins" fill={chartConfig.wins.color} />
        </BarChart>
      </ChartContainer>
    );
  }

  if (userRole === UserRole.INVESTOR) {
    return (
      <ChartContainer config={chartConfig} className="h-[300px]">
        <AreaChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" />
          <YAxis />
          <ChartTooltip content={<ChartTooltipContent />} />
          <Area
            type="monotone"
            dataKey="investments"
            stackId="1"
            stroke={chartConfig.investments.color}
            fill={chartConfig.investments.color}
            fillOpacity={0.8}
          />
          <Area
            type="monotone"
            dataKey="profit"
            stackId="1"
            stroke={chartConfig.profit.color}
            fill={chartConfig.profit.color}
            fillOpacity={0.6}
          />
        </AreaChart>
      </ChartContainer>
    );
  }

  if (userRole === UserRole.ADMIN) {
    return (
      <ChartContainer config={chartConfig} className="h-[300px]">
        <AreaChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" />
          <YAxis />
          <ChartTooltip content={<ChartTooltipContent />} />
          <Area
            type="monotone"
            dataKey="users"
            stackId="1"
            stroke={chartConfig.users.color}
            fill={chartConfig.users.color}
            fillOpacity={0.8}
          />
          <Area
            type="monotone"
            dataKey="transactions"
            stackId="1"
            stroke={chartConfig.transactions.color}
            fill={chartConfig.transactions.color}
            fillOpacity={0.6}
          />
        </AreaChart>
      </ChartContainer>
    );
  }

  return (
    <ChartContainer config={chartConfig} className="h-[300px]">
      <AreaChart data={chartData}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="date" />
        <YAxis />
        <ChartTooltip content={<ChartTooltipContent />} />
        <Area
          type="monotone"
          dataKey="value"
          stroke={chartConfig.value.color}
          fill={chartConfig.value.color}
          fillOpacity={0.6}
        />
      </AreaChart>
    </ChartContainer>
  );
}
