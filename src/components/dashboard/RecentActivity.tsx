'use client';

import { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/empty-state';
import { UserRole } from '@/types';
import { useApi } from '@/hooks/useApi';
import { 
  Package, 
  Gavel, 
  ShoppingCart, 
  TrendingUp, 
  User, 
  UserPlus,
  Award,
  Bell,
  DollarSign,
  Activity
} from 'lucide-react';

interface RecentActivityProps {
  userRole: UserRole;
}

interface ActivityItem {
  id: string;
  type: string;
  title: string;
  description: string;
  time: string | Date;
  icon: string;
  badge?: {
    text: string;
    variant: 'default' | 'secondary' | 'destructive' | 'outline';
  };
  user?: {
    name: string;
    avatar?: string;
  };
}

export function RecentActivity({ userRole }: RecentActivityProps) {
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const { execute, isLoading } = useApi();

  useEffect(() => {
    const fetchActivities = async () => {
      try {
        const response = await execute(`/api/dashboard/activity`, { method: 'GET' });
        if (response && response.success && Array.isArray(response.data)) {
          setActivities(response.data as ActivityItem[]);
        }
      } catch (error) {
        console.error('Failed to fetch activities:', error);
      }
    };

    fetchActivities();
  }, [userRole, execute]);

  // Функция для получения иконки по строковому названию
  const getIconComponent = (iconName: string): React.ElementType => {
    const iconMap: Record<string, React.ElementType> = {
      Package,
      Gavel,
      TrendingUp,
      User,
      UserPlus,
      Award,
      Bell,
      ShoppingCart,
      DollarSign,
      Activity,
    };
    return iconMap[iconName] || Activity;
  };

  // Функция для форматирования времени
  const formatTime = (time: string | Date): string => {
    const date = new Date(time);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));

    if (diffInMinutes < 1) {
      return 'только что';
    } else if (diffInMinutes < 60) {
      return `${diffInMinutes} мин назад`;
    } else if (diffInMinutes < 1440) {
      const hours = Math.floor(diffInMinutes / 60);
      return `${hours} ч назад`;
    } else {
      const days = Math.floor(diffInMinutes / 1440);
      return `${days} дн назад`;
    }
  };

  if (isLoading) {
    return (
      <ScrollArea className="h-[300px]">
        <div className="space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={`activity-skeleton-${i}`} className="flex items-start space-x-3">
              <Skeleton className="h-8 w-8 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>
    );
  }

  if (activities.length === 0) {
    return (
      <EmptyState
        icon={Activity}
        title="Нет активности"
        description="Здесь будет отображаться последняя активность в системе"
        className="h-[300px] min-h-[300px]"
      />
    );
  }

  return (
    <ScrollArea className="h-[300px]">
      <div className="space-y-4">
        {activities.map((activity) => {
          const IconComponent = getIconComponent(activity.icon);
          return (
            <div key={activity.id} className="flex items-start space-x-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted">
                <IconComponent className="h-4 w-4" />
              </div>
              <div className="flex-1 space-y-1">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium leading-none">{activity.title}</p>
                  {activity.badge && (
                    <Badge variant={activity.badge.variant} className="text-xs">
                      {activity.badge.text}
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">{activity.description}</p>
                <p className="text-xs text-muted-foreground">{formatTime(activity.time)}</p>
              </div>
            </div>
          );
        })}
      </div>
    </ScrollArea>
  );
}