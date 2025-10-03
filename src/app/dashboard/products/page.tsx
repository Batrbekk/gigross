'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useApi } from '@/hooks/useApi';
import { useAuthStore } from '@/stores/authStore';
import { Product, ProductStatus, UserRole } from '@/types';
import { 
  Plus, 
  Search, 
  Filter, 
  MoreHorizontal, 
  Edit, 
  Trash2, 
  Eye,
  Package,
  CheckCircle,
  XCircle,
  Clock,
  Download,
} from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

interface ProductsResponse {
  data: Product[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export default function ProductsPage() {
  const { user } = useAuthStore();
  const { execute, isLoading } = useApi();
  const [products, setProducts] = useState<Product[]>([]);
  const [certificates, setCertificates] = useState<any[]>([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<ProductStatus | 'all'>('all');
  const [activeTab, setActiveTab] = useState<'my' | 'all'>('my');
  const [isTableLoading, setIsTableLoading] = useState(false);

  const fetchCertificates = async () => {
    try {
      console.log('Fetching certificates...');
      console.log('User:', user);
      console.log('Is authenticated:', !!user);
      
      const response = await execute('/api/certificates', {
        method: 'GET',
      });
      
      console.log('Certificates response:', response);
      
      if (response && response.success) {
        setCertificates((response.data as any).data || []);
        console.log('Certificates loaded:', (response.data as any).data);
      } else if (response === null) {
        console.warn('API request failed - user might not be authenticated');
        setCertificates([]);
      } else {
        console.warn('No certificates found or invalid response:', response);
        setCertificates([]);
      }
    } catch (error) {
      console.error('Error fetching certificates:', error);
      setCertificates([]);
    }
  };

  const fetchProducts = async (page = 1, search = '', status = 'all', tab: 'my' | 'all' = activeTab) => {
    setIsTableLoading(true);
    try {
      // Определяем ID пользователя из разных возможных полей
      const userId = user?._id || user?.id || user?.userId;
      
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '10',
        ...(search && { search }),
        ...(status !== 'all' && { status }),
        ...(tab === 'my' && userId && { producerId: userId }),
      });

      const response = await execute(`/api/products?${params}`, { method: 'GET' });
      if (response && response.success) {
        const data = response.data as ProductsResponse;
        setProducts(data.data);
        setPagination(data.pagination);
      }
    } catch (error) {
      console.error('Failed to fetch products:', error);
    } finally {
      setIsTableLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
    if (user) {
      fetchCertificates();
    }
  }, [user]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchProducts(1, searchQuery, statusFilter, activeTab);
  };

  const handleStatusFilter = (status: ProductStatus | 'all') => {
    setStatusFilter(status);
    fetchProducts(1, searchQuery, status, activeTab);
  };

  const handlePageChange = (newPage: number) => {
    fetchProducts(newPage, searchQuery, statusFilter, activeTab);
  };

  const handleTabChange = (tab: 'my' | 'all') => {
    setActiveTab(tab);
    // Сбрасываем фильтры при переключении вкладок для лучшего UX
    setSearchQuery('');
    setStatusFilter('all');
    fetchProducts(1, '', 'all', tab);
  };

  const handleDeleteProduct = async (productId: string) => {
    try {
      const response = await execute(`/api/products/${productId}`, { method: 'DELETE' });
      if (response && response.success) {
        // Обновляем список продуктов после удаления
        fetchProducts(pagination.page, searchQuery, statusFilter, activeTab);
      }
    } catch (error) {
      console.error('Failed to delete product:', error);
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

  const getCertificationDisplay = (product: Product) => {
    if (product.certificateIds && product.certificateIds.length > 0) {
      // Если есть сертификаты, показываем их названия
      return (
        <div className="space-y-1">
          {product.certificateIds.map((certId, index) => {
            const certificate = certificates.find(cert => cert._id === certId);
            const certificateName = certificate ? certificate.title : `Сертификат ${index + 1}`;
            
            return (
              <TooltipProvider key={index}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Badge 
                      variant="default" 
                      className="bg-green-100 text-green-800 cursor-pointer hover:bg-green-200 flex items-center gap-1"
                      onClick={() => {
                        // Если есть данные о сертификате и ссылка на документ, скачиваем файл
                        if (certificate && certificate.documents?.original) {
                          window.open(certificate.documents.original, '_blank');
                        } else {
                          // Иначе переходим на страницу сертификата
                          window.open(`/dashboard/certificates/${certId}`, '_blank');
                        }
                      }}
                    >
                      <Download className="h-3 w-3" />
                      {certificateName}
                    </Badge>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Кликните для скачивания сертификата</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            );
          })}
        </div>
      );
    } else {
      // Если сертификатов нет
      return (
        <Badge variant="outline">
          Без сертификата
        </Badge>
      );
    }
  };

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

  const getStatusLabel = (status: ProductStatus | 'all') => {
    if (status === 'all') return 'Все';
    
    const statusLabels: Record<ProductStatus, string> = {
      [ProductStatus.ACTIVE]: 'Активные',
      [ProductStatus.INACTIVE]: 'Неактивные',
      [ProductStatus.PENDING]: 'На модерации',
      [ProductStatus.DISCONTINUED]: 'Сняты с производства',
    };

    return statusLabels[status] || status;
  };

  const canManageProducts = user?.role === UserRole.PRODUCER || user?.role === UserRole.ADMIN;
  
  const isMyProduct = (product: Product) => {
    const productOwnerId = typeof product.producerId === 'string'
      ? product.producerId
      : (product.producerId as { _id: string })?._id;
    const userId = user?._id || user?.id || user?.userId;
    return productOwnerId === userId;
  };

  const getAvailableActions = (product: Product) => {
    const actions = [];
    
    // Просмотр доступен всегда
    actions.push({
      label: 'Просмотр',
      href: `/dashboard/products/${product._id}`,
      icon: Eye,
    });

    // Редактирование и удаление только для владельцев продуктов
    if (canManageProducts && isMyProduct(product)) {
      actions.push({
        label: 'Редактировать',
        href: `/dashboard/products/${product._id}/edit`,
        icon: Edit,
      });
      actions.push({
        label: 'Удалить',
        href: '#',
        icon: Trash2,
        isDestructive: true,
        onClick: () => handleDeleteProduct(product._id),
      });
    }

    return actions;
  };

  if (isLoading && products.length === 0 && !isTableLoading) {
    return (
      <div className="space-y-6 bg-white">
        <div className="flex items-center justify-between">
          <div>
            <Skeleton className="h-8 w-48" />
            <Skeleton className="mt-2 h-4 w-96" />
          </div>
          <Skeleton className="h-10 w-32" />
        </div>
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-32" />
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={`products-skeleton-${i}`} className="flex items-center space-x-4">
                  <Skeleton className="h-12 w-12 rounded" />
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-48" />
                    <Skeleton className="h-3 w-32" />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 bg-white">
      {/* Заголовок */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-text-heading">Продукты</h1>
          <p className="text-text-body">
            {canManageProducts 
              ? 'Управляйте своими продуктами и их статусом'
              : 'Просматривайте каталог продуктов'
            }
          </p>
        </div>
        {canManageProducts && activeTab === 'my' && (
          <Button asChild>
            <Link href="/dashboard/products/new">
              <Plus className="mr-2 h-4 w-4" />
              Добавить продукт
            </Link>
          </Button>
        )}
      </div>

      {/* Вкладки */}
      <Tabs value={activeTab} onValueChange={(value) => handleTabChange(value as 'my' | 'all')}>
        <TabsList className="grid w-full grid-cols-2 max-w-[400px]">
          <TabsTrigger value="my">Мои продукты</TabsTrigger>
          <TabsTrigger value="all">Все продукты</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="space-y-6">
          {/* Фильтры и поиск */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                {activeTab === 'my' ? 'Мои продукты' : 'Каталог продуктов'}
              </CardTitle>
              <CardDescription>
                {activeTab === 'my' ? 'Мои продукты' : 'Все продукты'}: {pagination.total}
              </CardDescription>
            </CardHeader>
            <CardContent>
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <form onSubmit={handleSearch} className="flex gap-2">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Поиск продуктов..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-[300px] pl-8"
                />
              </div>
              <Button type="submit" variant="outline">
                Найти
              </Button>
            </form>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline">
                  <Filter className="mr-2 h-4 w-4" />
                  Статус: {getStatusLabel(statusFilter)}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Фильтр по статусу</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => handleStatusFilter('all')}>
                  {getStatusLabel('all')}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleStatusFilter(ProductStatus.ACTIVE)}>
                  {getStatusLabel(ProductStatus.ACTIVE)}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleStatusFilter(ProductStatus.INACTIVE)}>
                  {getStatusLabel(ProductStatus.INACTIVE)}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleStatusFilter(ProductStatus.PENDING)}>
                  {getStatusLabel(ProductStatus.PENDING)}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardContent>
      </Card>

      {/* Таблица продуктов */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table className="min-w-[700px]">
            <TableHeader>
              <TableRow>
                <TableHead className="w-[100px]">Изображение</TableHead>
                <TableHead>Название</TableHead>
                <TableHead>Категория</TableHead>
                <TableHead>Статус</TableHead>
                <TableHead>Сертификация</TableHead>
                <TableHead>Создан</TableHead>
                <TableHead className="text-right">Действия</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isTableLoading ? (
                // Показываем shimmer только для таблицы при загрузке
                Array.from({ length: 5 }).map((_, index) => (
                  <TableRow key={`skeleton-${index}`}>
                    <TableCell><Skeleton className="h-4 w-full" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                    <TableCell className="text-right">
                      <Skeleton className="h-8 w-8" />
                    </TableCell>
                  </TableRow>
                ))
              ) : products.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">
                    <div className="flex flex-col items-center gap-2">
                      <Package className="h-12 w-12 text-muted-foreground" />
                      <h3 className="text-lg font-semibold">
                        {activeTab === 'my' ? 'У вас пока нет продуктов' : 'Продукты не найдены'}
                      </h3>
                      <p className="text-muted-foreground">
                        {activeTab === 'my' 
                          ? 'Создайте свой первый продукт, чтобы начать продажи'
                          : 'Попробуйте изменить фильтры поиска'
                        }
                      </p>
                      {activeTab === 'my' && canManageProducts && (
                        <Button asChild className="mt-2">
                          <Link href="/dashboard/products/new">
                            <Plus className="mr-2 h-4 w-4" />
                            Создать продукт
                          </Link>
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                products.map((product, index) => (
                <TableRow key={product._id || product.id || `product-${index}`}>
                  <TableCell>
                    <div className="relative h-12 w-12 overflow-hidden rounded-md">
                      {product.images && product.images.length > 0 ? (
                        <Image
                          src={product.images[0]}
                          alt={product.name}
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center bg-muted">
                          <Package className="h-6 w-6 text-muted-foreground" />
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium">
                        {product.name?.length > 30 
                          ? `${product.name.substring(0, 30)}...` 
                          : product.name}
                      </div>
                      <div className="text-sm text-muted-foreground line-clamp-1">
                        {product.description?.length > 40 
                          ? `${product.description.substring(0, 40)}...` 
                          : product.description}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{getCategoryLabel(product.category)}</Badge>
                  </TableCell>
                  <TableCell>
                    {getStatusBadge(product.status)}
                  </TableCell>
                  <TableCell>
                    {getCertificationDisplay(product)}
                  </TableCell>
                  <TableCell>
                    {new Date(product.createdAt).toLocaleDateString('ru-RU')}
                  </TableCell>
                  <TableCell className="text-right">
                    {(() => {
                      const actions = getAvailableActions(product);
                      
                      if (actions.length === 1) {
                        // Если только одно действие, показываем кнопку напрямую
                        const action = actions[0];
                        const Icon = action.icon;
                        
                        if (action.onClick) {
                          // Для действий с onClick (удаление)
                          return (
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                      <Button 
                                        variant="ghost" 
                                        size="sm" 
                                        className={`h-8 w-8 p-0 ${action.isDestructive ? "text-destructive hover:text-destructive" : ""}`}
                                      >
                                        <Icon className="h-4 w-4" />
                                      </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                      <AlertDialogHeader>
                                        <AlertDialogTitle>Удалить продукт?</AlertDialogTitle>
                                        <AlertDialogDescription>
                                          Это действие нельзя отменить. Продукт &quot;{product.name}&quot; будет удален навсегда.
                                        </AlertDialogDescription>
                                      </AlertDialogHeader>
                                      <AlertDialogFooter>
                                        <AlertDialogCancel>Отмена</AlertDialogCancel>
                                        <AlertDialogAction 
                                          onClick={action.onClick}
                                          className="bg-destructive text-white hover:bg-destructive/90"
                                        >
                                          Удалить
                                        </AlertDialogAction>
                                      </AlertDialogFooter>
                                    </AlertDialogContent>
                                  </AlertDialog>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>{action.label}</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          );
                        } else {
                          // Для обычных ссылок
                          return (
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button variant="ghost" size="sm" asChild className="h-8 w-8 p-0">
                                    <Link href={action.href}>
                                      <Icon className="h-4 w-4" />
                                    </Link>
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>{action.label}</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          );
                        }
                      } else {
                        // Если несколько действий, показываем меню
                        return (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              {actions.map((action) => {
                                const Icon = action.icon;
                                
                                if (action.onClick) {
                                  // Для действий с onClick (удаление)
                                  return (
                                    <AlertDialog key={action.label}>
                                      <AlertDialogTrigger asChild>
                                        <DropdownMenuItem 
                                          className={action.isDestructive ? "text-destructive" : ""}
                                          onSelect={(e) => e.preventDefault()}
                                        >
                                          <Icon className="mr-2 h-4 w-4" />
                                          {action.label}
                                        </DropdownMenuItem>
                                      </AlertDialogTrigger>
                                      <AlertDialogContent>
                                        <AlertDialogHeader>
                                          <AlertDialogTitle>Удалить продукт?</AlertDialogTitle>
                                          <AlertDialogDescription>
                                            Это действие нельзя отменить. Продукт &quot;{product.name}&quot; будет удален навсегда.
                                          </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                          <AlertDialogCancel>Отмена</AlertDialogCancel>
                                          <AlertDialogAction 
                                            onClick={action.onClick}
                                            className="bg-destructive text-white hover:bg-destructive/90"
                                          >
                                            Удалить
                                          </AlertDialogAction>
                                        </AlertDialogFooter>
                                      </AlertDialogContent>
                                    </AlertDialog>
                                  );
                                } else {
                                  // Для обычных ссылок
                                  return (
                                    <DropdownMenuItem key={action.label} asChild>
                                      <Link href={action.href}>
                                        <Icon className="mr-2 h-4 w-4" />
                                        {action.label}
                                      </Link>
                                    </DropdownMenuItem>
                                  );
                                }
                              })}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        );
                      }
                    })()}
                  </TableCell>
                </TableRow>
                ))
              )}
            </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Пагинация */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(pagination.page - 1)}
            disabled={pagination.page <= 1}
          >
            Предыдущая
          </Button>
          <div className="flex items-center space-x-1">
            {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
              const page = i + 1;
              return (
                <Button
                  key={page}
                  variant={pagination.page === page ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => handlePageChange(page)}
                >
                  {page}
                </Button>
              );
            })}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(pagination.page + 1)}
            disabled={pagination.page >= pagination.totalPages}
          >
            Следующая
          </Button>
        </div>
      )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
