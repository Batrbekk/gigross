import { useState, useEffect, useCallback, useRef } from 'react';
import { useSocket } from '@/lib/socket/client';
import { useAuthStore } from '@/stores/authStore';

export interface AuctionBid {
  bidId: string;
  amount: number;
  currency: string;
  bidderId: string;
  bidderName: string;
  message?: string;
  timestamp: Date;
}

export interface AuctionState {
  lotId: string;
  currentPrice: number;
  currency: string;
  bids: AuctionBid[];
  isActive: boolean;
  timeRemaining: number;
  participants: number;
  lastBid?: AuctionBid;
}

export interface UseAuctionOptions {
  lotId: string;
  autoConnect?: boolean;
  onBidUpdate?: (bid: AuctionBid) => void;
  onAuctionEnd?: (winner?: any) => void;
  onError?: (error: string) => void;
}

export const useAuction = ({
  lotId,
  autoConnect = true,
  onBidUpdate,
  onAuctionEnd,
  onError,
}: UseAuctionOptions) => {
  const socket = useSocket();
  const { tokens } = useAuthStore();
  const [auctionState, setAuctionState] = useState<AuctionState>({
    lotId,
    currentPrice: 0,
    currency: 'RUB',
    bids: [],
    isActive: false,
    timeRemaining: 0,
    participants: 0,
  });
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);

  // Подключение к Socket.io
  const connect = useCallback(async () => {
    if (!tokens?.accessToken) {
      setError('No access token available');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      
      await socket.connect(tokens.accessToken);
      setIsConnected(true);
      
      if (autoConnect) {
        socket.joinAuction(lotId);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Connection failed';
      setError(errorMessage);
      onError?.(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [tokens?.accessToken, lotId, autoConnect, onError]);

  // Отключение от аукциона
  const disconnect = useCallback(() => {
    socket.leaveAuction(lotId);
    socket.disconnect();
    setIsConnected(false);
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
  }, [lotId, socket]);

  // Присоединение к аукциону
  const joinAuction = useCallback(() => {
    if (isConnected) {
      socket.joinAuction(lotId);
    }
  }, [isConnected, lotId, socket]);

  // Покидание аукциона
  const leaveAuction = useCallback(() => {
    if (isConnected) {
      socket.leaveAuction(lotId);
    }
  }, [isConnected, lotId, socket]);

  // Размещение ставки
  const placeBid = useCallback(async (amount: number, message?: string) => {
    if (!isConnected) {
      throw new Error('Not connected to auction');
    }

    try {
      // Отправляем ставку через API
      const response = await fetch('/api/bids', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${tokens?.accessToken}`,
        },
        body: JSON.stringify({
          lotId,
          amount,
          currency: auctionState.currency,
          message,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to place bid');
      }

      const result = await response.json();
      return result.data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to place bid';
      setError(errorMessage);
      onError?.(errorMessage);
      throw err;
    }
  }, [isConnected, lotId, tokens?.accessToken, auctionState.currency, onError, socket]);

  // Обработчики Socket.io событий
  useEffect(() => {
    if (!isConnected) return;

    // Обновление ставки
    const handleBidUpdate = (data: any) => {
      const newBid: AuctionBid = {
        bidId: data.bidId,
        amount: data.amount,
        currency: data.currency,
        bidderId: data.bidderId,
        bidderName: data.bidderName,
        message: data.message,
        timestamp: new Date(data.timestamp),
      };

      setAuctionState(prev => ({
        ...prev,
        currentPrice: data.newPrice,
        currency: data.currency,
        bids: [newBid, ...prev.bids.slice(0, 49)], // Храним последние 50 ставок
        lastBid: newBid,
        timeRemaining: data.timeRemaining,
      }));

      onBidUpdate?.(newBid);
    };

    // Подтверждение присоединения к аукциону
    const handleAuctionJoined = (data: any) => {
      console.log('Joined auction:', data);
      setAuctionState(prev => ({ ...prev, isActive: true }));
    };

    // Завершение аукциона
    const handleAuctionEnd = (data: any) => {
      setAuctionState(prev => ({
        ...prev,
        isActive: false,
        timeRemaining: 0,
      }));

      onAuctionEnd?.(data.winner);
    };

    // Ошибка ставки
    const handleBidError = (data: any) => {
      setError(data.error);
      onError?.(data.error);
    };

    // Подписка на события
    socket.on('bid_update', handleBidUpdate);
    socket.on('auction_joined', handleAuctionJoined);
    socket.on('auction_ended', handleAuctionEnd);
    socket.on('bid_error', handleBidError);

    // Отписка при размонтировании
    return () => {
      socket.off('bid_update', handleBidUpdate);
      socket.off('auction_joined', handleAuctionJoined);
      socket.off('auction_ended', handleAuctionEnd);
      socket.off('bid_error', handleBidError);
    };
  }, [isConnected, onBidUpdate, onAuctionEnd, onError, socket]);

  // Автоматическое подключение
  useEffect(() => {
    if (autoConnect && tokens?.accessToken && !isConnected && !isLoading) {
      connect();
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [autoConnect, tokens?.accessToken, isConnected, isLoading, connect]);

  // Очистка при размонтировании
  useEffect(() => {
    return () => {
      disconnect();
    };
  }, [disconnect]);

  return {
    // Состояние
    auctionState,
    isConnected,
    isLoading,
    error,

    // Методы
    connect,
    disconnect,
    joinAuction,
    leaveAuction,
    placeBid,

    // Утилиты
    clearError: () => setError(null),
  };
};
