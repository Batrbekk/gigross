'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { FileUpload } from '@/components/ui/file-upload';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useApi } from '@/hooks/useApi';
import { useAuthStore } from '@/stores/authStore';
import { ArrowLeft, Package, Trash2, Edit } from 'lucide-react';
import Link from 'next/link';

interface Product {
  _id: string;
  name: string;
  description: string;
  category: string;
  price: number;
  unit: string;
  originCountry: string;
  certificationStatus: string;
  certificateIds: string[];
  specifications: {
    volume: number;
    alcoholContent: number;
    ingredients: string[];
    nutritionFacts: Record<string, any>;
  };
  images: string[];
  status: string;
}

export default function ProductEditPage() {
  const router = useRouter();
  const params = useParams();
  const { user } = useAuthStore();
  const { execute, isLoading } = useApi();
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: '',
    price: '',
    unit: '',
    originCountry: '',
    certificationStatus: '',
    specifications: {
      volume: '',
      alcoholContent: '',
      ingredients: [''],
      nutritionFacts: {},
    },
  });
  
  const [product, setProduct] = useState<Product | null>(null);
  const [uploadedImages, setUploadedImages] = useState<{url: string, key: string}[]>([]);
  const [certificates, setCertificates] = useState<any[]>([]);
  const [selectedCertificates, setSelectedCertificates] = useState<string[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoadingProduct, setIsLoadingProduct] = useState(true);

  const fetchProduct = useCallback(async () => {
    try {
      setIsLoadingProduct(true);
      const response = await execute(`/api/products/${params.id}`, {
        method: 'GET',
      });
      
      if (response?.success && response.data) {
        const productData = response.data as Product;
        setProduct(productData);
        
        // Заполняем форму данными продукта
        setFormData({
          name: productData.name || '',
          description: productData.description || '',
          category: productData.category || '',
          price: productData.price?.toString() || '',
          unit: productData.unit || '',
          originCountry: productData.originCountry || '',
          certificationStatus: productData.certificationStatus || '',
          specifications: {
            volume: productData.specifications?.volume?.toString() || '',
            alcoholContent: productData.specifications?.alcoholContent?.toString() || '',
            ingredients: productData.specifications?.ingredients?.length > 0 
              ? productData.specifications.ingredients 
              : [''],
            nutritionFacts: productData.specifications?.nutritionFacts || {},
          },
        });

        // Устанавливаем выбранные сертификаты
        setSelectedCertificates(productData.certificateIds || []);

        // Преобразуем существующие изображения в формат для FileUpload
        const existingImages = productData.images?.map((url: string, index: number) => ({
          url,
          key: `existing-${index}`,
        })) || [];
        setUploadedImages(existingImages);
      }
    } catch (error) {
      console.error('Error fetching product:', error);
      setErrors(prev => ({
        ...prev,
        submit: 'Ошибка при загрузке продукта',
      }));
    } finally {
      setIsLoadingProduct(false);
    }
  }, [params.id, execute]);

  const fetchCertificates = useCallback(async () => {
    try {
      const response = await execute('/api/certificates/approved', {
        method: 'GET',
      });
      
      if (response?.success && response.data) {
        setCertificates((response.data as any).data || []);
      }
    } catch (error) { 
      console.error('Error fetching certificates:', error);
    }
  }, [execute]);

  // Загружаем продукт и сертификаты при монтировании компонента
  useEffect(() => {
    if (params.id) {
      fetchProduct();
      fetchCertificates();
    }
  }, [params.id, fetchProduct, fetchCertificates]);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: '',
      }));
    }
  };

  const handleSpecificationChange = (field: string, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      specifications: {
        ...prev.specifications,
        [field]: value,
      },
    }));
    
    // Clear error when user starts typing
    if (errors[`specifications.${field}`]) {
      setErrors(prev => ({
        ...prev,
        [`specifications.${field}`]: '',
      }));
    }
  };

  const handleIngredientChange = (index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      specifications: {
        ...prev.specifications,
        ingredients: prev.specifications.ingredients.map((ingredient, i) => 
          i === index ? value : ingredient
        ),
      },
    }));
  };

  const addIngredient = () => {
    setFormData(prev => ({
      ...prev,
      specifications: {
        ...prev.specifications,
        ingredients: [...prev.specifications.ingredients, ''],
      },
    }));
  };

  const removeIngredient = (index: number) => {
    setFormData(prev => ({
      ...prev,
      specifications: {
        ...prev.specifications,
        ingredients: prev.specifications.ingredients.filter((_, i) => i !== index),
      },
    }));
  };

  const handleImageUploadSuccess = (url: string, key: string) => {
    setUploadedImages(prev => [...prev, { url, key }]);
  };

  const handleImageUploadError = (error: string) => {
    setErrors(prev => ({
      ...prev,
      images: error,
    }));
  };


  const handleCertificateToggle = (certificateId: string) => {
    setSelectedCertificates(prev => 
      prev.includes(certificateId) 
        ? prev.filter(id => id !== certificateId)
        : [...prev, certificateId]
    );
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name) newErrors.name = 'Название продукта обязательно';
    if (!formData.description) newErrors.description = 'Описание обязательно';
    if (!formData.category) newErrors.category = 'Категория обязательна';
    if (!formData.price) newErrors.price = 'Цена обязательна';
    if (!formData.unit) newErrors.unit = 'Единица измерения обязательна';
    if (!formData.originCountry) newErrors.originCountry = 'Страна происхождения обязательна';

    // Валидация specifications
    if (!formData.specifications.volume) newErrors['specifications.volume'] = 'Объем обязателен';
    if (!formData.specifications.alcoholContent) newErrors['specifications.alcoholContent'] = 'Содержание алкоголя обязательно';
    if (formData.specifications.ingredients.length === 0 || formData.specifications.ingredients.every(ing => !ing.trim())) {
      newErrors['specifications.ingredients'] = 'Необходимо указать хотя бы один ингредиент';
    }

    // Определяем статус сертификации на основе выбранных сертификатов
    if (selectedCertificates.length > 0) {
      formData.certificationStatus = 'certified';
    } else {
      formData.certificationStatus = 'no-certificate';
    }

    if (formData.price && isNaN(Number(formData.price))) {
      newErrors.price = 'Цена должна быть числом';
    }

    if (formData.specifications.volume && isNaN(Number(formData.specifications.volume))) {
      newErrors['specifications.volume'] = 'Объем должен быть числом';
    }

    if (formData.specifications.alcoholContent && isNaN(Number(formData.specifications.alcoholContent))) {
      newErrors['specifications.alcoholContent'] = 'Содержание алкоголя должно быть числом';
    }

    if (uploadedImages.length === 0) {
      newErrors.images = 'Необходимо загрузить хотя бы одно изображение';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      const productData = {
        ...formData,
        price: Number(formData.price),
        specifications: {
          ...formData.specifications,
          volume: Number(formData.specifications.volume),
          alcoholContent: Number(formData.specifications.alcoholContent),
          ingredients: formData.specifications.ingredients.filter(ing => ing.trim()),
        },
        certificateIds: selectedCertificates,
        images: uploadedImages.map(img => img.url),
      };

      const response = await execute(`/api/products/${params.id}`, {
        method: 'PUT',
        body: JSON.stringify(productData),
      });
      
      if (response && response.success) {
        router.push('/dashboard/products');
      }
    } catch {
      setErrors(prev => ({
        ...prev,
        submit: 'Ошибка при обновлении продукта',
      }));
    }
  };

  if (isLoadingProduct) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/dashboard/products">
                <ArrowLeft className="w-4 h-4" />
              </Link>
            </Button>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Редактирование продукта</h1>
              <p className="text-text-body">Загрузка...</p>
            </div>
          </div>
        </div>
        <div className="flex items-center justify-center h-64">
          <div className="w-8 h-8 border-2 border-accent-primary border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/dashboard/products">
                <ArrowLeft className="w-4 h-4" />
              </Link>
            </Button>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Продукт не найден</h1>
              <p className="text-text-body">Продукт с указанным ID не существует</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/dashboard/products">
              <ArrowLeft className="w-4 h-4" />
            </Link>
        </Button>
        <div>
            <h1 className="text-3xl font-bold tracking-tight">Редактирование продукта</h1>
            <p className="text-text-body">
              Измените данные продукта
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid gap-6 md:grid-cols-2">
          {/* Основная информация */}
          <Card>
            <CardHeader>
              <CardTitle>Основная информация</CardTitle>
              <CardDescription>
                Заполните основные данные продукта
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Название продукта</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  placeholder="Введите название продукта"
                />
                {errors.name && <p className="text-sm text-red-600">{errors.name}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Описание</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  placeholder="Введите описание продукта"
                  rows={4}
                />
                {errors.description && <p className="text-sm text-red-600">{errors.description}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">Категория</Label>
                <Select value={formData.category} onValueChange={(value) => handleInputChange('category', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Выберите категорию" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="beverages">Напитки</SelectItem>
                    <SelectItem value="food">Продукты питания</SelectItem>
                    <SelectItem value="cosmetics">Косметика</SelectItem>
                    <SelectItem value="pharmaceuticals">Фармацевтика</SelectItem>
                    <SelectItem value="other">Другое</SelectItem>
                  </SelectContent>
                </Select>
                {errors.category && <p className="text-sm text-red-600">{errors.category}</p>}
              </div>
            </CardContent>
          </Card>

          {/* Цена и характеристики */}
          <Card>
            <CardHeader>
              <CardTitle>Цена и характеристики</CardTitle>
              <CardDescription>
                Укажите цену и технические характеристики
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="price">Цена (₸)</Label>
                  <Input
                    id="price"
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.price}
                    onChange={(e) => handleInputChange('price', e.target.value)}
                    placeholder="0.00"
                  />
                  {errors.price && <p className="text-sm text-red-600">{errors.price}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="unit">Единица измерения</Label>
                  <Select value={formData.unit} onValueChange={(value) => handleInputChange('unit', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Выберите единицу" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="kg">Килограмм</SelectItem>
                      <SelectItem value="g">Грамм</SelectItem>
                      <SelectItem value="l">Литр</SelectItem>
                      <SelectItem value="ml">Миллилитр</SelectItem>
                      <SelectItem value="piece">Штука</SelectItem>
                      <SelectItem value="box">Коробка</SelectItem>
                    </SelectContent>
                  </Select>
                  {errors.unit && <p className="text-sm text-red-600">{errors.unit}</p>}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="originCountry">Страна происхождения</Label>
                <Input
                  id="originCountry"
                  value={formData.originCountry}
                  onChange={(e) => handleInputChange('originCountry', e.target.value)}
                  placeholder="Введите страну происхождения"
                />
                {errors.originCountry && <p className="text-sm text-red-600">{errors.originCountry}</p>}
              </div>

              <div className="space-y-2">
                <Label>Сертификаты</Label>
                <div className="space-y-2 max-h-40 overflow-y-auto border rounded-md p-3">
                  {certificates.length === 0 ? (
                    <p className="text-sm text-text-body">У вас пока нет сертификатов. <a href="/dashboard/certificates" className="text-accent-primary hover:underline">Создать сертификат</a></p>
                  ) : (
                    certificates.map((certificate) => (
                      <div key={certificate._id} className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id={`cert-${certificate._id}`}
                          checked={selectedCertificates.includes(certificate._id)}
                          onChange={() => handleCertificateToggle(certificate._id)}
                          className="rounded border-accent-secondary"
                        />
                        <label htmlFor={`cert-${certificate._id}`} className="text-sm cursor-pointer flex-1">
                          <div className="font-medium">{certificate.title}</div>
                          <div className="text-text-body text-xs">
                            {certificate.issuedBy} • {new Date(certificate.expiryDate).toLocaleDateString('ru-RU')}
                          </div>
                        </label>
                      </div>
                    ))
                  )}
                </div>
                {selectedCertificates.length > 0 && (
                  <p className="text-xs text-text-body">
                    Выбрано сертификатов: {selectedCertificates.length}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Спецификации */}
        <Card>
          <CardHeader>
            <CardTitle>Спецификации продукта</CardTitle>
            <CardDescription>
              Укажите технические характеристики продукта
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="volume">Объем (мл)</Label>
                <Input
                  id="volume"
                  type="number"
                  min="0"
                  step="1"
                  value={formData.specifications.volume}
                  onChange={(e) => handleSpecificationChange('volume', e.target.value)}
                  placeholder="500"
                />
                {errors['specifications.volume'] && <p className="text-sm text-red-600">{errors['specifications.volume']}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="alcoholContent">Содержание алкоголя (%)</Label>
                <Input
                  id="alcoholContent"
                  type="number"
                  min="0"
                  max="100"
                  step="0.1"
                  value={formData.specifications.alcoholContent}
                  onChange={(e) => handleSpecificationChange('alcoholContent', e.target.value)}
                  placeholder="5.0"
                />
                {errors['specifications.alcoholContent'] && <p className="text-sm text-red-600">{errors['specifications.alcoholContent']}</p>}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Ингредиенты</Label>
              <div className="space-y-2">
                {formData.specifications.ingredients.map((ingredient, index) => (
                  <div key={index} className="flex space-x-2">
                    <Input
                      value={ingredient}
                      onChange={(e) => handleIngredientChange(index, e.target.value)}
                      placeholder={`Ингредиент ${index + 1}`}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => removeIngredient(index)}
                      disabled={formData.specifications.ingredients.length === 1}
                      className="border-red-300 text-red-600 hover:bg-red-50 hover:border-red-400 hover:text-red-700 disabled:border-gray-300 disabled:text-gray-400 disabled:hover:bg-transparent"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addIngredient}
                  className="w-full"
                >
                  + Добавить ингредиент
                </Button>
              </div>
              {errors['specifications.ingredients'] && <p className="text-sm text-red-600">{errors['specifications.ingredients']}</p>}
            </div>
          </CardContent>
        </Card>

        {/* Загрузка изображений */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
              <Package className="w-5 h-5" />
              Изображения продукта
          </CardTitle>
          <CardDescription>
              Загрузите фотографии продукта (до 5 изображений)
          </CardDescription>
        </CardHeader>
        <CardContent>
            <FileUpload
              accept="image/*"
              maxSize={5 * 1024 * 1024} // 5MB
              uploadType="product"
              userId={user?._id || ''}
              onUploadSuccess={handleImageUploadSuccess}
              onUploadError={handleImageUploadError}
              multiple={true}
            />
            {errors.images && <p className="text-sm text-red-600 mt-2">{errors.images}</p>}
          </CardContent>
        </Card>

        {/* Submit Error */}
        {errors.submit && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-md">
            <p className="text-sm text-red-700">{errors.submit}</p>
          </div>
        )}

        {/* Submit Button */}
        <div className="flex justify-end space-x-4">
          <Button variant="outline" asChild>
            <Link href="/dashboard/products">Отмена</Link>
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                Обновление...
              </>
            ) : (
              <>
                <Edit className="mr-2 h-4 w-4" />
                Обновить продукт
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}