'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { TableShimmer } from '@/components/ui/animated-skeleton';
import { EmptyState } from '@/components/ui/empty-state';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useApi } from '@/hooks/useApi';
import { Order, OrderStatus } from '@/types';
import { 
  Search, 
  Filter, 
  Eye, 
  MoreHorizontal,
  ShoppingCart,
  CheckCircle,
  XCircle,
  Clock,
  Package,
  Calendar,
  DollarSign
} from 'lucide-react';
import Link from 'next/link';

interface OrdersResponse {
  data: Order[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export default function OrdersPage() {
  const { execute, isLoading } = useApi();
  const [orders, setOrders] = useState<Order[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<OrderStatus | 'all'>('all');
  const [isTableLoading, setIsTableLoading] = useState(false);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  });

  const fetchOrders = async (page = 1, search = '', status: OrderStatus | 'all' = 'all', showTableLoader = false) => {
    try {
      if (showTableLoader) {
        setIsTableLoading(true);
      }
      
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '10',
        ...(search && { search }),
        ...(status !== 'all' && { status }),
      });

      const response = await execute(`/api/orders?${params}`, { method: 'GET' });
      if (response && response.success) {
        const data = response.data as OrdersResponse;
        setOrders(data.data);
        setPagination(data.pagination);
      }
    } catch (error) {
      console.error('Failed to fetch orders:', error);
    } finally {
      if (showTableLoader) {
        setIsTableLoading(false);
      }
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchOrders(1, searchQuery, statusFilter, true);
  };

  const handleStatusFilter = (status: OrderStatus | 'all') => {
    setStatusFilter(status);
    fetchOrders(1, searchQuery, status, true);
  };

  const handlePageChange = (newPage: number) => {
    fetchOrders(newPage, searchQuery, statusFilter, true);
  };

  const getStatusBadge = (status: OrderStatus) => {
    const statusConfig: Record<OrderStatus, { label: string; variant: 'default' | 'secondary' | 'outline' | 'destructive'; icon: React.ElementType }> = {
      [OrderStatus.PENDING]: { 
        label: 'Ожидает', 
        variant: 'outline' as const, 
        icon: Clock 
      },
      [OrderStatus.CONFIRMED]: { 
        label: 'Подтвержден', 
        variant: 'default' as const, 
        icon: CheckCircle 
      },
      [OrderStatus.SHIPPED]: { 
        label: 'Отправлен', 
        variant: 'secondary' as const, 
        icon: Package 
      },
      [OrderStatus.DELIVERED]: { 
        label: 'Доставлен', 
        variant: 'default' as const, 
        icon: CheckCircle 
      },
      [OrderStatus.CANCELLED]: { 
        label: 'Отменен', 
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

  if (isLoading && orders.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <Skeleton className="h-8 w-48" />
            <Skeleton className="mt-2 h-4 w-96" />
          </div>
        </div>
        
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-32" />
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={`order-skeleton-${i}`} className="flex items-center space-x-4">
                  <Skeleton className="h-12 w-12" />
                  <div className="space-y-2 flex-1">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
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
    <div className="space-y-6">
      {/* Заголовок */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Заказы</h1>
          <p className="text-muted-foreground">
            Управляйте заказами и отслеживайте их статус
          </p>
        </div>
      </div>

      {/* Фильтры и поиск */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5" />
            Заказы
          </CardTitle>
          <CardDescription>
            Всего заказов: {pagination.total}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 mb-6">
            <form onSubmit={handleSearch} className="flex items-center gap-2 flex-1">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Поиск по номеру заказа..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Button type="submit">Поиск</Button>
            </form>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline">
                  <Filter className="mr-2 h-4 w-4" />
                  Статус
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={() => handleStatusFilter('all')}>
                  Все статусы
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleStatusFilter(OrderStatus.PENDING)}>
                  Ожидающие
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleStatusFilter(OrderStatus.CONFIRMED)}>
                  Подтвержденные
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleStatusFilter(OrderStatus.SHIPPED)}>
                  Отправленные
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleStatusFilter(OrderStatus.DELIVERED)}>
                  Доставленные
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleStatusFilter(OrderStatus.CANCELLED)}>
                  Отмененные
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {orders.length === 0 ? (
            <EmptyState
              icon={ShoppingCart}
              title="Нет заказов"
              description="Здесь будут отображаться ваши заказы"
              className="h-[400px] min-h-[400px]"
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Номер заказа</TableHead>
                  <TableHead>Покупатель</TableHead>
                  <TableHead>Лот</TableHead>
                  <TableHead>Количество</TableHead>
                  <TableHead>Сумма</TableHead>
                  <TableHead>Статус</TableHead>
                  <TableHead>Дата</TableHead>
                  <TableHead className="text-right">Действия</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isTableLoading ? (
                  <TableShimmer rows={5} columns={7} />
                ) : (
                  orders.map((order, index) => (
                  <TableRow key={order._id || order.id || `order-${index}`}>
                    <TableCell>
                      <div className="font-medium">
                        #{order._id?.slice(-6) || 'N/A'}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{order.buyerId}</div>
                        <div className="text-sm text-muted-foreground">
                          ID: {order.buyerId?.slice(-6) || 'N/A'}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {order.lotId?.slice(-6) || 'N/A'}
                      </div>
                    </TableCell>
                    <TableCell>
                      {order.quantity} шт
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <DollarSign className="h-3 w-3" />
                        <span className="font-medium">
                          {order.totalAmount.toLocaleString()} ₽
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(order.status)}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-sm">
                        <Calendar className="h-3 w-3" />
                        {new Date(order.createdAt).toLocaleDateString('ru-RU')}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem asChild>
                            <Link href={`/dashboard/orders/${order._id || order.id}`}>
                              <Eye className="mr-2 h-4 w-4" />
                              Просмотр
                            </Link>
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
                )}
              </TableBody>
            </Table>
          )}

          {/* Пагинация */}
          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-center space-x-2 mt-6">
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
        </CardContent>
      </Card>
    </div>
  );
}
