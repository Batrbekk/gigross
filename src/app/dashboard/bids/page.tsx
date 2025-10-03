'use client';

import { useEffect, useState, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { useApi } from '@/hooks/useApi';
import { formatCurrency } from '@/lib/currency';
import { AuctionTimer } from '@/components/auction/AuctionTimer';
import {
  Search,
  Gavel,
  Trophy,
  TrendingUp,
  Clock,
  Package,
  Building2,
  Calendar,
  Eye,
  Filter,
  Wifi,
  WifiOff,
} from 'lucide-react';
import { EmptyState } from '@/components/ui/empty-state';
import { useBidsPolling } from '@/hooks/useBidsPolling';
import { useAuthStore } from '@/stores/authStore';
import Link from 'next/link';

interface Bid {
  _id: string;
  amount: number;
  currency: string;
  createdAt: string;
  status: 'active' | 'outbid' | 'winning' | 'expired';
  isWinning?: boolean;
  lotId: {
    _id: string;
    title: string;
    currentPrice: number;
    endDate?: string;
    auction?: {
      endDate: string;
    };
    status: 'active' | 'sold' | 'expired' | 'cancelled';
    producerId?: {
      profile?: {
        company?: string;
      };
    };
    productId?: {
      name?: string;
      images?: string[];
    };
  };
}

export default function BidsPage() {
  const { execute, isLoading } = useApi();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  const [refreshing, setRefreshing] = useState(false);

  // Polling обновления ставок каждые 10 секунд
  const { 
    bids, 
    isConnected: isPollingConnected, 
    refreshBids 
  } = useBidsPolling({
    interval: 10000, // 10 секунд
    enabled: true,
    onBidsUpdate: (data) => {
      console.log('Bids updated via polling:', data.length, 'bids');
    },
    onError: (error) => {
      console.error('Polling error:', error);
    },
  });

  const { debugTokens, refreshToken } = useAuthStore();

  // Функция для ручного обновления с фильтрами
  const fetchBidsWithFilters = useCallback(async () => {
    try {
      setRefreshing(true);
      const params = new URLSearchParams();
      if (searchQuery) params.append('search', searchQuery);
      if (statusFilter !== 'all') params.append('status', statusFilter);
      params.append('sort', sortBy);
      params.append('limit', '50');

      const response = await execute(`/api/bids?${params.toString()}`, { method: 'GET' });
      
      if (response && response.success) {
        // Обновляем локальное состояние для отображения отфильтрованных данных
        // Polling будет продолжать работать в фоне
        console.log('Filtered bids fetched:', response.data);
      }
    } catch (error) {
      console.error('Error fetching filtered bids:', error);
    } finally {
      setRefreshing(false);
    }
  }, [searchQuery, statusFilter, sortBy, execute]);

  useEffect(() => {
    // При изменении фильтров делаем запрос с фильтрами
    fetchBidsWithFilters();
  }, [fetchBidsWithFilters]);

  const getStatusBadge = (bid: Bid) => {
    const lotStatus = bid.lotId.status;
    const endDate = bid.lotId.auction?.endDate || bid.lotId.endDate;
    const isActuallyExpired = endDate && new Date(endDate) <= new Date();
    
    if (lotStatus === 'expired' || lotStatus === 'cancelled' || isActuallyExpired) {
      return { label: 'Завершен', variant: 'secondary' as const, className: 'bg-gray-100 text-gray-800' };
    }
    
    if (bid.isWinning) {
      return { label: 'Лидирует', variant: 'default' as const, className: 'bg-green-100 text-green-800' };
    }
    
    if (bid.status === 'outbid') {
      return { label: 'Перебито', variant: 'destructive' as const, className: 'bg-red-100 text-red-800' };
    }
    
    return { label: 'Активно', variant: 'outline' as const, className: 'bg-blue-100 text-blue-800' };
  };

  const getLotStatusBadge = (status: string, endDate?: string) => {
    // Проверяем, действительно ли аукцион завершен по времени
    const isActuallyExpired = endDate && new Date(endDate) <= new Date();
    
    const statusConfig = {
      active: { 
        label: isActuallyExpired ? 'Завершен' : 'Активен', 
        variant: isActuallyExpired ? 'secondary' as const : 'default' as const, 
        className: isActuallyExpired ? 'bg-gray-100 text-gray-800' : 'bg-green-100 text-green-800' 
      },
      sold: { label: 'Продан', variant: 'default' as const, className: 'bg-blue-100 text-blue-800' },
      expired: { label: 'Завершен', variant: 'secondary' as const, className: 'bg-gray-100 text-gray-800' },
      cancelled: { label: 'Отменен', variant: 'destructive' as const, className: 'bg-red-100 text-red-800' },
    };

    return statusConfig[status as keyof typeof statusConfig] || statusConfig.expired;
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('ru-RU', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return 'Неверная дата';
    }
  };


  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <Skeleton className="h-8 w-64" />
          <Skeleton className="mt-2 h-4 w-96" />
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <Card key={index}>
              <CardHeader>
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-24" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-4 w-3/4" />
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
      <div>
        <div className="flex items-center gap-3 mb-2">
          <h1 className="text-3xl font-bold tracking-tight">Мои ставки</h1>
          <div className="flex items-center gap-2">
            {isPollingConnected ? (
              <div className="flex items-center gap-1 text-green-600">
                <Wifi className="h-4 w-4" />
                <span className="text-sm font-medium">Автообновление</span>
              </div>
            ) : (
              <div className="flex items-center gap-1 text-gray-500">
                <WifiOff className="h-4 w-4" />
                <span className="text-sm font-medium">Офлайн</span>
              </div>
            )}
            <Button 
              variant="outline" 
              size="sm" 
              onClick={debugTokens}
              className="ml-2"
            >
              Debug Tokens
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={async () => {
                try {
                  console.log('Manually refreshing token...');
                  await refreshToken();
                  console.log('Token refreshed successfully');
                } catch (error) {
                  console.error('Failed to refresh token:', error);
                }
              }}
              className="ml-2"
            >
              Refresh Token
            </Button>
          </div>
        </div>
        <p className="text-muted-foreground">
          Управляйте своими ставками и отслеживайте результаты аукционов
        </p>
      </div>

      {/* Фильтры и поиск */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-1 items-center gap-2">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Поиск по лотам..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Статус" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Все статусы</SelectItem>
              <SelectItem value="active">Активные</SelectItem>
              <SelectItem value="winning">Лидирующие</SelectItem>
              <SelectItem value="outbid">Перебитые</SelectItem>
              <SelectItem value="expired">Завершенные</SelectItem>
            </SelectContent>
          </Select>
          
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Сортировка" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Новые</SelectItem>
              <SelectItem value="oldest">Старые</SelectItem>
              <SelectItem value="amount_high">Сумма ↓</SelectItem>
              <SelectItem value="amount_low">Сумма ↑</SelectItem>
            </SelectContent>
          </Select>
          
          <Button
            variant="outline"
            size="sm"
            onClick={refreshBids}
            disabled={refreshing}
          >
            <Filter className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Статистика */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Всего ставок</CardTitle>
            <Gavel className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{bids.length}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Лидирую</CardTitle>
            <Trophy className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {bids.filter(bid => bid.isWinning).length}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Активные</CardTitle>
            <TrendingUp className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {bids.filter(bid => bid.lotId.status === 'active').length}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Завершенные</CardTitle>
            <Clock className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-600">
              {bids.filter(bid => bid.lotId.status === 'expired' || bid.lotId.status === 'sold').length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Список ставок */}
      {bids.length === 0 ? (
        <EmptyState
          icon={Gavel}
          title="Ставки не найдены"
          description="Вы пока не делали ставки или они не соответствуют выбранным фильтрам"
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {bids.map((bid) => {
            const statusConfig = getStatusBadge(bid);
            const endDate = bid.lotId.auction?.endDate || bid.lotId.endDate;
            const lotStatusConfig = getLotStatusBadge(bid.lotId.status, endDate);
            const isAuctionActive = bid.lotId.status === 'active' && 
              new Date(endDate || '') > new Date();
            
            return (
              <Card key={bid._id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-1 flex-1">
                      <CardTitle className="text-lg line-clamp-2">
                        {bid.lotId.title}
                      </CardTitle>
                      <CardDescription className="flex items-center gap-2">
                        <Package className="h-3 w-3" />
                        <span className="truncate">
                          {bid.lotId.productId?.name || 'Продукт'}
                        </span>
                      </CardDescription>
                    </div>
                    <div className="flex flex-col gap-1">
                      <Badge variant={statusConfig.variant} className={statusConfig.className}>
                        {statusConfig.label}
                      </Badge>
                      <Badge variant={lotStatusConfig.variant} className={lotStatusConfig.className}>
                        {lotStatusConfig.label}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  {/* Информация о продавце */}
                  <div className="flex items-center gap-2 text-sm">
                    <Building2 className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Продавец:</span>
                    <span className="font-medium">
                      {bid.lotId.producerId?.profile?.company || 'Не указан'}
                    </span>
                  </div>

                  {/* Моя ставка */}
                  <div className="p-3 bg-blue-50 rounded-lg">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-blue-700">Моя ставка:</span>
                      <span className="font-semibold text-blue-900">
                        {formatCurrency(bid.amount, bid.currency)}
                      </span>
                    </div>
                    {bid.isWinning && (
                      <div className="flex items-center gap-1 mt-1">
                        <Trophy className="h-3 w-3 text-green-600" />
                        <span className="text-xs text-green-700 font-medium">
                          Лидирует
                        </span>
                      </div>
                    )}
                  </div>


                  {/* Время до окончания */}
                  {isAuctionActive && (
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-2 text-sm text-gray-700 mb-1">
                        <Clock className="h-4 w-4" />
                        <span>До окончания:</span>
                      </div>
                      <AuctionTimer 
                        endDate={bid.lotId.auction?.endDate || bid.lotId.endDate || ''}
                        variant="compact"
                        showIcon={false}
                        className="text-sm"
                      />
                    </div>
                  )}

                  {/* Даты */}
                  <div className="space-y-1 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      <span>Ставка: {formatDate(bid.createdAt)}</span>
                    </div>
                  </div>

                  {/* Действия */}
                  <div className="pt-2 border-t">
                    <Button 
                      variant="outline" 
                      className="w-full"
                      asChild
                    >
                      <Link href={`/dashboard/lots/${bid.lotId._id}`}>
                        <Eye className="h-4 w-4 mr-2" />
                        Посмотреть лот
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}