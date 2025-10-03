'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useApi } from '@/hooks/useApi';
import { formatCurrency } from '@/lib/currency';
import { BidModal } from '@/components/auction/BidModal';
import { AuctionTimer } from '@/components/auction/AuctionTimer';
import { 
  Package, 
  Search, 
  Clock,
  Users,
  Calendar,
  MapPin,
  Gavel,
  Eye,
  Heart,
  Share2,
  Star,
  TrendingUp,
  Timer,
  ExternalLink,
  Building2,
  Phone,
  Mail,
  Award,
  Copy
} from 'lucide-react';
import { EmptyState } from '@/components/ui/empty-state';

interface CatalogLot {
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
  producerId?: string | {
    _id: string;
    profile?: {
      firstName?: string;
      lastName?: string;
      company?: string;
      rating?: number;
    };
  };
  productId?: string | {
    _id: string;
    name?: string;
    images?: string[];
    category?: string;
  };
  bidsCount?: number;
  myBid?: {
    amount: number;
    isWinning: boolean;
  };
  isFavorite?: boolean;
  viewsCount?: number;
}

export default function CatalogPage() {
  const { execute, isLoading } = useApi();
  const [lots, setLots] = useState<CatalogLot[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [priceRange, setPriceRange] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  const [viewMode] = useState<'grid' | 'list'>('grid');
  const [selectedProduct, setSelectedProduct] = useState<CatalogLot['productId'] | null>(null);
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [selectedLot, setSelectedLot] = useState<CatalogLot | null>(null);
  const [isLotModalOpen, setIsLotModalOpen] = useState(false);
  const [lotDetails, setLotDetails] = useState<any>(null);
  const [copyNotification, setCopyNotification] = useState('');
  const [selectedCompany, setSelectedCompany] = useState<any>(null);
  const [isCompanyModalOpen, setIsCompanyModalOpen] = useState(false);
  const [companyDetails, setCompanyDetails] = useState<any>(null);

  const fetchLots = async () => {
    try {
      const params = new URLSearchParams();
      params.append('status', 'active'); // Только активные лоты
      if (searchQuery) params.append('search', searchQuery);
      if (categoryFilter !== 'all') params.append('category', categoryFilter);
      if (priceRange !== 'all') params.append('priceRange', priceRange);
      params.append('sort', sortBy);

        const response = await execute(`/api/lots?${params.toString()}`, { method: 'GET' });
        if (response && response.success) {
          const lotsData = (response.data as any)?.data || response.data;
          console.log('Lots data from API:', lotsData);
          console.log('First lot endDate:', lotsData[0]?.endDate);
          setLots(lotsData);
        }
    } catch (error) {
      console.error('Error fetching lots:', error);
    }
  };

  useEffect(() => {
    fetchLots();
  }, [searchQuery, categoryFilter, priceRange, sortBy]);


  const formatDate = (dateString: string | undefined | null) => {
    try {
      if (!dateString) {
        return 'Дата не указана';
      }
      
      const date = new Date(dateString);
      
      if (!date || isNaN(date.getTime())) {
        return 'Неверная дата';
      }
      
      return date.toLocaleDateString('ru-RU', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return 'Ошибка даты';
    }
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

  const handlePlaceBid = (lot: CatalogLot) => {
    setSelectedLot(lot);
    setIsLotModalOpen(true);
  };

  const handleProductClick = async (productId: string) => {
    setSelectedProduct({ _id: productId });
    setIsProductModalOpen(true);
    
    try {
      const response = await execute(`/api/products/${productId}`, { method: 'GET' });
      if (response && response.success) {
        setLotDetails(response.data);
      }
    } catch (error) {
      console.error('Error fetching product details:', error);
    }
  };

  const handleCopyId = async (id: string) => {
    try {
      await navigator.clipboard.writeText(id);
      setCopyNotification('ID скопирован!');
      setTimeout(() => setCopyNotification(''), 2000);
    } catch (error) {
      console.error('Failed to copy ID:', error);
    }
  };

  const handleLotDetailsClick = (lot: CatalogLot) => {
    // Перенаправляем на страницу детального просмотра лота
    window.open(`/dashboard/lots/${lot._id}`, '_blank');
  };

  const handleCompanyClick = async (producerId: string) => {
    setSelectedCompany({ _id: producerId });
    setIsCompanyModalOpen(true);
    
    try {
      const response = await execute(`/api/companies/${producerId}`, { method: 'GET' });
      if (response && response.success) {
        setCompanyDetails(response.data);
      }
    } catch (error) {
      console.error('Error fetching company details:', error);
    }
  };

  const handleToggleFavorite = (lotId: string) => {
    // TODO: Реализовать добавление в избранное
    console.log('Toggle favorite for lot:', lotId);
  };

  const handleShare = (lotId: string) => {
    // TODO: Реализовать поделиться лотом
    console.log('Share lot:', lotId);
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
        <h1 className="text-3xl font-bold tracking-tight">Каталог товаров</h1>
        <p className="text-muted-foreground">
          Найдите и купите лучшие товары на аукционах
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
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Категория" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Все категории</SelectItem>
              <SelectItem value="electronics">Электроника</SelectItem>
              <SelectItem value="clothing">Одежда</SelectItem>
              <SelectItem value="food">Продукты</SelectItem>
              <SelectItem value="home">Дом и сад</SelectItem>
              <SelectItem value="sports">Спорт</SelectItem>
              <SelectItem value="books">Книги</SelectItem>
            </SelectContent>
          </Select>
          
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
              <SelectItem value="popular">Популярные</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Статистика */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Активных лотов</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{lots.length}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Мои ставки</CardTitle>
            <Gavel className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {lots.filter(lot => lot.myBid).length}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Выигрываю</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {lots.filter(lot => lot.myBid?.isWinning).length}
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
              {lots.filter(lot => {
                const endDate = lot.auction?.endDate || lot.endDate;
                if (!endDate) return false;
                const now = new Date();
                const end = new Date(endDate);
                const diff = end.getTime() - now.getTime();
                const hours = Math.floor(diff / (1000 * 60 * 60));
                return diff > 0 && hours < 2;
              }).length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Список лотов */}
      {lots.length === 0 ? (
        <EmptyState
          icon={Package}
          title="Лоты не найдены"
          description="В данный момент нет активных лотов. Проверьте позже!"
        />
      ) : (
        <div className={`grid gap-4 ${
          viewMode === 'grid' 
            ? 'md:grid-cols-2 lg:grid-cols-3' 
            : 'md:grid-cols-1'
        }`}>
          {lots.map((lot) => {
            return (
              <Card key={lot._id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-1 flex-1">
                      <CardTitle className="text-lg line-clamp-2">
                        {lot.title}
                      </CardTitle>
                      <CardDescription className="flex items-center gap-2">
                        <Package className="h-3 w-3" />
                        <button 
                          className="text-blue-600 hover:text-blue-800 hover:underline"
                          onClick={() => {
                            const productId = typeof lot.productId === 'string' ? lot.productId : lot.productId?._id;
                            if (productId) {
                              handleProductClick(productId);
                            }
                          }}
                        >
                          {typeof lot.productId === 'object' && lot.productId?.name 
                            ? lot.productId.name 
                            : 'Загрузка...'}
                        </button>
                        {typeof lot.productId === 'object' && lot.productId?.category && (
                          <Badge variant="outline" className="text-xs">
                            {translateCategory(lot.productId.category)}
                          </Badge>
                        )}
                      </CardDescription>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleToggleFavorite(lot._id)}
                      >
                        <Heart className={`h-4 w-4 ${
                          lot.isFavorite ? 'text-red-500 fill-current' : 'text-gray-400'
                        }`} />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleShare(lot._id)}
                      >
                        <Share2 className="h-4 w-4 text-gray-400" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  {/* Информация о продавце */}
                  <div className="flex items-center gap-2 text-sm">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Продавец:</span>
                    <button 
                      className="font-medium text-blue-600 hover:text-blue-800 hover:underline"
                      onClick={() => {
                        const producerId = typeof lot.producerId === 'string' ? lot.producerId : lot.producerId?._id;
                        if (producerId) {
                          handleCompanyClick(producerId);
                        }
                      }}
                    >
                      {typeof lot.producerId === 'object' && lot.producerId?.profile?.company 
                        ? lot.producerId.profile.company 
                        : 'Загрузка...'}
                    </button>
                    {typeof lot.producerId === 'object' && lot.producerId?.profile?.rating && (
                      <div className="flex items-center gap-1">
                        <Star className="h-3 w-3 text-yellow-500 fill-current" />
                        <span className="text-xs text-muted-foreground">
                          {lot.producerId.profile.rating.toFixed(1)}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Количество товара */}
                  <div className="flex items-center gap-2 text-sm">
                    <Package className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Количество:</span>
                    <span className="font-medium">
                      {lot.quantity} {lot.unit}
                    </span>
                  </div>

                  {/* Цены */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Текущая цена:</span>
                      <span className="text-xl font-bold text-green-600">
                        {formatCurrency(lot.currentPrice, 'KZT')}
                      </span>
                    </div>
                    
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Стартовая цена:</span>
                      <span className="font-medium">
                        {formatCurrency(lot.startingPrice, 'KZT')}
                      </span>
                    </div>
                  </div>

                  {/* Моя ставка */}
                  {lot.myBid && (
                    <div className="p-3 bg-blue-50 rounded-lg">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-blue-700">Моя ставка:</span>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-blue-900">
                            {formatCurrency(lot.myBid.amount, 'KZT')}
                          </span>
                          {lot.myBid.isWinning && (
                            <Badge variant="default" className="bg-green-100 text-green-800 text-xs">
                              Выигрываю
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Статистика лота */}
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">Ставок:</span>
                      <span className="font-medium">{lot.bidsCount}</span>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Eye className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">Просмотров:</span>
                      <span className="font-medium">{lot.viewsCount}</span>
                    </div>
                  </div>

                  {/* Время до окончания */}
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-2 text-sm text-gray-700 mb-1">
                      <Clock className="h-4 w-4" />
                      <span>До окончания:</span>
                    </div>
                    <AuctionTimer 
                      endDate={lot.auction?.endDate || lot.endDate || ''}
                      variant="compact"
                      showIcon={false}
                      className="text-base"
                    />
                  </div>

                  {/* Даты */}
                  <div className="space-y-1 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      <span>Создан: {formatDate(lot.createdAt)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Timer className="h-4 w-4" />
                      <span>Завершается: {formatDate(lot.auction?.endDate || lot.endDate)}</span>
                    </div>
                  </div>

                  {/* Действия */}
                  <div className="pt-2 border-t space-y-2">
                    <Button 
                      className="w-full"
                      onClick={() => handlePlaceBid(lot)}
                    >
                      {lot.myBid ? 'Изменить ставку' : 'Сделать ставку'}
                    </Button>
                    
                    <Button 
                      variant="outline" 
                      className="w-full"
                      onClick={() => handleLotDetailsClick(lot)}
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      Подробнее
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Модалка продукта */}
      {selectedProduct && (
        <Dialog open={isProductModalOpen} onOpenChange={(open) => {
          setIsProductModalOpen(open);
          if (!open) {
            setLotDetails(null);
            setSelectedProduct(null);
          }
        }}>
          <DialogContent className="max-w-7xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                {lotDetails?.product?.name || 'Информация о продукте'}
              </DialogTitle>
              <DialogDescription>
                Подробная информация о продукте
              </DialogDescription>
              <div className="flex items-center gap-2 mt-2">
                <span className="text-sm text-muted-foreground">ID продукта:</span>
                <span className="text-sm font-mono break-all">
                  {lotDetails?.product?._id}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    if (lotDetails?.product?._id) {
                      handleCopyId(lotDetails.product._id);
                    }
                  }}
                  className="h-6 px-2 text-xs"
                >
                  <Copy className="h-3 w-3 mr-1" />
                  {copyNotification ? copyNotification : 'Скопировать'}
                </Button>
              </div>
            </DialogHeader>
            
            {!lotDetails ? (
              <div className="space-y-4">
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-32 w-full" />
                <Skeleton className="h-24 w-full" />
              </div>
            ) : lotDetails ? (
              <div className="space-y-6">
                {/* Основная информация о продукте */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <div className="space-y-6">
                    {lotDetails.product?.images && lotDetails.product.images.length > 0 && (
                      <div className="grid grid-cols-2 gap-4">
                        {lotDetails.product?.images.slice(0, 4).map((image: string, index: number) => (
                          <img
                            key={index}
                            src={image}
                            alt={`${lotDetails.product?.name} ${index + 1}`}
                            className="w-full h-40 object-cover rounded-lg"
                          />
                        ))}
                      </div>
                    )}
                    
                    <div>
                      <h3 className="font-semibold mb-3 text-lg">Описание</h3>
                      <p className="text-muted-foreground leading-relaxed">
                        {lotDetails.product?.description || 'Описание не указано'}
                      </p>
                    </div>
                  </div>
                  
                  <div className="space-y-6">
                    <div>
                      <h3 className="font-semibold mb-3 text-lg">Информация о продукте</h3>
                      <div className="space-y-3">
                        <div className="flex items-center gap-3">
                          <span className="font-medium">Категория:</span>
                          <Badge variant="outline" className="text-sm px-3 py-1">
                            {translateCategory(lotDetails.product?.category) || 'Не указана'}
                          </Badge>
                        </div>
                        
                        
                        <div className="flex items-center gap-3">
                          <span className="font-medium">Создан:</span>
                          <span className="text-sm text-muted-foreground">
                            {formatDate(lotDetails.product?.createdAt)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Активные лоты этого продукта */}
                {lotDetails.activeLots && lotDetails.activeLots.length > 0 && (
                  <div className="border-t pt-6">
                    <h3 className="font-semibold mb-4 text-lg">Активные лоты этого продукта</h3>
                    <div className="space-y-3">
                      {lotDetails.activeLots.slice(0, 5).map((lot: any) => (
                        <div key={lot._id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                          <div className="space-y-1">
                            <p className="font-medium">{lot.title}</p>
                            <p className="text-sm text-muted-foreground">
                              {lot.producerId?.profile?.company || 'Неизвестный производитель'}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold">
                              {formatCurrency(lot.currentPrice, lot.currency || 'KZT')}
                            </p>
                            <Badge variant="outline" className="text-xs">
                              {lot.status}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Сертификаты */}
                {lotDetails.certificates && lotDetails.certificates.length > 0 && (
                  <div className="border-t pt-6">
                    <h3 className="font-semibold mb-4 text-lg">Сертификаты качества</h3>
                    <div className="space-y-3">
                      {lotDetails.certificates.map((cert: any) => (
                        <div key={cert._id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                          <div className="space-y-1">
                            <p className="font-medium">{cert.title}</p>
                            <p className="text-sm text-muted-foreground">
                              {cert.issuedBy} • {cert.certificateNumber}
                            </p>
                          </div>
                          <div className="text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => window.open(cert.documents.original, '_blank')}
                              className="text-xs"
                            >
                              <ExternalLink className="h-3 w-3 mr-1" />
                              Скачать
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-muted-foreground">Ошибка загрузки детальной информации о продукте</p>
              </div>
            )}
            
            <DialogFooter>
              <Button variant="outline" onClick={() => {
                setIsProductModalOpen(false);
                setLotDetails(null);
                setSelectedProduct(null);
              }}>
                Закрыть
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Модальное окно ставки */}
      {selectedLot && (
        <BidModal
          isOpen={isLotModalOpen}
          onClose={() => {
            setIsLotModalOpen(false);
            setSelectedLot(null);
          }}
          lotId={selectedLot._id}
          lotTitle={selectedLot.title}
          currentPrice={selectedLot.currentPrice}
          currency={selectedLot.currency || 'KZT'}
          endDate={selectedLot.auction?.endDate || selectedLot.endDate || ''}
          onBidPlaced={(_newBid) => {
            // Обновляем данные лота после размещения ставки
            fetchLots();
          }}
        />
      )}

      {/* Большая модалка компании */}
      {selectedCompany && (
        <Dialog open={isCompanyModalOpen} onOpenChange={(open) => {
          setIsCompanyModalOpen(open);
          if (!open) {
            setCompanyDetails(null);
            setSelectedCompany(null);
          }
        }}>
            <DialogContent className="max-w-7xl max-h-[95vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Building2 className="h-6 w-6" />
                {companyDetails?.company?.profile?.company || 'Информация о компании'}
              </DialogTitle>
              <DialogDescription>
                Подробная информация о производителе
              </DialogDescription>
            </DialogHeader>
            
            {!companyDetails ? (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <Skeleton key={i} className="h-24" />
                  ))}
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <Skeleton className="h-96" />
                  <Skeleton className="h-96" />
                </div>
                <Skeleton className="h-64" />
              </div>
            ) : companyDetails ? (
              <div className="space-y-6">
                {/* Информация о компании */}
                <Card>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="space-y-2">
                        <CardTitle className="flex items-center gap-2">
                          <Building2 className="h-6 w-6" />
                          {companyDetails.company.profile?.company || 'Название компании не указано'}
                        </CardTitle>
                        <CardDescription>
                          {companyDetails.company.profile?.firstName} {companyDetails.company.profile?.lastName}
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {companyDetails.company.profile?.phoneNumber && (
                        <div className="flex items-center gap-2">
                          <Phone className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">{companyDetails.company.profile.phoneNumber}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">{companyDetails.company.email}</span>
                      </div>
                      {companyDetails.company.profile?.address && (
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">{companyDetails.company.profile.address}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">
                          На платформе с {formatDate(companyDetails.company.createdAt)}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Статистика */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2">
                        <Package className="h-5 w-5 text-blue-600" />
                        <div>
                          <p className="text-sm text-muted-foreground">Продукты</p>
                          <p className="text-2xl font-bold">{companyDetails.stats.totalProducts}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2">
                        <Award className="h-5 w-5 text-purple-600" />
                        <div>
                          <p className="text-sm text-muted-foreground">Сертификаты</p>
                          <p className="text-2xl font-bold">{companyDetails.stats.totalCertificates}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Сертификаты */}
                <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Award className="h-5 w-5" />
                        Сертификаты
                      </CardTitle>
                      <CardDescription>
                        Подтвержденные сертификаты качества
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {companyDetails.certificates.length === 0 ? (
                        <EmptyState
                          icon={Award}
                          title="Нет сертификатов"
                          description="У компании пока нет подтвержденных сертификатов"
                        />
                      ) : (
                        <div className="space-y-3">
                          {companyDetails.certificates.slice(0, 5).map((cert: any) => (
                            <div key={cert._id} className="flex items-center justify-between p-3 border rounded-lg">
                              <div className="space-y-1">
                                <p className="font-medium text-sm">{cert.title}</p>
                                <p className="text-xs text-muted-foreground">
                                  {cert.issuedBy} • {cert.certificateNumber}
                                </p>
                              </div>
                              <div className="text-right">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => window.open(cert.documents.original, '_blank')}
                                  className="text-xs"
                                >
                                  <ExternalLink className="h-3 w-3 mr-1" />
                                  Скачать
                                </Button>
                              </div>
                            </div>
                          ))}
                          {companyDetails.certificates.length > 5 && (
                            <p className="text-xs text-muted-foreground text-center">
                              И еще {companyDetails.certificates.length - 5} сертификатов...
                            </p>
                          )}
                        </div>
                      )}
                    </CardContent>
                  </Card>

                {/* Продукты */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Package className="h-5 w-5" />
                      Продукты компании
                    </CardTitle>
                    <CardDescription>
                      Каталог товаров производителя
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {companyDetails.products.length === 0 ? (
                      <EmptyState
                        icon={Package}
                        title="Нет продуктов"
                        description="У компании пока нет добавленных продуктов"
                      />
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {companyDetails.products.map((product: any) => (
                          <div key={product._id} className="border rounded-lg p-4 space-y-2">
                            {product.images && product.images.length > 0 && (
                              <img
                                src={product.images[0]}
                                alt={product.name}
                                className="w-full h-32 object-cover rounded"
                              />
                            )}
                            <div>
                              <h4 className="font-medium">{product.name}</h4>
                              <Badge variant="outline" className="text-xs">
                                {product.category}
                              </Badge>
                            </div>
                            <p className="text-xs text-muted-foreground line-clamp-2">
                              {product.description}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-muted-foreground">Ошибка загрузки информации о компании</p>
              </div>
            )}
            
            <DialogFooter>
              <Button variant="outline" onClick={() => {
                setIsCompanyModalOpen(false);
                setCompanyDetails(null);
                setSelectedCompany(null);
              }}>
                Закрыть
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
