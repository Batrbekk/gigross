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
import { Lot, LotStatus, UserRole, AuctionType } from '@/types';
import { formatCurrency, CurrencyCode } from '@/lib/currency';
import { 
  Plus, 
  Search, 
  Filter, 
  MoreHorizontal, 
  Edit, 
  Trash2, 
  Eye,
  Gavel,
  Clock,
  CheckCircle,
  XCircle,
  MapPin,
  Power,
  PowerOff,
} from 'lucide-react';
import Link from 'next/link';

interface LotsResponse {
  data: Lot[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export default function LotsPage() {
  const { user } = useAuthStore();
  const { execute, isLoading } = useApi();
  const [lots, setLots] = useState<Lot[]>([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<LotStatus | 'all'>('all');
  const [activeTab, setActiveTab] = useState<'my' | 'all'>('my');
  const [isTableLoading, setIsTableLoading] = useState(false);

  const fetchLots = async (page = 1, search = '', status = 'all', tab: 'my' | 'all' = activeTab) => {
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
        // Для вкладки "Все лоты" исключаем черновики
        ...(tab === 'all' && { excludeStatus: 'draft' }),
        // Для вкладки "Активные торги" показываем только активные лоты
        ...(tab === 'active' && { status: 'active' }),
      });

      const response = await execute(`/api/lots?${params}`, { method: 'GET' });
      if (response && response.success) {
        const data = response.data as LotsResponse;
        setLots(data.data);
        setPagination(data.pagination);
      }
    } catch {
      // Обработка ошибки загрузки лотов
    } finally {
      setIsTableLoading(false);
    }
  };

  useEffect(() => {
    fetchLots();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchLots(1, searchQuery, statusFilter, activeTab);
  };

  const handleStatusFilter = (status: LotStatus | 'all') => {
    setStatusFilter(status);
    fetchLots(1, searchQuery, status, activeTab);
  };

  const handlePageChange = (newPage: number) => {
    fetchLots(newPage, searchQuery, statusFilter, activeTab);
  };

  const handleTabChange = (tab: 'my' | 'all') => {
    setActiveTab(tab);
    // Сбрасываем фильтры при переключении вкладок для лучшего UX
    setSearchQuery('');
    setStatusFilter('all');
    fetchLots(1, '', 'all', tab);
  };

  const handleDeleteLot = async (lotId: string) => {
    try {
      const response = await execute(`/api/lots/${lotId}`, { method: 'DELETE' });
      if (response && response.success) {
        // Обновляем список лотов после удаления
        fetchLots(pagination.page, searchQuery, statusFilter, activeTab);
      }
    } catch {
      // Обработка ошибки удаления лота
    }
  };

  const handleToggleLotStatus = async (lotId: string, currentStatus: LotStatus) => {
    try {
      const newStatus = currentStatus === LotStatus.DRAFT ? LotStatus.ACTIVE : LotStatus.DRAFT;
      
      const response = await execute(`/api/lots/${lotId}`, {
        method: 'PUT',
        body: JSON.stringify({ status: newStatus }),
      });
      
      if (response && response.success) {
        // Обновляем список лотов
        fetchLots(pagination.page, searchQuery, statusFilter, activeTab);
      }
    } catch (error) {
      console.error('Error toggling lot status:', error);
    }
  };

  const getStatusBadge = (status: LotStatus) => {
    const statusConfig = {
      [LotStatus.DRAFT]: { 
        label: 'Черновик', 
        variant: 'secondary' as const, 
        icon: Edit,
        className: ''
      },
      [LotStatus.ACTIVE]: { 
        label: 'Активный', 
        variant: 'default' as const, 
        icon: CheckCircle,
        className: ''
      },
      [LotStatus.SOLD]: { 
        label: 'Продан', 
        variant: 'default' as const, 
        icon: CheckCircle,
        className: 'bg-green-100 text-green-800'
      },
      [LotStatus.EXPIRED]: { 
        label: 'Истек', 
        variant: 'destructive' as const, 
        icon: XCircle,
        className: ''
      },
      [LotStatus.CANCELLED]: { 
        label: 'Отменен', 
        variant: 'outline' as const, 
        icon: XCircle,
        className: ''
      },
    };

    const config = statusConfig[status];
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className={`flex items-center gap-1 ${config.className}`}>
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    );
  };

  const getAuctionTypeBadge = (type: AuctionType) => {
    const typeConfig = {
      [AuctionType.AUCTION]: { label: 'Аукцион', variant: 'default' as const },
      [AuctionType.FIXED]: { label: 'Фиксированная цена', variant: 'secondary' as const },
      [AuctionType.REVERSE_AUCTION]: { label: 'Обратный аукцион', variant: 'outline' as const },
    };

    const config = typeConfig[type];
    return (
      <Badge variant={config.variant}>
        {config.label}
      </Badge>
    );
  };

  const formatTimeRemaining = (endDate: string | Date) => {
    if (!endDate) return 'Не указано';
    
    const now = new Date();
    const end = new Date(endDate);
    
    // Проверяем, что дата валидна
    if (isNaN(end.getTime())) {
      return 'Неверная дата';
    }
    
    const diff = end.getTime() - now.getTime();

    if (diff <= 0) {
      return 'Завершен';
    }

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    if (days > 0) {
      return `${days}д ${hours}ч`;
    } else if (hours > 0) {
      return `${hours}ч ${minutes}м`;
    } else {
      return `${minutes}м`;
    }
  };

  const canManageLots = user?.role === UserRole.PRODUCER || user?.role === UserRole.ADMIN;
  
  const isMyLot = (lot: Lot) => {
    const lotOwnerId = typeof lot.producerId === 'string'
      ? lot.producerId
      : (lot.producerId as { _id: string })?._id;
    const userId = user?._id || user?.id || user?.userId;
    return lotOwnerId === userId;
  };

  const getAvailableActions = (lot: Lot) => {
    const actions = [];
    
    // Просмотр доступен всегда
    actions.push({
      label: 'Просмотр',
      href: `/dashboard/lots/${lot._id}`,
      icon: Eye,
    });

    // Участие в торгах только для дистрибьюторов на активных лотах
    if (lot.status === LotStatus.ACTIVE && user?.role === UserRole.DISTRIBUTOR) {
      actions.push({
        label: 'Участвовать в торгах',
        href: `/auction/${lot._id}`,
        icon: Gavel,
      });
    }

    // Редактирование, активация/деактивация и удаление только для владельцев лотов
    if (canManageLots && isMyLot(lot)) {
      // Кнопка активации/деактивации для черновиков и активных лотов
      if (lot.status === LotStatus.DRAFT || lot.status === LotStatus.ACTIVE) {
        actions.push({
          label: lot.status === LotStatus.DRAFT ? 'Активировать' : 'Деактивировать',
          href: '#',
          icon: lot.status === LotStatus.DRAFT ? Power : PowerOff,
          onClick: () => handleToggleLotStatus(lot._id, lot.status),
        });
      }
      
      actions.push({
        label: 'Редактировать',
        href: `/dashboard/lots/${lot._id}/edit`,
        icon: Edit,
      });
      actions.push({
        label: 'Удалить',
        href: '#',
        icon: Trash2,
        isDestructive: true,
        onClick: () => handleDeleteLot(lot._id),
      });
    }

    return actions;
  };

  if (isLoading && lots.length === 0 && !isTableLoading) {
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
                <div key={`lots-skeleton-${i}`} className="flex items-center space-x-4">
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
          <h1 className="text-3xl font-bold tracking-tight text-text-heading">Лоты</h1>
          <p className="text-text-body">
            {canManageLots 
              ? 'Управляйте своими лотами и аукционами'
              : 'Просматривайте доступные лоты для торгов'
            }
          </p>
        </div>
        {canManageLots && activeTab === 'my' && (
          <Button asChild>
            <Link href="/dashboard/lots/new">
              <Plus className="mr-2 h-4 w-4" />
              Создать лот
            </Link>
          </Button>
        )}
      </div>

      {/* Вкладки */}
      <Tabs value={activeTab} onValueChange={(value) => handleTabChange(value as 'my' | 'all')}>
        <TabsList className="grid w-full grid-cols-2 max-w-[400px]">
          <TabsTrigger value="my">Мои лоты</TabsTrigger>
          <TabsTrigger value="all">Все лоты</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="space-y-6">
          {/* Фильтры и поиск */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Gavel className="h-5 w-5" />
                {activeTab === 'my' ? 'Мои лоты' : 'Торговые лоты'}
              </CardTitle>
              <CardDescription>
                {activeTab === 'my' ? 'Мои лоты' : 'Все лоты'}: {pagination.total}
              </CardDescription>
            </CardHeader>
            <CardContent>
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <form onSubmit={handleSearch} className="flex gap-2">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Поиск лотов..."
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
                  Статус: {statusFilter === 'all' ? 'Все' : statusFilter}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Фильтр по статусу</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => handleStatusFilter('all')}>
                  Все статусы
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleStatusFilter(LotStatus.ACTIVE)}>
                  Активные
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleStatusFilter(LotStatus.DRAFT)}>
                  Черновики
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleStatusFilter(LotStatus.SOLD)}>
                  Проданные
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleStatusFilter(LotStatus.EXPIRED)}>
                  Истекшие
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardContent>
      </Card>

      {/* Таблица лотов */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table className="min-w-[800px]">
            <TableHeader>
              <TableRow>
                <TableHead>Название</TableHead>
                <TableHead>Тип аукциона</TableHead>
                <TableHead>Текущая цена</TableHead>
                <TableHead>Статус</TableHead>
                <TableHead>Время до окончания</TableHead>
                <TableHead>Местоположение</TableHead>
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
                    <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                    <TableCell className="text-right">
                      <Skeleton className="h-8 w-8" />
                    </TableCell>
                  </TableRow>
                ))
              ) : lots.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">
                    <div className="flex flex-col items-center gap-2">
                      <Gavel className="h-12 w-12 text-muted-foreground" />
                      <h3 className="text-lg font-semibold">
                        {activeTab === 'my' ? 'У вас пока нет лотов' : 'Лоты не найдены'}
                      </h3>
                      <p className="text-muted-foreground">
                        {activeTab === 'my' 
                          ? 'Создайте свой первый лот для участия в торгах'
                          : 'Попробуйте изменить фильтры поиска'
                        }
                      </p>
                      {activeTab === 'my' && canManageLots && (
                        <Button asChild className="mt-2">
                          <Link href="/dashboard/lots/new">
                            <Plus className="mr-2 h-4 w-4" />
                            Создать лот
                          </Link>
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                lots.map((lot) => (
                <TableRow key={lot._id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">
                        {lot.title?.length > 30 
                          ? `${lot.title.substring(0, 30)}...` 
                          : lot.title}
                      </div>
                      <div className="text-sm text-muted-foreground line-clamp-1">
                        {lot.description?.length > 40 
                          ? `${lot.description.substring(0, 40)}...` 
                          : lot.description}
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        Количество: {lot.quantity} {lot.unit}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    {getAuctionTypeBadge(lot.auction.type)}
                  </TableCell>
                  <TableCell>
                    <div className="font-medium">
                      {formatCurrency(lot.currentPrice, lot.currency as CurrencyCode)}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Стартовая: {formatCurrency(lot.startingPrice, lot.currency as CurrencyCode)}
                    </div>
                  </TableCell>
                  <TableCell>
                    {getStatusBadge(lot.status)}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3 text-muted-foreground" />
                      <span className="text-sm">
                        {formatTimeRemaining(lot.auction.endDate)}
                      </span>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {lot.auction.endDate && !isNaN(new Date(lot.auction.endDate).getTime())
                        ? new Date(lot.auction.endDate).toLocaleDateString('ru-RU')
                        : 'Неверная дата'
                      }
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <MapPin className="h-3 w-3 text-muted-foreground" />
                      <span className="text-sm">
                        {lot.location.city}, {lot.location.country}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    {(() => {
                      const actions = getAvailableActions(lot);
                      
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
                                        <AlertDialogTitle>Удалить лот?</AlertDialogTitle>
                                        <AlertDialogDescription>
                                          Это действие нельзя отменить. Лот &quot;{lot.title}&quot; будет удален навсегда.
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
                                  // Для действий с onClick (удаление, активация/деактивация)
                                  const isDeleteAction = action.isDestructive;
                                  
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
                                          <AlertDialogTitle>
                                            {isDeleteAction ? 'Удалить лот?' : 
                                             action.label === 'Активировать' ? 'Активировать лот?' : 
                                             'Деактивировать лот?'}
                                          </AlertDialogTitle>
                                          <AlertDialogDescription>
                                            {isDeleteAction ? 
                                              `Это действие нельзя отменить. Лот "${lot.title}" будет удален навсегда.` :
                                              action.label === 'Активировать' ?
                                              `Лот "${lot.title}" будет активирован и станет доступен для участия в торгах.` :
                                              `Лот "${lot.title}" будет деактивирован и станет недоступен для участия в торгах.`
                                            }
                                          </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                          <AlertDialogCancel>Отмена</AlertDialogCancel>
                                          <AlertDialogAction 
                                            onClick={action.onClick}
                                            className={isDeleteAction ? 
                                              "bg-destructive text-white hover:bg-destructive/90" :
                                              "bg-primary text-white hover:bg-primary/90"
                                            }
                                          >
                                            {isDeleteAction ? 'Удалить' : action.label}
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
