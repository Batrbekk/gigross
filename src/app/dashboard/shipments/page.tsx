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
import { useAuthStore } from '@/stores/authStore';
import { Shipment, ShipmentStatus, UserRole } from '@/types';
import { 
  Search, 
  Filter, 
  Eye, 
  MoreHorizontal,
  Truck,
  CheckCircle,
  XCircle,
  Clock,
  Package,
  Calendar,
  MapPin
} from 'lucide-react';
import Link from 'next/link';

interface ShipmentsResponse {
  data: Shipment[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export default function ShipmentsPage() {
  const { user } = useAuthStore();
  const { execute, isLoading } = useApi();
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<ShipmentStatus | 'all'>('all');
  const [isTableLoading, setIsTableLoading] = useState(false);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  });

  const fetchShipments = async (page = 1, search = '', status: ShipmentStatus | 'all' = 'all', showTableLoader = false) => {
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

      const response = await execute(`/api/shipments?${params}`, { method: 'GET' });
      if (response && response.success) {
        const data = response.data as ShipmentsResponse;
        setShipments(data.data);
        setPagination(data.pagination);
      }
    } catch (error) {
      console.error('Failed to fetch shipments:', error);
    } finally {
      if (showTableLoader) {
        setIsTableLoading(false);
      }
    }
  };

  useEffect(() => {
    fetchShipments();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchShipments(1, searchQuery, statusFilter, true);
  };

  const handleStatusFilter = (status: ShipmentStatus | 'all') => {
    setStatusFilter(status);
    fetchShipments(1, searchQuery, status, true);
  };

  const handlePageChange = (newPage: number) => {
    fetchShipments(newPage, searchQuery, statusFilter, true);
  };

  const getStatusBadge = (status: ShipmentStatus) => {
    const statusConfig: Record<ShipmentStatus, { label: string; variant: 'default' | 'secondary' | 'outline' | 'destructive'; icon: React.ElementType }> = {
      [ShipmentStatus.PENDING]: { 
        label: 'Ожидает', 
        variant: 'outline' as const, 
        icon: Clock 
      },
      [ShipmentStatus.IN_TRANSIT]: { 
        label: 'В пути', 
        variant: 'default' as const, 
        icon: Truck 
      },
      [ShipmentStatus.DELIVERED]: { 
        label: 'Доставлен', 
        variant: 'secondary' as const, 
        icon: CheckCircle 
      },
      [ShipmentStatus.CANCELLED]: { 
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

  if (isLoading && shipments.length === 0) {
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
                <div key={`shipment-skeleton-${i}`} className="flex items-center space-x-4">
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
          <h1 className="text-3xl font-bold tracking-tight">Отгрузки</h1>
          <p className="text-muted-foreground">
            Отслеживайте доставку и логистику
          </p>
        </div>
      </div>

      {/* Фильтры и поиск */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Truck className="h-5 w-5" />
            Отгрузки
          </CardTitle>
          <CardDescription>
            Всего отгрузок: {pagination.total}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 mb-6">
            <form onSubmit={handleSearch} className="flex items-center gap-2 flex-1">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Поиск по номеру отслеживания..."
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
                <DropdownMenuItem onClick={() => handleStatusFilter(ShipmentStatus.PENDING)}>
                  Ожидающие
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleStatusFilter(ShipmentStatus.IN_TRANSIT)}>
                  В пути
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleStatusFilter(ShipmentStatus.DELIVERED)}>
                  Доставленные
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleStatusFilter(ShipmentStatus.CANCELLED)}>
                  Отмененные
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {shipments.length === 0 ? (
            <EmptyState
              icon={Truck}
              title="Нет отгрузок"
              description="Здесь будут отображаться ваши отгрузки и доставки"
              className="h-[400px] min-h-[400px]"
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Номер отслеживания</TableHead>
                  <TableHead>Лот</TableHead>
                  <TableHead>Перевозчик</TableHead>
                  <TableHead>Откуда</TableHead>
                  <TableHead>Куда</TableHead>
                  <TableHead>Статус</TableHead>
                  <TableHead>Ожидаемая доставка</TableHead>
                  <TableHead className="text-right">Действия</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isTableLoading ? (
                  <TableShimmer rows={5} columns={7} />
                ) : (
                  shipments.map((shipment, index) => (
                  <TableRow key={shipment._id || shipment.id || `shipment-${index}`}>
                    <TableCell>
                      <div className="font-medium">
                        {shipment.trackingNumber}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {shipment.lotId?.slice(-6) || 'N/A'}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Package className="h-3 w-3" />
                        {shipment.carrier}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-sm">
                        <MapPin className="h-3 w-3" />
                        {shipment.origin.city}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-sm">
                        <MapPin className="h-3 w-3" />
                        {shipment.destination.city}
                      </div>
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(shipment.status)}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-sm">
                        <Calendar className="h-3 w-3" />
                        {new Date(shipment.estimatedDelivery).toLocaleDateString('ru-RU')}
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
                            <Link href={`/dashboard/shipments/${shipment._id || shipment.id}`}>
                              <Eye className="mr-2 h-4 w-4" />
                              Отследить
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
