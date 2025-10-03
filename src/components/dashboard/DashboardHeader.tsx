'use client';

import { useState, useEffect } from 'react';
import { Bell, LogOut, Search, Settings, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { useAuthStore } from '@/stores/authStore';
import { useRouter } from 'next/navigation';
import { useApi } from '@/hooks/useApi';
import Link from 'next/link';

export function DashboardHeader() {
  const { user, logout, fetchProfile } = useAuthStore();
  const router = useRouter();
  const { execute } = useApi();
  const [unreadCount, setUnreadCount] = useState(0);

  // Загружаем профиль при монтировании для обновления аватарки
  useEffect(() => {
    const loadProfile = async () => {
      try {
        await fetchProfile();
      } catch (error) {
        console.error('Error loading profile in header:', error);
      }
    };

    loadProfile();
  }, [fetchProfile]);

  const handleLogout = async () => {
    await logout();
    router.push('/');
  };

  const getInitials = (firstName?: string, lastName?: string, email?: string) => {
    if (firstName && lastName) {
      return `${firstName[0]}${lastName[0]}`.toUpperCase();
    }
    if (email) {
      return email.substring(0, 2).toUpperCase();
    }
    return 'U';
  };

  const getUserDisplayName = () => {
    if (user?.profile?.firstName && user?.profile?.lastName) {
      return `${user.profile.firstName} ${user.profile.lastName}`;
    }
    if (user?.profile?.company) {
      return user.profile.company;
    }
    return user?.email || '';
  };

  // Загружаем количество непрочитанных уведомлений
  useEffect(() => {
    const fetchUnreadCount = async () => {
      try {
        const response = await execute('/api/notifications?read=false&limit=1', { method: 'GET' });
        if (response && response.success) {
          setUnreadCount((response.data as { pagination?: { total?: number } })?.pagination?.total || 0);
        }
      } catch (error) {
        console.error(error);
        // Игнорируем ошибки
      }
    };

    fetchUnreadCount();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-bg-sidebar-header/95 backdrop-blur supports-[backdrop-filter]:bg-bg-sidebar-header/60">
      <div className="flex h-14 items-center px-4">
        <div className="flex items-center gap-4">
          <SidebarTrigger className="-ml-1" />
          <div className="hidden md:flex">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-text-body" />
              <Input
                type="search"
                placeholder="Поиск продуктов, лотов..."
                className="w-[300px] pl-8 border-border focus:ring-accent-primary"
              />
            </div>
          </div>
        </div>

        <div className="ml-auto flex items-center gap-2">
          {/* Уведомления */}
          <div className="relative">
            <Button variant="ghost" size="icon" asChild className="hover:bg-bg-menu-open">
              <Link href="/dashboard/notifications">
                <Bell className="h-4 w-4 text-text-body" />
              </Link>
            </Button>
            {unreadCount > 0 && (
              <Badge
                variant="destructive"
                className="absolute -right-1 -top-1 h-5 w-5 rounded-full p-0 text-xs flex items-center justify-center bg-accent-secondary"
              >
                {unreadCount > 99 ? '99+' : unreadCount}
              </Badge>
            )}
          </div>

          {/* Профиль пользователя */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-8 w-8 rounded-full hover:bg-bg-menu-open">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={user?.profile?.avatar} alt={getUserDisplayName()} />
                  <AvatarFallback className="bg-accent-primary text-white">
                    {getInitials(user?.profile?.firstName, user?.profile?.lastName, user?.email)}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56 bg-white border-border" align="end" forceMount>
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none text-text-heading">{getUserDisplayName()}</p>
                  <p className="text-xs leading-none text-text-body">{user?.email}</p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild className="hover:bg-effect-purple">
                <Link href="/dashboard/profile">
                  <User className="mr-2 h-4 w-4" />
                  <span>Профиль</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild className="hover:bg-effect-purple">
                <Link href="/dashboard/profile">
                  <Settings className="mr-2 h-4 w-4" />
                  <span>Настройки</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout} className="hover:bg-effect-purple">
                <LogOut className="mr-2 h-4 w-4" />
                <span>Выйти</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
