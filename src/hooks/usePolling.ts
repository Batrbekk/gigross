'use client';

import { useEffect, useRef, useCallback } from 'react';

interface UsePollingOptions<T> {
  fetchFunction: () => Promise<T>;
  interval?: number; // в миллисекундах
  enabled?: boolean;
  onSuccess?: (data: T) => void;
  onError?: (error: string) => void;
  dependencies?: any[]; // зависимости для перезапуска
}

export function usePolling<T>({
  fetchFunction,
  interval = 5000, // 5 секунд по умолчанию
  enabled = true,
  onSuccess,
  onError,
  dependencies = [],
}: UsePollingOptions<T>) {
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const isPollingRef = useRef(false);
  
  // Используем refs для функций, чтобы избежать пересоздания
  const fetchFunctionRef = useRef(fetchFunction);
  const onSuccessRef = useRef(onSuccess);
  const onErrorRef = useRef(onError);
  const intervalRefValue = useRef(interval);
  const enabledRef = useRef(enabled);
  
  // Обновляем refs
  fetchFunctionRef.current = fetchFunction;
  onSuccessRef.current = onSuccess;
  onErrorRef.current = onError;
  intervalRefValue.current = interval;
  enabledRef.current = enabled;

  const startPolling = useCallback(() => {
    if (isPollingRef.current || !enabledRef.current) return;

    isPollingRef.current = true;

    const poll = async () => {
      try {
        const data = await fetchFunctionRef.current();
        onSuccessRef.current?.(data);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Ошибка при обновлении данных';
        onErrorRef.current?.(errorMessage);
      }
    };

    // Выполняем сразу один раз
    poll();

    // Затем запускаем интервал
    intervalRef.current = setInterval(poll, intervalRefValue.current);
  }, []); // Убираем все зависимости

  const stopPolling = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    isPollingRef.current = false;
  }, []);

  // Запускаем/останавливаем polling при изменении enabled
  useEffect(() => {
    if (enabled) {
      startPolling();
    } else {
      stopPolling();
    }

    return () => {
      stopPolling();
    };
  }, [enabled]); // Убираем функции из зависимостей

  // Очистка при размонтировании
  useEffect(() => {
    return () => {
      stopPolling();
    };
  }, []); // Убираем stopPolling из зависимостей

  return {
    startPolling,
    stopPolling,
    isPolling: isPollingRef.current,
  };
}

export default usePolling;
