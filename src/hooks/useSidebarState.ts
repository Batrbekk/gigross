'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';

const SIDEBAR_STATE_KEY = 'gigross-sidebar-state';

interface SidebarState {
  activeGroup: string | null;
  expandedGroups: string[];
}

export function useSidebarState() {
  const pathname = usePathname();
  const [sidebarState, setSidebarState] = useState<SidebarState>({
    activeGroup: null,
    expandedGroups: [],
  });

  // Загружаем состояние из localStorage при монтировании
  useEffect(() => {
    try {
      const savedState = localStorage.getItem(SIDEBAR_STATE_KEY);
      if (savedState) {
        const parsedState = JSON.parse(savedState);
        setSidebarState(parsedState);
      }
    } catch (error) {
      console.error('Error loading sidebar state:', error);
    }
  }, []);

  // Определяем активную группу на основе текущего пути
  useEffect(() => {
    const determineActiveGroup = () => {
      // Уведомления - отдельная секция, не входит ни в одну группу
      if (pathname.startsWith('/dashboard/notifications')) return null;
      
      // Админ
      if (pathname.startsWith('/dashboard/analytics') || pathname.startsWith('/dashboard/reports')) return 'Обзор';
      if (pathname.startsWith('/dashboard/users') || pathname.startsWith('/dashboard/products') || 
          pathname.startsWith('/dashboard/lots') || pathname.startsWith('/dashboard/transactions')) return 'Управление';
      if (pathname.startsWith('/dashboard/certificates') || pathname.startsWith('/dashboard/settings')) return 'Система';
      
      // Производитель
      if (pathname.startsWith('/dashboard/analytics')) return 'Обзор';
      if (pathname.startsWith('/dashboard/products') || pathname.startsWith('/dashboard/lots') || 
          pathname.startsWith('/dashboard/auctions')) return 'Мои товары';
      if (pathname.startsWith('/dashboard/orders') || pathname.startsWith('/dashboard/shipments') || 
          pathname.startsWith('/dashboard/revenue')) return 'Продажи';
      if (pathname.startsWith('/dashboard/certificates')) return 'Документы';
      
      // Дистрибьютор
      if (pathname.startsWith('/dashboard/analytics')) return 'Обзор';
      if (pathname.startsWith('/dashboard/catalog') || pathname.startsWith('/dashboard/bids') || 
          pathname.startsWith('/dashboard/auctions')) return 'Закупки';
      if (pathname.startsWith('/dashboard/purchases') || pathname.startsWith('/dashboard/deliveries') || 
          pathname.startsWith('/dashboard/expenses')) return 'Заказы';
      if (pathname.startsWith('/dashboard/certificates')) return 'Документы';
      
      // Инвестор
      if (pathname.startsWith('/dashboard/portfolio')) return 'Обзор';
      if (pathname.startsWith('/dashboard/investments') || pathname.startsWith('/dashboard/auctions')) return 'Инвестиции';
      if (pathname.startsWith('/dashboard/transactions') || pathname.startsWith('/dashboard/reports')) return 'Финансы';
      if (pathname.startsWith('/dashboard/certificates')) return 'Документы';
      
      // По умолчанию
      if (pathname === '/dashboard') return 'Обзор';
      return null;
    };

    const activeGroup = determineActiveGroup();
    if (activeGroup && activeGroup !== sidebarState.activeGroup) {
      setSidebarState(prev => ({
        ...prev,
        activeGroup,
        expandedGroups: prev.expandedGroups.includes(activeGroup) 
          ? prev.expandedGroups 
          : [...prev.expandedGroups, activeGroup],
      }));
    }
  }, [pathname, sidebarState.activeGroup]);

  // Сохраняем состояние в localStorage при изменении
  useEffect(() => {
    try {
      localStorage.setItem(SIDEBAR_STATE_KEY, JSON.stringify(sidebarState));
    } catch (error) {
      console.error('Error saving sidebar state:', error);
    }
  }, [sidebarState]);

  const toggleGroup = (groupTitle: string) => {
    setSidebarState(prev => ({
      ...prev,
      expandedGroups: prev.expandedGroups.includes(groupTitle)
        ? prev.expandedGroups.filter(g => g !== groupTitle)
        : [...prev.expandedGroups, groupTitle],
    }));
  };

  const setActiveGroup = (groupTitle: string) => {
    setSidebarState(prev => ({
      ...prev,
      activeGroup: groupTitle,
      expandedGroups: prev.expandedGroups.includes(groupTitle)
        ? prev.expandedGroups
        : [...prev.expandedGroups, groupTitle],
    }));
  };

  const resetSidebarState = () => {
    setSidebarState({
      activeGroup: null,
      expandedGroups: [],
    });
    try {
      localStorage.removeItem(SIDEBAR_STATE_KEY);
    } catch (error) {
      console.error('Error clearing sidebar state:', error);
    }
  };

  return {
    activeGroup: sidebarState.activeGroup,
    expandedGroups: sidebarState.expandedGroups,
    toggleGroup,
    setActiveGroup,
    resetSidebarState,
  };
}
