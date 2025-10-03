'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useApi } from '@/hooks/useApi';
import { formatCurrency, CurrencyCode } from '@/lib/currency';
import { 
  Gavel, 
  Search, 
  Clock, 
  TrendingUp,
  Users,
  Calendar,
  MapPin,
  Package,
  Timer
} from 'lucide-react';
import { EmptyState } from '@/components/ui/empty-state';

interface Auction {
  _id: string;
  title: string;
  description: string;
  startingPrice: number;
  currentPrice: number;
  status: 'active' | 'sold' | 'expired' | 'cancelled';
  endDate: string;
  createdAt: string;
  producerId?: {
    _id: string;
    profile?: {
      firstName?: string;
      lastName?: string;
      company?: string;
    };
  };
  productId?: {
    _id: string;
    name?: string;
    images?: string[];
  };
  bidsCount: number;
  myBid?: {
    amount: number;
    isWinning: boolean;
  };
}

export default function AuctionsPage() {
  const { execute, isLoading } = useApi();
  const [auctions, setAuctions] = useState<Auction[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const [priceRange, setPriceRange] = useState('all');

  const fetchAuctions = async () => {
    try {
      const params = new URLSearchParams();
      params.append('status', 'active'); // Только активные торги
      if (searchQuery) params.append('search', searchQuery);
      params.append('sort', sortBy);
      if (priceRange !== 'all') params.append('priceRange', priceRange);

      const response = await execute(`/api/lots?${params.toString()}`, { method: 'GET' });
      if (response && response.success) {
        setAuctions(response.data.data || response.data);
      }
    } catch (error) {
      console.error('Error fetching auctions:', error);
    }
  };

  useEffect(() => {
    fetchAuctions();
  }, [searchQuery, sortBy, priceRange]);

  const getTimeRemaining = (endDate: string) => {
    try {
      const now = new Date();
      const end = new Date(endDate);
      
      // Проверяем, что дата валидна
      if (isNaN(end.getTime())) {
        return { text: 'Неверная дата', isUrgent: false };
      }
      
      const diff = end.getTime() - now.getTime();
      
      if (diff <= 0) {
        return { text: 'Завершен', isUrgent: false };
      }
      
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      
      let text = '';
      let isUrgent = false;
      
      if (days > 0) {
        text = `${days}д ${hours}ч`;
      } else if (hours > 0) {
        text = `${hours}ч ${minutes}м`;
        isUrgent = hours < 2; // Срочно если меньше 2 часов
      } else {
        text = `${minutes}м`;
        isUrgent = true; // Срочно если меньше часа
      }
      
      return { text, isUrgent };
    } catch (error) {
      console.error('Error calculating time remaining:', error);
      return { text: 'Ошибка расчета', isUrgent: false };
    }
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      
      // Проверяем, что дата валидна
      if (isNaN(date.getTime())) {
        return 'Неверная дата';
      }
      
      return date.toLocaleDateString('ru-RU', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'Ошибка даты';
    }
  };

  const handlePlaceBid = (auctionId: string) => {
    // TODO: Реализовать модальное окно для размещения ставки
    console.log('Place bid for auction:', auctionId);
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
        <h1 className="text-3xl font-bold tracking-tight">Активные торги</h1>
        <p className="text-muted-foreground">
          Участвуйте в торгах и находите лучшие предложения
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
          <Select value={priceRange} onValueChange={setPriceRange}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Цена" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Любая цена</SelectItem>
              <SelectItem value="0-10000">До 10,000 ₸</SelectItem>
              <SelectItem value="10000-50000">10,000 - 50,000 ₸</SelectItem>
              <SelectItem value="50000-100000">50,000 - 100,000 ₸</SelectItem>
              <SelectItem value="100000+">От 100,000 ₸</SelectItem>
            </SelectContent>
          </Select>
          
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Сортировка" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Новые</SelectItem>
              <SelectItem value="ending_soon">Скоро завершаются</SelectItem>
              <SelectItem value="price_low">Цена ↑</SelectItem>
              <SelectItem value="price_high">Цена ↓</SelectItem>
              <SelectItem value="bids_high">Больше ставок</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Статистика */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Активных торгов</CardTitle>
            <Gavel className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{auctions.length}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Мои ставки</CardTitle>
            <TrendingUp className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {auctions.filter(auction => auction.myBid).length}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Выигрываю</CardTitle>
            <Users className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {auctions.filter(auction => auction.myBid?.isWinning).length}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Скоро завершаются</CardTitle>
            <Timer className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {auctions.filter(auction => {
                const timeRemaining = getTimeRemaining(auction.endDate);
                return timeRemaining.isUrgent && !timeRemaining.text.includes('Завершен');
              }).length}
            </div>
          </CardContent>
        </Card>
          </div>

      {/* Список торгов */}
      {auctions.length === 0 ? (
            <EmptyState
              icon={Gavel}
          title="Активные торги не найдены"
          description="В данный момент нет активных торгов. Проверьте позже!"
            />
          ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {auctions.map((auction) => {
            const timeRemaining = getTimeRemaining(auction.endDate);
            
            return (
              <Card key={auction._id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-1 flex-1">
                      <CardTitle className="text-lg line-clamp-2">
                        {auction.title}
                      </CardTitle>
                      <CardDescription className="flex items-center gap-2">
                        <Package className="h-3 w-3" />
                        <span>{auction.productId?.name || 'Не указано'}</span>
                      </CardDescription>
                        </div>
                    <Badge variant="default" className="bg-green-100 text-green-800">
                      Активен
                    </Badge>
                        </div>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  {/* Информация о производителе */}
                  <div className="flex items-center gap-2 text-sm">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Производитель:</span>
                    <span className="font-medium">
                      {auction.producerId?.profile?.company || 'Не указано'}
                    </span>
                      </div>

                  {/* Цены */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Текущая цена:</span>
                      <span className="text-xl font-bold text-green-600">
                        {formatCurrency(auction.currentPrice, 'KZT')}
                      </span>
                      </div>
                    
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Стартовая цена:</span>
                      <span className="font-medium">
                        {formatCurrency(auction.startingPrice, 'KZT')}
                      </span>
                      </div>
                            </div>

                  {/* Моя ставка */}
                  {auction.myBid && (
                    <div className="p-3 bg-blue-50 rounded-lg">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-blue-700">Моя ставка:</span>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-blue-900">
                            {formatCurrency(auction.myBid.amount, 'KZT')}
                          </span>
                          {auction.myBid.isWinning && (
                            <Badge variant="default" className="bg-green-100 text-green-800 text-xs">
                              Выигрываю
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Статистика торгов */}
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">Ставок:</span>
                      <span className="font-medium">{auction.bidsCount}</span>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">Создан:</span>
                      <span className="font-medium">{formatDate(auction.createdAt)}</span>
                    </div>
                  </div>

                  {/* Время до окончания */}
                  <div className={`flex items-center gap-2 text-sm p-3 rounded-lg ${
                    timeRemaining.isUrgent 
                      ? 'bg-orange-50 text-orange-700' 
                      : 'bg-gray-50 text-gray-700'
                  }`}>
                    <Clock className="h-4 w-4" />
                    <span>До окончания:</span>
                    <span className={`font-semibold ${timeRemaining.isUrgent ? 'text-orange-800' : ''}`}>
                      {timeRemaining.text}
                    </span>
                  </div>

                  {/* Действия */}
                  <div className="pt-2 border-t space-y-2">
              <Button
                      className="w-full"
                      onClick={() => handlePlaceBid(auction._id)}
                    >
                      {auction.myBid ? 'Изменить ставку' : 'Сделать ставку'}
              </Button>
                    
                    <Button
                      variant="outline" 
                      className="w-full"
                      onClick={() => window.open(`/dashboard/lots/${auction._id}`, '_blank')}
                    >
                      Подробнее
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