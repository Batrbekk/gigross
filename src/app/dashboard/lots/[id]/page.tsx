'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { useApi } from '@/hooks/useApi';
import { formatCurrency } from '@/lib/currency';
import { useAuthStore } from '@/stores/authStore';
import { AuctionTimer } from '@/components/auction/AuctionTimer';
import { BidsList } from '@/components/auction/BidsList';
import { BidModal } from '@/components/auction/BidModal';
import { useBidsPolling } from '@/hooks/useBidsPolling';
import {
  ArrowLeft,
  Package,
  Building2,
  MapPin,
  Clock,
  Users,
  Gavel,
  AlertCircle,
  CheckCircle,
  Star,
  Phone,
  Mail,
  Wifi,
  WifiOff,
} from 'lucide-react';
import { EmptyState } from '@/components/ui/empty-state';

interface LotDetails {
  _id: string;
  title: string;
  description: string;
  quantity: number;
  unit: string;
  startingPrice: number;
  currentPrice: number;
  status: 'active' | 'sold' | 'expired' | 'cancelled';
  endDate?: string;
  createdAt: string;
  auction?: {
    startDate: string;
    endDate: string;
    type: string;
  };
  location?: {
    city: string;
    country: string;
    street: string;
    house: string;
    coordinates: number[];
  };
  currency?: string;
  producerId?: {
    _id: string;
    profile?: {
      firstName?: string;
      lastName?: string;
      company?: string;
      phoneNumber?: string;
      address?: string;
      rating?: number;
    };
    email?: string;
  };
  productId?: {
    _id: string;
    name?: string;
    images?: string[];
    category?: string;
    description?: string;
  };
  bidsCount?: number;
  viewsCount?: number;
  myBid?: {
    amount: number;
    isWinning: boolean;
  };
}

export default function LotDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const { execute, isLoading } = useApi();
  const { user } = useAuthStore();
  const [lot, setLot] = useState<LotDetails | null>(null);
  const [isBidModalOpen, setIsBidModalOpen] = useState(false);

  const lotId = params.id as string;

  // Polling обновления для конкретного лота каждые 5 секунд
  const { 
    isConnected: isPollingConnected 
  } = useBidsPolling({
    lotId: lotId,
    interval: 5000, // 5 секунд для страницы лота
    enabled: true,
    onBidsUpdate: (data) => {
      console.log('Lot bids updated via polling:', data.length, 'bids');
      // Обновляем данные лота при получении новых ставок без loading состояния
      refreshLotDetails();
    },
    onError: (error) => {
      console.error('Polling error:', error);
    },
  });

  const fetchLotDetails = async () => {
    try {
      // setRefreshing(true);
      const response = await execute(`/api/lots/${lotId}`, { method: 'GET' });
      
      if (response && response.success) {
        setLot(response.data as LotDetails);
      }
    } catch (error) {
      console.error('Error fetching lot details:', error);
    } finally {
      // setRefreshing(false);
    }
  };

  // Функция для обновления данных лота без loading состояния (для polling)
  const refreshLotDetails = async () => {
    try {
      const { tokens } = useAuthStore.getState();
      
      const response = await fetch(`/api/lots/${lotId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...(tokens?.accessToken && { Authorization: `Bearer ${tokens.accessToken}` }),
        },
      });

      const result = await response.json();
      
      if (result && result.success) {
        setLot(result.data);
      }
    } catch (error) {
      console.error('Error refreshing lot details:', error);
    }
  };

  useEffect(() => {
    if (lotId) {
      fetchLotDetails();
    }
  }, [lotId]);

  const handleBidPlaced = (_newBid: Record<string, unknown>) => {
    // Обновляем данные лота после размещения ставки
    fetchLotDetails();
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      active: { label: 'Активен', variant: 'default' as const, className: 'bg-green-100 text-green-800' },
      sold: { label: 'Продан', variant: 'default' as const, className: 'bg-blue-100 text-blue-800' },
      expired: { label: 'Завершен', variant: 'secondary' as const, className: 'bg-gray-100 text-gray-800' },
      cancelled: { label: 'Отменен', variant: 'destructive' as const, className: 'bg-red-100 text-red-800' },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.expired;
    
    return (
      <Badge variant={config.variant} className={config.className}>
        {config.label}
      </Badge>
    );
  };

  const translateCategory = (category: string) => {
    const translations: { [key: string]: string } = {
      'beverages': 'Напитки',
      'food': 'Продукты питания',
      'electronics': 'Электроника',
      'clothing': 'Одежда',
      'books': 'Книги',
      'toys': 'Игрушки',
      'home': 'Товары для дома',
      'sports': 'Спорт',
      'beauty': 'Красота',
      'automotive': 'Автомобили',
    };
    return translations[category] || category;
  };

  // formatDate function removed as it's not used

  const isAuctionActive = lot && new Date(lot.auction?.endDate || lot.endDate || '') > new Date();
  const canPlaceBid = lot && lot.status === 'active' && isAuctionActive && lot.producerId?._id !== user?.id;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10" />
          <div className="space-y-2">
            <Skeleton className="h-8 w-96" />
            <Skeleton className="h-4 w-64" />
          </div>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Skeleton className="h-64 w-full" />
            <Skeleton className="h-48 w-full" />
          </div>
          <div className="space-y-6">
            <Skeleton className="h-48 w-full" />
            <Skeleton className="h-96 w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (!lot) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <EmptyState
          icon={Package}
          title="Лот не найден"
          description="Запрашиваемый лот не существует или был удален"
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Заголовок */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.back()}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Назад
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-3xl font-bold tracking-tight">{lot.title}</h1>
            {getStatusBadge(lot.status)}
            <div className="flex items-center gap-1">
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
            </div>
          </div>
          <p className="text-muted-foreground">
            Лот #{lot._id.slice(-8).toUpperCase()}
          </p>
        </div>
      </div>

      {/* Основной контент */}
      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
        {/* Левая колонка - информация о лоте */}
        <div className="xl:col-span-3 space-y-6">
          {/* Главное изображение продукта */}
          {lot.productId?.images && lot.productId.images.length > 0 && (
            <Card>
              <CardContent className="p-6">
                <div className="space-y-4">
                  {/* Главное изображение */}
                  <div className="relative">
                    <img
                      src={lot.productId.images[0]}
                      alt={lot.productId?.name || 'Продукт'}
                      className="w-full h-64 md:h-80 object-cover rounded-lg"
                    />
                  </div>
                  
                  {/* Дополнительные изображения */}
                  {lot.productId.images.length > 1 && (
                    <div className="grid grid-cols-4 gap-2">
                      {lot.productId.images.slice(1, 5).map((image: string, index: number) => (
                        <img
                          key={index}
                          src={image}
                          alt={`${lot.productId?.name} ${index + 2}`}
                          className="w-full h-16 object-cover rounded-lg"
                        />
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Описание */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Описание
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground leading-relaxed">
                {lot.description}
              </p>
              
              <Separator className="my-4" />
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium mb-2">Количество</h4>
                  <p className="text-sm text-muted-foreground">
                    {lot.quantity} {lot.unit}
                  </p>
                </div>
                
                {lot.productId?.category && (
                  <div>
                    <h4 className="font-medium mb-2">Категория</h4>
                    <Badge variant="outline">
                      {translateCategory(lot.productId.category)}
                    </Badge>
                  </div>
                )}
                
                {lot.location && (
                  <div>
                    <h4 className="font-medium mb-2">Местоположение</h4>
                    <p className="text-sm text-muted-foreground">
                      {lot.location.city}, {lot.location.country}
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Информация о продавце */}
          {lot.producerId && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5" />
                  Продавец
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium">
                      {lot.producerId.profile?.company || 'Компания не указана'}
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      {lot.producerId.profile?.firstName} {lot.producerId.profile?.lastName}
                    </p>
                    {lot.producerId.profile?.rating && (
                      <div className="flex items-center gap-1 mt-1">
                        <Star className="h-4 w-4 text-yellow-500 fill-current" />
                        <span className="text-sm font-medium">
                          {lot.producerId.profile.rating.toFixed(1)}
                        </span>
                      </div>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    {lot.producerId.profile?.phoneNumber && (
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4 text-muted-foreground" />
                        <span>{lot.producerId.profile.phoneNumber}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <span>{lot.producerId.email}</span>
                    </div>
                    {lot.producerId.profile?.address && (
                      <div className="flex items-center gap-2 md:col-span-2">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        <span>{lot.producerId.profile.address}</span>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Правая колонка - аукцион и ставки */}
        <div className="xl:col-span-1 space-y-6">
          {/* Информация об аукционе */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Gavel className="h-5 w-5" />
                Аукцион
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Таймер */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">До окончания:</span>
                </div>
                <AuctionTimer 
                  endDate={lot.auction?.endDate || lot.endDate || ''}
                  variant="detailed"
                  className="text-lg"
                />
              </div>

              <Separator />

              {/* Цены */}
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Стартовая цена:</span>
                  <span className="font-medium">
                    {formatCurrency(lot.startingPrice, lot.currency || 'KZT')}
                  </span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Текущая цена:</span>
                  <span className="text-xl font-bold text-green-600">
                    {formatCurrency(lot.currentPrice, lot.currency || 'KZT')}
                  </span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Рост цены:</span>
                  <span className="font-medium text-green-600">
                    +{formatCurrency(lot.currentPrice - lot.startingPrice, lot.currency || 'KZT')}
                  </span>
                </div>
              </div>

              <Separator />

              {/* Статистика */}
              <div className="flex items-center gap-2 text-sm">
                <Users className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="font-medium">{lot.bidsCount || 0}</p>
                  <p className="text-muted-foreground">Ставок</p>
                </div>
              </div>

              {/* Моя ставка */}
              {lot.myBid && (
                <>
                  <Separator />
                  <div className="p-3 bg-blue-50 rounded-lg">
                    <div className="flex items-center gap-2 mb-1">
                      <CheckCircle className="h-4 w-4 text-blue-600" />
                      <span className="text-sm font-medium text-blue-900">Моя ставка</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="font-semibold text-blue-900">
                        {formatCurrency(lot.myBid.amount, lot.currency || 'KZT')}
                      </span>
                      {lot.myBid.isWinning && (
                        <Badge className="bg-green-100 text-green-800">
                          Лидирует
                        </Badge>
                      )}
                    </div>
                  </div>
                </>
              )}

              {/* Кнопка ставки */}
              {canPlaceBid && (
                <Button 
                  className="w-full" 
                  size="lg"
                  onClick={() => setIsBidModalOpen(true)}
                >
                  <Gavel className="h-4 w-4 mr-2" />
                  {lot.myBid ? 'Изменить ставку' : 'Сделать ставку'}
                </Button>
              )}

              {!canPlaceBid && lot.status === 'active' && (
                <div className="p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 text-gray-500" />
                    <span className="text-sm text-gray-600">
                      {lot.producerId?._id === user?.id 
                        ? 'Вы не можете делать ставки на свои лоты'
                        : 'Аукцион завершен'
                      }
                    </span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Список ставок */}
          <BidsList
            lotId={lotId}
            currentPrice={lot.currentPrice}
            currency={lot.currency || 'KZT'}
            maxHeight="500px"
          />
        </div>
      </div>

      {/* Модальное окно ставки */}
      <BidModal
        isOpen={isBidModalOpen}
        onClose={() => setIsBidModalOpen(false)}
        lotId={lotId}
        lotTitle={lot.title}
        currentPrice={lot.currentPrice}
        currency={lot.currency || 'KZT'}
        endDate={lot.auction?.endDate || lot.endDate || ''}
        onBidPlaced={handleBidPlaced}
      />
    </div>
  );
}