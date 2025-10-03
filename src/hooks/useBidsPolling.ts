'use client';

import { useCallback, useState } from 'react';
import { usePolling } from './usePolling';
import { useAuthStore } from '@/stores/authStore';

interface Bid {
  _id: string;
  amount: number;
  currency: string;
  createdAt: string;
  status: 'active' | 'outbid' | 'winning' | 'expired';
  isWinning?: boolean;
  lotId: {
    _id: string;
    title: string;
    currentPrice: number;
    endDate?: string;
    auction?: {
      endDate: string;
    };
    status: 'active' | 'sold' | 'expired' | 'cancelled';
    producerId?: {
      profile?: {
        company?: string;
      };
    };
    productId?: {
      name?: string;
      images?: string[];
    };
  };
}

interface UseBidsPollingOptions {
  lotId?: string; // Если указан, получаем ставки только для этого лота
  interval?: number; // Интервал обновления в миллисекундах
  enabled?: boolean;
  onBidsUpdate?: (bids: Bid[]) => void;
  onError?: (error: string) => void;
}

export function useBidsPolling({
  lotId,
  interval = 10000, // 10 секунд по умолчанию
  enabled = true,
  onBidsUpdate,
  onError,
}: UseBidsPollingOptions = {}) {
  const { debugTokens } = useAuthStore();
  const [bids, setBids] = useState<Bid[]>([]);
  const [isConnected, setIsConnected] = useState(false);

  const fetchBids = useCallback(async (): Promise<Bid[]> => {
    try {
      console.log('Fetching bids:', { lotId });
      
      // Debug tokens
      debugTokens();
      
      // Получаем токен напрямую из store
      const { tokens } = useAuthStore.getState();
      
      let url;
      if (lotId) {
        // Получаем ставки для конкретного лота
        console.log('Fetching bids for lot:', lotId);
        url = `/api/bids/lot/${lotId}?limit=50`;
      } else {
        // Получаем все ставки пользователя
        console.log('Fetching user bids');
        url = '/api/bids?limit=50';
      }

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...(tokens?.accessToken && { Authorization: `Bearer ${tokens.accessToken}` }),
        },
      });

      const result = await response.json();
      console.log('Bids response:', result);

      // Проверяем разные форматы ответа
      if (result && (result.success === true || result.data)) {
        setIsConnected(true);
        const bidsData = result.data as Bid[];
        console.log('Bids data received:', bidsData?.length || 0, 'bids');
        setBids(bidsData || []);
        onBidsUpdate?.(bidsData || []);
        return bidsData || [];
      } else {
        const errorMsg = result?.error || result?.message || 'Не удалось получить ставки';
        console.error('Bids fetch failed:', errorMsg, result);
        
        // Если это ошибка авторизации, не устанавливаем isConnected в false
        if (result?.error?.includes('Unauthorized') || result?.error?.includes('Token')) {
          console.log('Authorization error, keeping connection status');
        } else {
          setIsConnected(false);
        }
        
        throw new Error(errorMsg);
      }
    } catch (error) {
      console.error('Bids polling error:', error);
      
      // Не устанавливаем isConnected в false для ошибок сети
      if (error instanceof Error && !error.message.includes('Unauthorized')) {
        setIsConnected(false);
      }
      
      const errorMessage = error instanceof Error ? error.message : 'Ошибка при получении ставок';
      onError?.(errorMessage);
      throw error;
    }
  }, [lotId, onBidsUpdate, onError, debugTokens]);

  const { startPolling, stopPolling, isPolling } = usePolling({
    fetchFunction: fetchBids,
    interval,
    enabled,
    onSuccess: (_data) => {
      setIsConnected(true);
    },
    onError: (error) => {
      setIsConnected(false);
      onError?.(error);
    },
    dependencies: [fetchBids],
  });

  const refreshBids = useCallback(() => {
    fetchBids();
  }, [fetchBids]);

  return {
    bids,
    isConnected,
    isPolling,
    startPolling,
    stopPolling,
    refreshBids,
    fetchBids,
  };
}

export default useBidsPolling;
