'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Save, Package, MapPin, DollarSign, Calendar as CalendarIcon } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useApi } from '@/hooks/useApi';
import { AuctionType } from '@/types';
import { getAllCurrencies, CurrencyCode, formatCurrency } from '@/lib/currency';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';

interface Product {
  _id: string;
  name: string;
  category: string;
  price?: number;
  unit: string;
  currency?: string;
}

interface FormData {
  productId: string;
  title: string;
  description: string;
  quantity: string;
  unit: string;
  startingPrice: string;
  currency: string;
  auction: {
    startDate: Date | undefined;
    endDate: Date | undefined;
    type: AuctionType;
    minBidIncrement: string;
  };
  location: {
    city: string;
    country: string;
    street: string;
    house: string;
  };
}

const initialFormData: FormData = {
  productId: '',
  title: '',
  description: '',
  quantity: '',
  unit: '',
  startingPrice: '',
  currency: 'KZT',
  auction: {
    startDate: undefined,
    endDate: undefined,
    type: AuctionType.AUCTION,
    minBidIncrement: '',
  },
  location: {
    city: '',
    country: '',
    street: '',
    house: '',
  },
};

export default function CreateLotPage() {
  const router = useRouter();
  const { execute } = useApi();
  
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [products, setProducts] = useState<Product[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingProducts, setIsLoadingProducts] = useState(true);

  // Загружаем продукты пользователя
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await execute('/api/products?producerId=me', {
          method: 'GET',
        });
        
        if (response?.success && response.data) {
          setProducts((response.data as { data: Product[] }).data || []);
        }
      } catch {
        // Ошибка загрузки продуктов
      } finally {
        setIsLoadingProducts(false);
      }
    };

    fetchProducts();
  }, [execute]);

  const handleInputChange = (field: string, value: string | Date | undefined) => {
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {          ...(prev[parent as keyof FormData] as Record<string, string | Date | undefined>),
          [child]: value,
        },
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [field]: value,
      }));
    }
    
    
    // Очищаем ошибку при изменении поля
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: '',
      }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.productId || formData.productId === 'loading' || formData.productId === 'no-products') {
      newErrors.productId = 'Выберите продукт';
    }
    if (!formData.title.trim()) newErrors.title = 'Название лота обязательно';
    if (!formData.description.trim()) newErrors.description = 'Описание обязательно';
    if (!formData.quantity || Number(formData.quantity) <= 0) newErrors.quantity = 'Количество должно быть больше 0';
    if (!formData.unit.trim()) newErrors.unit = 'Единица измерения обязательна';
    if (!formData.startingPrice || Number(formData.startingPrice) <= 0) newErrors.startingPrice = 'Начальная цена должна быть больше 0';
    if (!formData.auction.startDate) newErrors['auction.startDate'] = 'Дата начала обязательна';
    if (!formData.auction.endDate) newErrors['auction.endDate'] = 'Дата окончания обязательна';
    if (!formData.location.city.trim()) newErrors['location.city'] = 'Город обязателен';
    if (!formData.location.country.trim()) newErrors['location.country'] = 'Страна обязательна';
    if (!formData.location.street.trim()) newErrors['location.street'] = 'Улица обязательна';
    if (!formData.location.house.trim()) newErrors['location.house'] = 'Дом обязателен';

    // Проверяем, что дата окончания больше даты начала
    if (formData.auction.startDate && formData.auction.endDate) {
      if (formData.auction.endDate <= formData.auction.startDate) {
        newErrors['auction.endDate'] = 'Дата окончания должна быть позже даты начала';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      const lotData = {
        ...formData,
        quantity: Number(formData.quantity),
        startingPrice: Number(formData.startingPrice),
        auction: {
          ...formData.auction,
          startDate: formData.auction.startDate?.toISOString(),
          endDate: formData.auction.endDate?.toISOString(),
          minBidIncrement: formData.auction.minBidIncrement ? Number(formData.auction.minBidIncrement) : undefined,
        },
        location: {
          ...formData.location,
        },
      };

      const response = await execute('/api/lots', {
        method: 'POST',
        body: JSON.stringify(lotData),
      });

      if (response?.success) {
        router.push('/dashboard/lots');
      } else {
        setErrors({ submit: response?.error || 'Ошибка создания лота' });
      }
    } catch {
      setErrors({ submit: 'Ошибка создания лота' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedProduct = products.find(p => p._id === formData.productId);

  const getCategoryLabel = (category: string) => {
    const categoryLabels: Record<string, string> = {
      'beverages': 'Напитки',
      'food': 'Продукты питания',
      'cosmetics': 'Косметика',
      'pharmaceuticals': 'Фармацевтика',
      'other': 'Другое',
    };

    return categoryLabels[category] || category;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-4">
        <Button
          variant="outline"
          size="icon"
          onClick={() => router.back()}
        >
            <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-text-heading">Создать лот</h1>
          <p className="text-text-body">Создайте новый лот для аукциона</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Основная информация */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Package className="h-5 w-5" />
                <span>Основная информация</span>
              </CardTitle>
              <CardDescription>
                Выберите продукт и заполните основную информацию о лоте
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="productId">Продукт *</Label>
                <Select
                  value={formData.productId}
                  onValueChange={(value) => handleInputChange('productId', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Выберите продукт" />
                  </SelectTrigger>
                  <SelectContent>
                    {isLoadingProducts ? (
                      <SelectItem value="loading" disabled>Загрузка...</SelectItem>
                    ) : products.length === 0 ? (
                      <SelectItem value="no-products" disabled>У вас нет продуктов</SelectItem>
                    ) : (
                      products.map((product) => (
                        <SelectItem key={product._id} value={product._id}>
                          {product.name} ({getCategoryLabel(product.category)})
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
                {errors.productId && (
                  <p className="text-sm text-red-500">{errors.productId}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="title">Название лота *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                  placeholder="Введите название лота"
                />
                {errors.title && (
                  <p className="text-sm text-red-500">{errors.title}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Описание *</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  placeholder="Опишите лот подробно"
                  rows={4}
                />
                {errors.description && (
                  <p className="text-sm text-red-500">{errors.description}</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="quantity">Количество *</Label>
                  <Input
                    id="quantity"
                    type="number"
                    min="1"
                    value={formData.quantity}
                    onChange={(e) => handleInputChange('quantity', e.target.value)}
                    placeholder="1"
                  />
                  {errors.quantity && (
                    <p className="text-sm text-red-500">{errors.quantity}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="unit">Единица измерения *</Label>
                  <Input
                    id="unit"
                    value={formData.unit}
                    onChange={(e) => handleInputChange('unit', e.target.value)}
                    placeholder="шт, кг, л"
                  />
                  {errors.unit && (
                    <p className="text-sm text-red-500">{errors.unit}</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Цена и валюта */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <DollarSign className="h-5 w-5" />
                <span>Цена</span>
              </CardTitle>
              <CardDescription>
                Укажите начальную цену и валюту
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="startingPrice">Начальная цена *</Label>
                <Input
                  id="startingPrice"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.startingPrice}
                  onChange={(e) => handleInputChange('startingPrice', e.target.value)}
                  placeholder="0.00"
                />
                {errors.startingPrice && (
                  <p className="text-sm text-red-500">{errors.startingPrice}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="currency">Валюта *</Label>
                <Select
                  value={formData.currency}
                  onValueChange={(value) => handleInputChange('currency', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {getAllCurrencies().map((currency) => (
                      <SelectItem key={currency.code} value={currency.code}>
                        {currency.code} - {currency.symbol} {currency.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Аукцион */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <CalendarIcon className="h-5 w-5" />
                <span>Аукцион</span>
              </CardTitle>
              <CardDescription>
                Настройте параметры аукциона
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="auctionType">Тип аукциона *</Label>
                <Select
                  value={formData.auction.type}
                  onValueChange={(value) => handleInputChange('auction.type', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={AuctionType.AUCTION}>Аукцион</SelectItem>
                    <SelectItem value={AuctionType.FIXED}>Фиксированная цена</SelectItem>
                    <SelectItem value={AuctionType.REVERSE_AUCTION}>Обратный аукцион</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Дата начала *</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full justify-start text-left font-normal"
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {formData.auction.startDate ? (
                          format(formData.auction.startDate, 'PPP', { locale: ru })
                        ) : (
                          <span>Выберите дату</span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start" side="bottom">
                      <Calendar
                        mode="single"
                        selected={formData.auction.startDate}
                        onSelect={(date) => handleInputChange('auction.startDate', date)}
                        disabled={(date) => date < new Date()}
                        formatters={{
                          formatMonthDropdown: (date) => date.toLocaleDateString('ru-RU', { month: 'long' }),
                          formatWeekdayName: (date) => date.toLocaleDateString('ru-RU', { weekday: 'short' }),
                        }}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  {errors['auction.startDate'] && (
                    <p className="text-sm text-red-500">{errors['auction.startDate']}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>Дата окончания *</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full justify-start text-left font-normal"
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {formData.auction.endDate ? (
                          format(formData.auction.endDate, 'PPP', { locale: ru })
                        ) : (
                          <span>Выберите дату</span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start" side="bottom">
                      <Calendar
                        mode="single"
                        selected={formData.auction.endDate}
                        onSelect={(date) => handleInputChange('auction.endDate', date)}
                        disabled={(date) => 
                          date < new Date() || 
                          (formData.auction.startDate ? date <= formData.auction.startDate : false)
                        }
                        formatters={{
                          formatMonthDropdown: (date) => date.toLocaleDateString('ru-RU', { month: 'long' }),
                          formatWeekdayName: (date) => date.toLocaleDateString('ru-RU', { weekday: 'short' }),
                        }}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  {errors['auction.endDate'] && (
                    <p className="text-sm text-red-500">{errors['auction.endDate']}</p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="minBidIncrement">Минимальный шаг ставки</Label>
                <Input
                  id="minBidIncrement"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.auction.minBidIncrement}
                  onChange={(e) => handleInputChange('auction.minBidIncrement', e.target.value)}
                  placeholder="0.00"
                />
                <p className="text-xs text-text-body">
                  Оставьте пустым для автоматического расчета
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Местоположение */}
        <Card>
          <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <MapPin className="h-5 w-5" />
                <span>Местоположение</span>
            </CardTitle>
            <CardDescription>
                Укажите местонахождение товара
            </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="city">Город *</Label>
                  <Input
                    id="city"
                    value={formData.location.city}
                    onChange={(e) => handleInputChange('location.city', e.target.value)}
                    placeholder="Алматы"
                  />
                  {errors['location.city'] && (
                    <p className="text-sm text-red-500">{errors['location.city']}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="country">Страна *</Label>
                  <Input
                    id="country"
                    value={formData.location.country}
                    onChange={(e) => handleInputChange('location.country', e.target.value)}
                    placeholder="Казахстан"
                  />
                  {errors['location.country'] && (
                    <p className="text-sm text-red-500">{errors['location.country']}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="street">Улица *</Label>
                  <Input
                    id="street"
                    value={formData.location.street}
                    onChange={(e) => handleInputChange('location.street', e.target.value)}
                    placeholder="ул. Абая"
                  />
                  {errors['location.street'] && (
                    <p className="text-sm text-red-500">{errors['location.street']}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="house">Дом *</Label>
                  <Input
                    id="house"
                    value={formData.location.house}
                    onChange={(e) => handleInputChange('location.house', e.target.value)}
                    placeholder="123"
                  />
                  {errors['location.house'] && (
                    <p className="text-sm text-red-500">{errors['location.house']}</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Информация о выбранном продукте */}
        {selectedProduct && (
          <Card>
            <CardHeader>
              <CardTitle>Информация о продукте</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <p className="text-sm text-text-body">Название</p>
                  <p className="font-medium">{selectedProduct.name}</p>
                </div>
                <div>
                  <p className="text-sm text-text-body">Категория</p>
                  <p className="font-medium">{getCategoryLabel(selectedProduct.category)}</p>
                </div>
                <div>
                  <p className="text-sm text-text-body">Цена за единицу</p>
                  <p className="font-medium">
                    {formatCurrency(selectedProduct.price, selectedProduct.currency as CurrencyCode || 'KZT')} / {selectedProduct.unit}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Ошибки */}
        {errors.submit && (
          <Alert variant="destructive">
            <AlertDescription>{errors.submit}</AlertDescription>
          </Alert>
        )}

        {/* Кнопки */}
        <div className="flex justify-end space-x-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
          >
            Отмена
          </Button>
          <Button
            type="submit"
            disabled={isSubmitting}
            loading={isSubmitting}
          >
            <Save className="mr-2 h-4 w-4" />
            Создать лот
          </Button>
        </div>
      </form>
    </div>
  );
}