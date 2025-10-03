'use client';

import { useEffect, useState, useCallback } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { io, Socket } from 'socket.io-client';

interface RealtimeBidData {
  lotId: string;
  amount: number;
  bidderId: string;
  bidderName: string;
  message?: string;
  timestamp: string;
}

interface UseRealtimeBidsOptions {
  lotId?: string; // Если указан, подписываемся только на этот лот
  onBidUpdate?: (data: RealtimeBidData) => void;
  onError?: (error: string) => void;
}

export function useRealtimeBids(options: UseRealtimeBidsOptions = {}) {
  const { user, tokens } = useAuthStore();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const connect = useCallback(() => {
    if (!user || !tokens?.accessToken) return;

    try {
      const newSocket = io(process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3001', {
        auth: {
          token: tokens.accessToken,
        },
        transports: ['websocket', 'polling'],
      });

      newSocket.on('connect', () => {
        console.log('Connected to bid updates socket');
        setIsConnected(true);
        setError(null);

        // Подписываемся на обновления ставок
        if (options.lotId) {
          newSocket.emit('join_auction', options.lotId);
        }
      });

      newSocket.on('disconnect', () => {
        console.log('Disconnected from bid updates socket');
        setIsConnected(false);
      });

      newSocket.on('connect_error', (err) => {
        console.error('Socket connection error:', err);
        setError('Ошибка подключения к серверу');
        setIsConnected(false);
      });

      // Слушаем обновления ставок
      newSocket.on('bid_placed', (data: RealtimeBidData) => {
        console.log('New bid received:', data);
        options.onBidUpdate?.(data);
      });

      // Слушаем обновления лотов
      newSocket.on('lot_updated', (data: any) => {
        console.log('Lot updated:', data);
        options.onBidUpdate?.(data);
      });

      setSocket(newSocket);
    } catch (err) {
      console.error('Failed to connect to socket:', err);
      setError('Не удалось подключиться к серверу');
      options.onError?.('Не удалось подключиться к серверу');
    }
  }, [user, tokens, options]);

  const disconnect = useCallback(() => {
    if (socket) {
      socket.disconnect();
      setSocket(null);
      setIsConnected(false);
    }
  }, [socket]);

  const joinAuction = useCallback((lotId: string) => {
    if (socket && isConnected) {
      socket.emit('join_auction', lotId);
    }
  }, [socket, isConnected]);

  const leaveAuction = useCallback((lotId: string) => {
    if (socket && isConnected) {
      socket.emit('leave_auction', lotId);
    }
  }, [socket, isConnected]);

  // Подключаемся при монтировании
  useEffect(() => {
    connect();

    return () => {
      disconnect();
    };
  }, [connect, disconnect]);

  // Обновляем подключение при изменении токена
  useEffect(() => {
    if (tokens?.accessToken) {
      disconnect();
      connect();
    }
  }, [tokens?.accessToken, disconnect, connect]);

  return {
    socket,
    isConnected,
    error,
    connect,
    disconnect,
    joinAuction,
    leaveAuction,
  };
}

export default useRealtimeBids;
