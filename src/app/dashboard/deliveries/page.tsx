'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useApi } from '@/hooks/useApi';
// Импорт валютного форматирования удален - неиспользуется
import { 
  Truck, 
  Search, 
  Package,
  Calendar,
  MapPin,
  Clock,
  CheckCircle,
  XCircle,
  Eye,
  RefreshCw,
  AlertCircle
} from 'lucide-react';
import { EmptyState } from '@/components/ui/empty-state';

interface Delivery {
  _id: string;
  purchaseId: string;
  lotId: {
    _id: string;
    title: string;
    productId: {
      _id: string;
      name: string;
      images: string[];
    };
    producerId: {
      _id: string;
      profile: {
        firstName: string;
        lastName: string;
        company: string;
      };
    };
  };
  status: 'preparing' | 'shipped' | 'in_transit' | 'delivered' | 'cancelled' | 'returned';
  trackingNumber: string;
  carrier: string;
  shippingAddress: {
    street: string;
    city: string;
    postalCode: string;
    country: string;
    contactName: string;
    contactPhone: string;
  };
  estimatedDelivery: string;
  actualDelivery?: string;
  deliveryNotes?: string;
  createdAt: string;
  updatedAt: string;
}

export default function DeliveriesPage() {
  const { execute, isLoading } = useApi();
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('newest');

  const fetchDeliveries = async () => {
    try {
      const params = new URLSearchParams();
      if (searchQuery) params.append('search', searchQuery);
      if (statusFilter !== 'all') params.append('status', statusFilter);
      params.append('sort', sortBy);

      const response = await execute(`/api/deliveries?${params.toString()}`, { method: 'GET' });
      if (response && response.success) {
        setDeliveries((response.data as any).data || response.data);
      }
    } catch (error) {
      console.error('Error fetching deliveries:', error);
    }
  };

  useEffect(() => {
    fetchDeliveries();
  }, [searchQuery, statusFilter, sortBy]);

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      preparing: { label: 'Подготовка', variant: 'secondary' as const, color: 'text-yellow-600' },
      shipped: { label: 'Отправлен', variant: 'default' as const, color: 'text-blue-600' },
      in_transit: { label: 'В пути', variant: 'default' as const, color: 'text-purple-600' },
      delivered: { label: 'Доставлен', variant: 'default' as const, color: 'text-green-600' },
      cancelled: { label: 'Отменен', variant: 'destructive' as const, color: 'text-red-600' },
      returned: { label: 'Возвращен', variant: 'outline' as const, color: 'text-gray-600' },
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.preparing;
    return <Badge variant={config.variant} className={config.color}>{config.label}</Badge>;
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'delivered':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'in_transit':
        return <Truck className="h-4 w-4 text-purple-500" />;
      case 'shipped':
        return <Package className="h-4 w-4 text-blue-500" />;
      case 'cancelled':
      case 'returned':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4 text-yellow-500" />;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getDeliveryProgress = (status: string) => {
    const progressSteps = [
      { key: 'preparing', label: 'Подготовка' },
      { key: 'shipped', label: 'Отправлен' },
      { key: 'in_transit', label: 'В пути' },
      { key: 'delivered', label: 'Доставлен' },
    ];
    
    const currentIndex = progressSteps.findIndex(step => step.key === status);
    return { steps: progressSteps, currentIndex: Math.max(0, currentIndex) };
  };

  const handleTrackDelivery = (trackingNumber: string) => {
    // TODO: Реализовать отслеживание доставки
    console.log('Track delivery:', trackingNumber);
  };

  const handleRefreshStatus = (deliveryId: string) => {
    // TODO: Реализовать обновление статуса доставки
    console.log('Refresh delivery status:', deliveryId);
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
        <h1 className="text-3xl font-bold tracking-tight">Доставки</h1>
        <p className="text-muted-foreground">
          Отслеживайте статус доставки ваших заказов
        </p>
      </div>

      {/* Фильтры и поиск */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-1 items-center gap-2">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Поиск по заказам..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Статус доставки" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Все доставки</SelectItem>
              <SelectItem value="preparing">Подготовка</SelectItem>
              <SelectItem value="shipped">Отправлены</SelectItem>
              <SelectItem value="in_transit">В пути</SelectItem>
              <SelectItem value="delivered">Доставлены</SelectItem>
              <SelectItem value="cancelled">Отменены</SelectItem>
              <SelectItem value="returned">Возвращены</SelectItem>
            </SelectContent>
          </Select>
          
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Сортировка" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Новые</SelectItem>
              <SelectItem value="oldest">Старые</SelectItem>
              <SelectItem value="delivery_date">По дате доставки</SelectItem>
              <SelectItem value="status">По статусу</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Статистика */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Всего доставок</CardTitle>
            <Truck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{deliveries.length}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">В пути</CardTitle>
            <Package className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              {deliveries.filter(d => d.status === 'in_transit').length}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Доставлены</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {deliveries.filter(d => d.status === 'delivered').length}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Проблемы</CardTitle>
            <AlertCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {deliveries.filter(d => ['cancelled', 'returned'].includes(d.status)).length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Список доставок */}
      {deliveries.length === 0 ? (
        <EmptyState
          icon={Truck}
          title="Доставки не найдены"
          description="У вас пока нет доставок. Сделайте покупку, чтобы отслеживать доставку!"
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {deliveries.map((delivery) => {
            const progress = getDeliveryProgress(delivery.status);
            
            return (
              <Card key={delivery._id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-1 flex-1">
                      <CardTitle className="text-lg line-clamp-2">
                        {delivery.lotId.title}
                      </CardTitle>
                      <CardDescription className="flex items-center gap-2">
                        <Package className="h-3 w-3" />
                        <span>{delivery.lotId.productId.name}</span>
                      </CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      {getStatusIcon(delivery.status)}
                      {getStatusBadge(delivery.status)}
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  {/* Информация о продавце */}
                  <div className="flex items-center gap-2 text-sm">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Продавец:</span>
                    <span className="font-medium">{delivery.lotId.producerId.profile.company}</span>
                  </div>

                  {/* Номер отслеживания */}
                  <div className="p-3 bg-blue-50 rounded-lg">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-blue-700">Номер отслеживания:</span>
                      <Button
                        variant="link"
                        size="sm"
                        className="h-auto p-0 text-blue-600"
                        onClick={() => handleTrackDelivery(delivery.trackingNumber)}
                      >
                        {delivery.trackingNumber}
                      </Button>
                    </div>
                    <div className="text-xs text-blue-600 mt-1">
                      Перевозчик: {delivery.carrier}
                    </div>
                  </div>

                  {/* Адрес доставки */}
                  <div className="space-y-1 text-sm">
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">Адрес доставки:</span>
                    </div>
                    <div className="pl-6 text-xs text-muted-foreground">
                      <div>{delivery.shippingAddress.street}</div>
                      <div>{delivery.shippingAddress.city}, {delivery.shippingAddress.postalCode}</div>
                      <div>{delivery.shippingAddress.contactName} - {delivery.shippingAddress.contactPhone}</div>
                    </div>
                  </div>

                  {/* Прогресс доставки */}
                  <div className="space-y-2">
                    <div className="text-sm font-medium">Прогресс доставки:</div>
                    <div className="flex items-center gap-2">
                      {progress.steps.map((step, index) => (
                        <div key={step.key} className="flex items-center">
                          <div className={`w-2 h-2 rounded-full ${
                            index <= progress.currentIndex 
                              ? 'bg-green-500' 
                              : 'bg-gray-300'
                          }`} />
                          {index < progress.steps.length - 1 && (
                            <div className={`w-8 h-0.5 ${
                              index < progress.currentIndex 
                                ? 'bg-green-500' 
                                : 'bg-gray-300'
                            }`} />
                          )}
                        </div>
                      ))}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {progress.steps[progress.currentIndex]?.label}
                    </div>
                  </div>

                  {/* Даты */}
                  <div className="space-y-1 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      <span>Создана: {formatDate(delivery.createdAt)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      <span>Ожидаемая доставка: {formatDate(delivery.estimatedDelivery)}</span>
                    </div>
                    {delivery.actualDelivery && (
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4" />
                        <span>Доставлено: {formatDate(delivery.actualDelivery)}</span>
                      </div>
                    )}
                  </div>

                  {/* Действия */}
                  <div className="pt-2 border-t space-y-2">
                    <div className="flex gap-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        className="flex-1"
                        onClick={() => handleTrackDelivery(delivery.trackingNumber)}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        Отследить
                      </Button>
                      
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleRefreshStatus(delivery._id)}
                      >
                        <RefreshCw className="h-4 w-4" />
                      </Button>
                    </div>
                    
                    <Button 
                      variant="outline" 
                      className="w-full"
                      onClick={() => window.open(`/dashboard/lots/${delivery.lotId._id}`, '_blank')}
                    >
                      Посмотреть заказ
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
