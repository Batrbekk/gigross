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
  ShoppingCart, 
  Search, 
  Package,
  Calendar,
  MapPin,
  Truck,
  CheckCircle,
  Clock,
  XCircle,
  Download,
  Star
} from 'lucide-react';
import { EmptyState } from '@/components/ui/empty-state';

interface Purchase {
  _id: string;
  lotId: {
    _id: string;
    title: string;
    description: string;
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
  winningBid: {
    amount: number;
    placedAt: string;
  };
  status: 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled';
  paymentStatus: 'pending' | 'paid' | 'refunded';
  shippingAddress: {
    street: string;
    city: string;
    postalCode: string;
    country: string;
  };
  trackingNumber?: string;
  estimatedDelivery?: string;
  deliveredAt?: string;
  createdAt: string;
  updatedAt: string;
}

export default function PurchasesPage() {
  const { execute, isLoading } = useApi();
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('newest');

  const fetchPurchases = async () => {
    try {
      const params = new URLSearchParams();
      if (searchQuery) params.append('search', searchQuery);
      if (statusFilter !== 'all') params.append('status', statusFilter);
      params.append('sort', sortBy);

      const response = await execute(`/api/purchases?${params.toString()}`, { method: 'GET' });
      if (response && response.success) {
        setPurchases(response.data.data || response.data);
      }
    } catch (error) {
      console.error('Error fetching purchases:', error);
    }
  };

  useEffect(() => {
    fetchPurchases();
  }, [searchQuery, statusFilter, sortBy]);

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { label: 'Ожидает подтверждения', variant: 'secondary' as const, color: 'text-yellow-600' },
      confirmed: { label: 'Подтвержден', variant: 'default' as const, color: 'text-blue-600' },
      shipped: { label: 'Отправлен', variant: 'default' as const, color: 'text-purple-600' },
      delivered: { label: 'Доставлен', variant: 'default' as const, color: 'text-green-600' },
      cancelled: { label: 'Отменен', variant: 'destructive' as const, color: 'text-red-600' },
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    return <Badge variant={config.variant} className={config.color}>{config.label}</Badge>;
  };

  const getPaymentStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { label: 'Ожидает оплаты', variant: 'secondary' as const },
      paid: { label: 'Оплачен', variant: 'default' as const },
      refunded: { label: 'Возвращен', variant: 'outline' as const },
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'delivered':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'shipped':
        return <Truck className="h-4 w-4 text-purple-500" />;
      case 'confirmed':
        return <CheckCircle className="h-4 w-4 text-blue-500" />;
      case 'cancelled':
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

  const handleDownloadInvoice = (purchaseId: string) => {
    // TODO: Реализовать скачивание счета
    console.log('Download invoice for purchase:', purchaseId);
  };

  const handleTrackPackage = (trackingNumber: string) => {
    // TODO: Реализовать отслеживание посылки
    console.log('Track package:', trackingNumber);
  };

  const handleRatePurchase = (purchaseId: string) => {
    // TODO: Реализовать оценку покупки
    console.log('Rate purchase:', purchaseId);
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
        <h1 className="text-3xl font-bold tracking-tight">История покупок</h1>
        <p className="text-muted-foreground">
          Отслеживайте свои покупки и управляйте заказами
        </p>
      </div>

      {/* Фильтры и поиск */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-1 items-center gap-2">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Поиск по покупкам..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Статус заказа" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Все заказы</SelectItem>
              <SelectItem value="pending">Ожидают подтверждения</SelectItem>
              <SelectItem value="confirmed">Подтверждены</SelectItem>
              <SelectItem value="shipped">Отправлены</SelectItem>
              <SelectItem value="delivered">Доставлены</SelectItem>
              <SelectItem value="cancelled">Отменены</SelectItem>
            </SelectContent>
          </Select>
          
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Сортировка" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Новые</SelectItem>
              <SelectItem value="oldest">Старые</SelectItem>
              <SelectItem value="price_high">Цена ↓</SelectItem>
              <SelectItem value="price_low">Цена ↑</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Статистика */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Всего покупок</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{purchases.length}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Доставлены</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {purchases.filter(p => p.status === 'delivered').length}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">В пути</CardTitle>
            <Truck className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              {purchases.filter(p => p.status === 'shipped').length}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Общая сумма</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(
                purchases.reduce((sum, p) => sum + p.winningBid.amount, 0),
                'KZT'
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Список покупок */}
      {purchases.length === 0 ? (
        <EmptyState
          icon={ShoppingCart}
          title="Покупки не найдены"
          description="У вас пока нет покупок. Участвуйте в торгах и делайте ставки!"
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {purchases.map((purchase) => (
            <Card key={purchase._id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-1 flex-1">
                    <CardTitle className="text-lg line-clamp-2">
                      {purchase.lotId.title}
                    </CardTitle>
                    <CardDescription className="flex items-center gap-2">
                      <Package className="h-3 w-3" />
                      <span>{purchase.lotId.productId.name}</span>
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    {getStatusIcon(purchase.status)}
                    {getStatusBadge(purchase.status)}
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                {/* Информация о продавце */}
                <div className="flex items-center gap-2 text-sm">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Продавец:</span>
                  <span className="font-medium">{purchase.lotId.producerId.profile.company}</span>
                </div>

                {/* Цена и оплата */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Сумма покупки:</span>
                    <span className="text-xl font-bold text-green-600">
                      {formatCurrency(purchase.winningBid.amount, 'KZT')}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Статус оплаты:</span>
                    {getPaymentStatusBadge(purchase.paymentStatus)}
                  </div>
                </div>

                {/* Адрес доставки */}
                <div className="space-y-1 text-sm">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Адрес доставки:</span>
                  </div>
                  <div className="pl-6 text-xs text-muted-foreground">
                    {purchase.shippingAddress.street}, {purchase.shippingAddress.city}, {purchase.shippingAddress.postalCode}
                  </div>
                </div>

                {/* Отслеживание */}
                {purchase.trackingNumber && (
                  <div className="p-3 bg-blue-50 rounded-lg">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-blue-700">Номер отслеживания:</span>
                      <Button
                        variant="link"
                        size="sm"
                        className="h-auto p-0 text-blue-600"
                        onClick={() => handleTrackPackage(purchase.trackingNumber!)}
                      >
                        {purchase.trackingNumber}
                      </Button>
                    </div>
                    {purchase.estimatedDelivery && (
                      <div className="text-xs text-blue-600 mt-1">
                        Ожидаемая доставка: {formatDate(purchase.estimatedDelivery)}
                      </div>
                    )}
                  </div>
                )}

                {/* Даты */}
                <div className="space-y-1 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    <span>Куплено: {formatDate(purchase.createdAt)}</span>
                  </div>
                  {purchase.deliveredAt && (
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4" />
                      <span>Доставлено: {formatDate(purchase.deliveredAt)}</span>
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
                      onClick={() => handleDownloadInvoice(purchase._id)}
                    >
                      <Download className="h-4 w-4 mr-1" />
                      Счет
                    </Button>
                    
                    {purchase.status === 'delivered' && (
                      <Button 
                        variant="outline" 
                        size="sm"
                        className="flex-1"
                        onClick={() => handleRatePurchase(purchase._id)}
                      >
                        <Star className="h-4 w-4 mr-1" />
                        Оценить
                      </Button>
                    )}
                  </div>
                  
                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={() => window.open(`/dashboard/lots/${purchase.lotId._id}`, '_blank')}
                  >
                    Посмотреть лот
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
