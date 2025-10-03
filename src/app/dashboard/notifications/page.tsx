'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ListShimmer } from '@/components/ui/animated-skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { EmptyState } from '@/components/ui/empty-state';
import { useApi } from '@/hooks/useApi';
// import { useAuthStore } from '@/stores/authStore'; // Не используется
import { Notification, NotificationType } from '@/types';
import { 
  Bell, 
  BellRing, 
  Check, 
  CheckCheck, 
  Trash2,
  Filter,
  MoreHorizontal,
  Gavel,
  Package,
  DollarSign,
  AlertTriangle,
  Info,
  Award,
  TrendingUp,
} from 'lucide-react';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface NotificationsResponse {
  data: Notification[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export default function NotificationsPage() {
  // const { user } = useAuthStore(); // Не используется
  const { execute, isLoading } = useApi();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  });
  const [filter, setFilter] = useState<'all' | 'unread' | NotificationType>('all');
  const [isTableLoading, setIsTableLoading] = useState(false);

  const fetchNotifications = async (page = 1, filterType = 'all', showTableLoader = false) => {
    try {
      if (showTableLoader) {
        setIsTableLoading(true);
      }
      
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20',
        ...(filterType === 'unread' && { read: 'false' }),
        ...(filterType !== 'all' && filterType !== 'unread' && { type: filterType }),
      });

      const response = await execute(`/api/notifications?${params}`, { method: 'GET' });
      if (response && response.success) {
        const data = response.data as NotificationsResponse;
        setNotifications(data.data);
        setPagination(data.pagination);
      }
    } catch {
      // Обработка ошибки загрузки уведомлений
      setNotifications([]);
    } finally {
      if (showTableLoader) {
        setIsTableLoading(false);
      }
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleFilterChange = (newFilter: 'all' | 'unread' | NotificationType) => {
    setFilter(newFilter);
    fetchNotifications(1, newFilter, true);
  };

  const handleMarkAsRead = async (notificationIds: string[]) => {
    try {
      await execute('/api/notifications/mark-read', {
        method: 'PUT',
        body: JSON.stringify({
          notificationIds,
        }),
      });
      // Обновляем локальное состояние
      setNotifications(prev => 
        prev.map(notification => 
          notificationIds.includes(notification.id || notification._id) 
            ? { ...notification, read: true }
            : notification
        )
      );
    } catch {
      // Обработка ошибки отметки как прочитанное
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await execute('/api/notifications/mark-read', {
        method: 'PUT',
        body: JSON.stringify({
          markAll: true,
        }),
      });
      // Обновляем локальное состояние
      setNotifications(prev => 
        prev.map(notification => ({ ...notification, read: true }))
      );
    } catch {
      // Обработка ошибки отметки всех как прочитанные
    }
  };

  const getNotificationIcon = (type: NotificationType) => {
    const iconMap: Record<string, any> = {
      [NotificationType.NEW_BID]: Gavel,
      [NotificationType.BID_WON]: Award,
      [NotificationType.BID_OUTBID]: TrendingUp,
      [NotificationType.AUCTION_ENDING]: Bell,
      [NotificationType.PRODUCT_APPROVED]: Package,
      [NotificationType.PRODUCT_REJECTED]: AlertTriangle,
      [NotificationType.PAYMENT_RECEIVED]: DollarSign,
      [NotificationType.PAYMENT_FAILED]: AlertTriangle,
      [NotificationType.SYSTEM_UPDATE]: Info,
      [NotificationType.CERTIFICATE_APPROVED]: Award,
      [NotificationType.CERTIFICATE_REJECTED]: AlertTriangle,
      [NotificationType.BID_UPDATE]: Gavel,
      [NotificationType.LOT_WON]: Award,
      [NotificationType.PAYMENT]: DollarSign,
      [NotificationType.SHIPMENT]: Package,
      [NotificationType.SYSTEM]: Info,
    };
    return iconMap[type] || Bell;
  };

  const getNotificationColor = (type: NotificationType) => {
    const colorMap: Record<string, string> = {
      [NotificationType.NEW_BID]: 'text-blue-500',
      [NotificationType.BID_WON]: 'text-green-500',
      [NotificationType.BID_OUTBID]: 'text-orange-500',
      [NotificationType.AUCTION_ENDING]: 'text-yellow-500',
      [NotificationType.PRODUCT_APPROVED]: 'text-green-500',
      [NotificationType.PRODUCT_REJECTED]: 'text-red-500',
      [NotificationType.PAYMENT_RECEIVED]: 'text-green-500',
      [NotificationType.PAYMENT_FAILED]: 'text-red-500',
      [NotificationType.SYSTEM_UPDATE]: 'text-blue-500',
      [NotificationType.CERTIFICATE_APPROVED]: 'text-green-500',
      [NotificationType.CERTIFICATE_REJECTED]: 'text-red-500',
      [NotificationType.BID_UPDATE]: 'text-blue-500',
      [NotificationType.LOT_WON]: 'text-green-500',
      [NotificationType.PAYMENT]: 'text-green-500',
      [NotificationType.SHIPMENT]: 'text-blue-500',
      [NotificationType.SYSTEM]: 'text-gray-500',
    };
    return colorMap[type] || 'text-gray-500';
  };

  const getTypeLabel = (type: NotificationType) => {
    const labelMap: Record<string, string> = {
      [NotificationType.NEW_BID]: 'Новая ставка',
      [NotificationType.BID_WON]: 'Ставка выиграна',
      [NotificationType.BID_OUTBID]: 'Ставка перебита',
      [NotificationType.AUCTION_ENDING]: 'Аукцион завершается',
      [NotificationType.PRODUCT_APPROVED]: 'Продукт одобрен',
      [NotificationType.PRODUCT_REJECTED]: 'Продукт отклонен',
      [NotificationType.PAYMENT_RECEIVED]: 'Платеж получен',
      [NotificationType.PAYMENT_FAILED]: 'Ошибка платежа',
      [NotificationType.SYSTEM_UPDATE]: 'Системное обновление',
      [NotificationType.CERTIFICATE_APPROVED]: 'Сертификат одобрен',
      [NotificationType.CERTIFICATE_REJECTED]: 'Сертификат отклонен',
      [NotificationType.BID_UPDATE]: 'Обновление ставки',
      [NotificationType.LOT_WON]: 'Лот выигран',
      [NotificationType.PAYMENT]: 'Платеж',
      [NotificationType.SHIPMENT]: 'Доставка',
      [NotificationType.SYSTEM]: 'Система',
    };
    return labelMap[type] || 'Уведомление';
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  if (isLoading && notifications.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <Skeleton className="h-8 w-48" />
            <Skeleton className="mt-2 h-4 w-96" />
          </div>
          <div className="flex gap-2">
            <Skeleton className="h-10 w-32" />
            <Skeleton className="h-10 w-24" />
          </div>
        </div>
        <Card>
          <CardContent className="p-6">
            <div className="space-y-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={`notifications-skeleton-${i}`} className="flex items-start space-x-4">
                  <Skeleton className="h-10 w-10 rounded-full" />
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
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Bell className="h-8 w-8" />
            Уведомления
            {unreadCount > 0 && (
              <Badge variant="destructive" className="ml-2">
                {unreadCount}
              </Badge>
            )}
          </h1>
          <p className="text-muted-foreground">
            Управляйте своими уведомлениями и оповещениями
          </p>
        </div>
        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">
                <Filter className="mr-2 h-4 w-4" />
                Фильтр: {filter === 'all' ? 'Все' : filter === 'unread' ? 'Непрочитанные' : getTypeLabel(filter as NotificationType)}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Фильтр уведомлений</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => handleFilterChange('all')}>
                Все уведомления
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleFilterChange('unread')}>
                Непрочитанные
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => handleFilterChange(NotificationType.NEW_BID)}>
                Новые ставки
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleFilterChange(NotificationType.BID_WON)}>
                Выигранные ставки
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleFilterChange(NotificationType.PAYMENT_RECEIVED)}>
                Платежи
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleFilterChange(NotificationType.SYSTEM_UPDATE)}>
                Системные
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          {unreadCount > 0 && (
            <Button onClick={handleMarkAllAsRead}>
              <CheckCheck className="mr-2 h-4 w-4" />
              Отметить все как прочитанные
            </Button>
          )}
        </div>
      </div>

      {/* Статистика */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Всего</CardTitle>
            <Bell className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pagination.total}</div>
            <p className="text-xs text-muted-foreground">уведомлений</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Непрочитанные</CardTitle>
            <BellRing className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{unreadCount}</div>
            <p className="text-xs text-muted-foreground">требуют внимания</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Сегодня</CardTitle>
            <Info className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {notifications.filter(n => 
                new Date(n.createdAt).toDateString() === new Date().toDateString()
              ).length}
            </div>
            <p className="text-xs text-muted-foreground">новых уведомлений</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Важные</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {notifications.filter(n => 
                [NotificationType.PAYMENT_FAILED, NotificationType.PRODUCT_REJECTED, NotificationType.CERTIFICATE_REJECTED].includes(n.type)
              ).length}
            </div>
            <p className="text-xs text-muted-foreground">требуют действий</p>
          </CardContent>
        </Card>
      </div>

      {/* Список уведомлений */}
      <Card>
        <CardHeader>
          <CardTitle>Уведомления</CardTitle>
          <CardDescription>
            {filter === 'all' && `Показано ${notifications.length} из ${pagination.total} уведомлений`}
            {filter === 'unread' && `Показано ${notifications.length} непрочитанных уведомлений`}
            {filter !== 'all' && filter !== 'unread' && `Показано ${notifications.length} уведомлений типа "${getTypeLabel(filter as NotificationType)}"`}
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {notifications.length === 0 ? (
            <EmptyState
              icon={Bell}
              title="Нет уведомлений"
              description="У вас пока нет уведомлений. Они появятся здесь, когда произойдут важные события."
              className="h-[400px] min-h-[400px]"
            />
          ) : (
            <ScrollArea className="h-[600px]">
              <div className="space-y-1">
                {isTableLoading ? (
                  <ListShimmer count={5} />
                ) : (
                  notifications.map((notification, index) => {
                const Icon = getNotificationIcon(notification.type);
                const iconColor = getNotificationColor(notification.type);
                
                return (
                  <div key={notification.id || notification._id}>
                    <div className={`flex items-start space-x-4 p-4 hover:bg-muted/50 transition-colors ${
                      !notification.read ? 'bg-muted/30' : ''
                    }`}>
                      <div className={`flex h-10 w-10 items-center justify-center rounded-full ${
                        !notification.read ? 'bg-primary/10' : 'bg-muted'
                      }`}>
                        <Icon className={`h-5 w-5 ${!notification.read ? iconColor : 'text-muted-foreground'}`} />
                      </div>
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <p className={`text-sm font-medium ${!notification.read ? 'font-semibold' : ''}`}>
                              {notification.title}
                            </p>
                            {!notification.read && (
                              <div className="h-2 w-2 rounded-full bg-primary" />
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-xs">
                              {getTypeLabel(notification.type)}
                            </Badge>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                {!notification.read && (
                                  <DropdownMenuItem onClick={() => handleMarkAsRead([notification.id || notification._id])}>
                                    <Check className="mr-2 h-4 w-4" />
                                    Отметить как прочитанное
                                  </DropdownMenuItem>
                                )}
                                <DropdownMenuItem className="text-destructive">
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  Удалить
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {notification.message}
                        </p>
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <span>
                            {new Date(notification.createdAt).toLocaleString('ru-RU', {
                              day: '2-digit',
                              month: '2-digit',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                          {notification.data && (
                            <span className="text-xs bg-muted px-2 py-1 rounded">
                              Есть дополнительные данные
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    {index < notifications.length - 1 && <Separator />}
                  </div>
                );
                })
                )}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>

      {/* Пагинация */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchNotifications(pagination.page - 1, filter)}
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
                  onClick={() => fetchNotifications(page, filter)}
                >
                  {page}
                </Button>
              );
            })}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchNotifications(pagination.page + 1, filter)}
            disabled={pagination.page >= pagination.totalPages}
          >
            Следующая
          </Button>
        </div>
      )}
    </div>
  );
}
