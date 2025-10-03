'use client';

import { useEffect } from 'react';
import {
  BarChart3,
  FileText,
  Home,
  Package,
  Settings,
  ShoppingCart,
  TrendingUp,
  Users,
  Wallet,
  Bell,
  Truck,
  Award,
  PieChart,
  Activity,
  Gavel,
  ChevronDown,
  ChevronRight,
} from 'lucide-react';
import Image from 'next/image';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from '@/components/ui/sidebar';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuthStore } from '@/stores/authStore';
import { UserRole } from '@/types';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSidebarState } from '@/hooks/useSidebarState';

// Навигационные элементы для разных ролей
const navigationItems = {
  [UserRole.ADMIN]: [
    {
      title: 'Обзор',
      items: [
        { title: 'Главная', url: '/dashboard', icon: Home },
        { title: 'Аналитика', url: '/dashboard/analytics', icon: BarChart3 },
        { title: 'Отчеты', url: '/dashboard/reports', icon: FileText },
      ],
    },
    {
      title: 'Управление',
      items: [
        { title: 'Пользователи', url: '/dashboard/users', icon: Users },
        { title: 'Продукты', url: '/dashboard/products', icon: Package },
        { title: 'Лоты', url: '/dashboard/lots', icon: Gavel },
        { title: 'Транзакции', url: '/dashboard/transactions', icon: Wallet },
      ],
    },
    {
      title: 'Система',
      items: [
        { title: 'Сертификаты', url: '/dashboard/certificates', icon: Award },
        { title: 'Настройки', url: '/dashboard/settings', icon: Settings },
      ],
    },
  ],
  [UserRole.PRODUCER]: [
    {
      title: 'Обзор',
      items: [
        { title: 'Главная', url: '/dashboard', icon: Home },
        { title: 'Аналитика', url: '/dashboard/analytics', icon: PieChart },
      ],
    },
    {
      title: 'Мои товары',
      items: [
        { title: 'Продукты', url: '/dashboard/products', icon: Package },
        { title: 'Лоты', url: '/dashboard/lots', icon: Gavel },
        { title: 'Активные аукционы', url: '/dashboard/auctions', icon: Activity },
      ],
    },
    {
      title: 'Продажи',
      items: [
        { title: 'Заказы', url: '/dashboard/orders', icon: ShoppingCart },
        { title: 'Отгрузки', url: '/dashboard/shipments', icon: Truck },
        { title: 'Доходы', url: '/dashboard/revenue', icon: TrendingUp },
      ],
    },
    {
      title: 'Документы',
      items: [
        { title: 'Сертификаты', url: '/dashboard/certificates', icon: Award },
      ],
    },
  ],
  [UserRole.DISTRIBUTOR]: [
    {
      title: 'Обзор',
      items: [
        { title: 'Главная', url: '/dashboard', icon: Home },
        { title: 'Аналитика', url: '/dashboard/analytics', icon: BarChart3 },
      ],
    },
        {
          title: 'Закупки',
          items: [
            { title: 'Каталог', url: '/dashboard/catalog', icon: Package },
            { title: 'Мои ставки', url: '/dashboard/bids', icon: Gavel },
          ],
        },
    {
      title: 'Заказы',
      items: [
        { title: 'Покупки', url: '/dashboard/purchases', icon: ShoppingCart },
        { title: 'Доставки', url: '/dashboard/deliveries', icon: Truck },
        { title: 'Расходы', url: '/dashboard/expenses', icon: Wallet },
      ],
    },
    {
      title: 'Документы',
      items: [
        { title: 'Сертификаты', url: '/dashboard/certificates', icon: Award },
      ],
    },
  ],
  [UserRole.INVESTOR]: [
    {
      title: 'Обзор',
      items: [
        { title: 'Dashboard', url: '/dashboard', icon: Home },
        { title: 'Портфель', url: '/dashboard/portfolio', icon: PieChart },
      ],
    },
    {
      title: 'Инвестиции',
      items: [
        { title: 'Возможности', url: '/dashboard/opportunities', icon: TrendingUp },
        { title: 'Каталог', url: '/dashboard/catalog', icon: Package },
        { title: 'Мои ставки', url: '/dashboard/bids', icon: Gavel },
        { title: 'Мои инвестиции', url: '/dashboard/investments', icon: Wallet },
        { title: 'Доходность', url: '/dashboard/returns', icon: BarChart3 },
      ],
    },
    {
      title: 'Документы',
      items: [
        { title: 'Отчеты', url: '/dashboard/reports', icon: FileText },
      ],
    },
  ]
};

export function AppSidebar() {
  const { user, fetchProfile } = useAuthStore();
  const pathname = usePathname();
  const { activeGroup, expandedGroups, toggleGroup, setActiveGroup } = useSidebarState();

  // Загружаем профиль при монтировании для обновления аватарки
  useEffect(() => {
    const loadProfile = async () => {
      try {
        await fetchProfile();
      } catch (error) {
        console.error('Error loading profile in sidebar:', error);
      }
    };

    loadProfile();
  }, [fetchProfile]);

  if (!user) return null;

  const userNavigation = navigationItems[user.role as UserRole] || [];

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
    if (user.profile?.firstName && user.profile?.lastName) {
      return `${user.profile.firstName} ${user.profile.lastName}`;
    }
    if (user.profile?.company) {
      return user.profile.company;
    }
    return user.email;
  };

  const getRoleDisplayName = (role: string) => {
    const roleNames = {
      [UserRole.ADMIN]: 'Администратор',
      [UserRole.PRODUCER]: 'Производитель',
      [UserRole.DISTRIBUTOR]: 'Дистрибьютор',
      [UserRole.INVESTOR]: 'Инвестор',
    };
    return roleNames[role as UserRole] || role;
  };

  return (
    <Sidebar variant="inset" className="border-r border-border bg-bg-sidebar-header">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link href="/dashboard" className="relative">
                <Image src="/logo.svg" alt="Gigross" fill priority className='object-contain' />
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        {userNavigation.map((group) => {
          const isExpanded = expandedGroups.includes(group.title);
          const isActive = activeGroup === group.title;
          
          return (
            <SidebarGroup key={group.title}>
              <SidebarGroupLabel 
                className={`text-text-body font-medium cursor-pointer select-none flex items-center justify-between hover:text-text-heading ${
                  isActive ? 'text-text-heading' : ''
                }`}
                onClick={() => toggleGroup(group.title)}
              >
                <span>{group.title}</span>
                {isExpanded ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
              </SidebarGroupLabel>
              <div className={`overflow-hidden transition-all duration-200 ease-in-out ${
                isExpanded ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
              }`}>
                <SidebarGroupContent>
                  <SidebarMenu>
                    {group.items.map((item) => (
                      <SidebarMenuItem key={item.title}>
                        <SidebarMenuButton 
                          asChild 
                          isActive={pathname === item.url}
                          className="text-text-body hover:bg-bg-menu-open hover:text-text-heading data-[active=true]:bg-accent-primary data-[active=true]:text-white"
                          onClick={() => setActiveGroup(group.title)}
                        >
                          <Link href={item.url}>
                            <item.icon className="size-4" />
                            <span>{item.title}</span>
                          </Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    ))}
                  </SidebarMenu>
                </SidebarGroupContent>
              </div>
            </SidebarGroup>
          );
        })}
      </SidebarContent>

      {/* Уведомления - отдельная секция над профилем */}
      <div className="border-t border-border">
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton 
                  asChild 
                  isActive={pathname === '/dashboard/notifications'}
                  className="text-text-body hover:bg-bg-menu-open hover:text-text-heading data-[active=true]:bg-accent-primary data-[active=true]:text-white"
                >
                  <Link href="/dashboard/notifications">
                    <Bell className="size-4" />
                    <span>Уведомления</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </div>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link href="/dashboard/profile">
                <Avatar className="h-8 w-8 rounded-lg">
                  <AvatarImage src={user.profile?.avatar} alt={getUserDisplayName()} />
                  <AvatarFallback className="rounded-lg bg-accent-primary text-white">
                    {getInitials(user.profile?.firstName, user.profile?.lastName, user.email)}
                  </AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold text-text-heading">{getUserDisplayName()}</span>
                  <span className="truncate text-xs text-text-body">
                    {getRoleDisplayName(user.role)}
                  </span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
