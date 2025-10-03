'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { useApi } from '@/hooks/useApi';
import { useAuthStore } from '@/stores/authStore';
import { Product, ProductStatus, UserRole } from '@/types';
import { 
  ArrowLeft, 
  Edit, 
  Package, 
  Calendar,
  CheckCircle,
  XCircle,
  Clock,
  Shield,
  Info,
} from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

export default function ProductViewPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuthStore();
  const { execute, isLoading } = useApi();
  const [product, setProduct] = useState<Product | null>(null);

  const productId = params.id as string;

  useEffect(() => {
    if (productId) {
      fetchProduct();
    }
  }, [productId]);

  const fetchProduct = async () => {
    try {
      const response = await execute(`/api/products/${productId}`, { method: 'GET' });
      if (response && response.success) {
        setProduct(response.data as Product);
      }
    } catch (error) {
      console.error('Failed to fetch product:', error);
      router.push('/dashboard/products');
    }
  };

  const getStatusBadge = (status: ProductStatus) => {
    const statusConfig: Record<ProductStatus, { label: string; variant: 'default' | 'secondary' | 'outline' | 'destructive'; icon: React.ElementType }> = {
      [ProductStatus.ACTIVE]: { 
        label: 'Активный', 
        variant: 'default' as const, 
        icon: CheckCircle 
      },
      [ProductStatus.INACTIVE]: { 
        label: 'Неактивный', 
        variant: 'secondary' as const, 
        icon: XCircle 
      },
      [ProductStatus.PENDING]: { 
        label: 'На модерации', 
        variant: 'outline' as const, 
        icon: Clock 
      },
      [ProductStatus.DISCONTINUED]: { 
        label: 'Снят с производства', 
        variant: 'destructive' as const, 
        icon: XCircle 
      },
    };

    const config = statusConfig[status];
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    );
  };

  const isMyProduct = (product: Product) => {
    const productOwnerId = typeof product.producerId === 'string' 
      ? product.producerId 
      : (product.producerId as any)?._id;
    return productOwnerId === user?.id;
  };

  const canManageProduct = user?.role === UserRole.ADMIN || (product && isMyProduct(product));

  if (isLoading || !product) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10" />
          <div className="space-y-2">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-4 w-96" />
          </div>
        </div>
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-32" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-64 w-full" />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-32" />
            </CardHeader>
            <CardContent className="space-y-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="flex justify-between">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-32" />
                </div>
              ))}
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
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{product.name}</h1>
            <p className="text-muted-foreground">
              Детальная информация о продукте
            </p>
          </div>
        </div>
        {canManageProduct && (
          <Button asChild>
            <Link href={`/dashboard/products/${productId}/edit`}>
              <Edit className="mr-2 h-4 w-4" />
              Редактировать
            </Link>
          </Button>
        )}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Изображения */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Изображения продукта
            </CardTitle>
          </CardHeader>
          <CardContent>
            {product.images && product.images.length > 0 ? (
              <div className="space-y-4">
                <div className="relative aspect-square overflow-hidden rounded-lg">
                  <Image
                    src={product.images[0]}
                    alt={product.name}
                    fill
                    className="object-cover"
                  />
                </div>
                {product.images.length > 1 && (
                  <div className="grid grid-cols-4 gap-2">
                    {product.images.slice(1, 5).map((image, index) => (
                      <div key={index} className="relative aspect-square overflow-hidden rounded-md">
                        <Image
                          src={image}
                          alt={`${product.name} ${index + 2}`}
                          fill
                          className="object-cover"
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="flex h-64 items-center justify-center bg-muted rounded-lg">
                <div className="text-center">
                  <Package className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                  <p className="text-muted-foreground">Изображения не загружены</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Основная информация */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Info className="h-5 w-5" />
              Основная информация
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="font-medium">Статус:</span>
              {getStatusBadge(product.status)}
            </div>

            <Separator />

            <div className="flex justify-between">
              <span className="font-medium">Категория:</span>
              <Badge variant="outline">{product.category}</Badge>
            </div>

            <div className="flex justify-between">
              <span className="font-medium">Производитель:</span>
              <div className="text-right">
                {typeof product.producerId === 'string' ? (
                  <span>ID: {product.producerId}</span>
                ) : (
                  <div>
                    <div className="font-medium">
                      {(product.producerId as any)?.profile?.firstName} {(product.producerId as any)?.profile?.lastName}
                    </div>
                    {(product.producerId as any)?.profile?.company && (
                      <div className="text-sm text-muted-foreground">
                        {(product.producerId as any).profile.company}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-between">
              <span className="font-medium">Дата создания:</span>
              <div className="flex items-center gap-1">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span>{new Date(product.createdAt).toLocaleDateString('ru-RU')}</span>
              </div>
            </div>

            <div className="flex justify-between">
              <span className="font-medium">Последнее обновление:</span>
              <div className="flex items-center gap-1">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span>{new Date(product.updatedAt).toLocaleDateString('ru-RU')}</span>
              </div>
            </div>

            <Separator />

            <div className="flex justify-between items-center">
              <span className="font-medium">Халяль сертификация:</span>
              {(product as any).halalCertification?.status === 'verified' ? (
                <Badge variant="default" className="bg-green-100 text-green-800">
                  <Shield className="h-3 w-3 mr-1" />
                  Сертифицирован
                </Badge>
              ) : (
                <Badge variant="outline">
                  <XCircle className="h-3 w-3 mr-1" />
                  Не сертифицирован
                </Badge>
              )}
            </div>

            {(product as any).halalCertification?.certificateNumber && (
              <div className="flex justify-between">
                <span className="font-medium">Номер сертификата:</span>
                <span className="font-mono text-sm">{(product as any).halalCertification.certificateNumber}</span>
              </div>
            )}

            {(product as any).halalCertification?.issuedBy && (
              <div className="flex justify-between">
                <span className="font-medium">Выдан:</span>
                <span className="text-sm">{(product as any).halalCertification.issuedBy}</span>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Описание */}
      <Card>
        <CardHeader>
          <CardTitle>Описание продукта</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground leading-relaxed">
            {product.description || 'Описание не указано'}
          </p>
        </CardContent>
      </Card>

      {/* Дополнительная информация */}
      {/* {((product as any).nutritionalInfo || (product as any).ingredients || (product as any).allergens) && (
        <div className="grid gap-6 md:grid-cols-3">
          {(product as any).nutritionalInfo && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Пищевая ценность</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  {product.nutritionalInfo.calories && (
                    <div className="flex justify-between">
                      <span>Калории:</span>
                      <span>{product.nutritionalInfo.calories} ккал</span>
                    </div>
                  )}
                  {product.nutritionalInfo.protein && (
                    <div className="flex justify-between">
                      <span>Белки:</span>
                      <span>{product.nutritionalInfo.protein}г</span>
                    </div>
                  )}
                  {product.nutritionalInfo.carbs && (
                    <div className="flex justify-between">
                      <span>Углеводы:</span>
                      <span>{product.nutritionalInfo.carbs}г</span>
                    </div>
                  )}
                  {product.nutritionalInfo.fat && (
                    <div className="flex justify-between">
                      <span>Жиры:</span>
                      <span>{product.nutritionalInfo.fat}г</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {product.ingredients && product.ingredients.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Состав</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-1">
                  {product.ingredients.map((ingredient, index) => (
                    <div key={index} className="text-sm">
                      • {ingredient}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {product.allergens && product.allergens.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg text-orange-600">Аллергены</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-1">
                  {product.allergens.map((allergen, index) => (
                    <Badge key={index} variant="outline" className="mr-1 mb-1">
                      {allergen}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )} */}
    </div>
  );
}
