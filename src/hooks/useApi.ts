import { useState, useCallback, useRef } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { ApiResponse, LoadingState } from '@/types';

interface UseApiOptions<T = unknown> {
  onSuccess?: (data: T) => void;
  onError?: (error: string) => void;
}

export function useApi<T = unknown>(apiOptions: UseApiOptions<T> = {}) {
  const [state, setState] = useState<LoadingState>({
    isLoading: false,
    error: null,
  });
  const { tokens, refreshToken } = useAuthStore();
  const optionsRef = useRef(apiOptions);
  const tokensRef = useRef(tokens);
  const refreshTokenRef = useRef(refreshToken);
  
  // Обновляем refs при изменении
  optionsRef.current = apiOptions;
  tokensRef.current = tokens;
  refreshTokenRef.current = refreshToken;

  const execute = useCallback(
    async (url: string, requestOptions: RequestInit = {}): Promise<ApiResponse<T> | null> => {
      setState({ isLoading: true, error: null });

      try {
        // Подготавливаем заголовки с токеном авторизации
        const headers: Record<string, string> = {
          'Content-Type': 'application/json',
        };

        // Добавляем токен авторизации, если он есть
        if (tokensRef.current?.accessToken) {
          headers.Authorization = `Bearer ${tokensRef.current.accessToken}`;
        }

        // Добавляем пользовательские заголовки ПОСЛЕ токена
        if (requestOptions.headers) {
          Object.assign(headers, requestOptions.headers);
        }
        
        const response = await fetch(url, {
          headers,
          ...requestOptions,
        });

        const result: ApiResponse<T> = await response.json();
        
        // Убрали автоматическое обновление токена - пользователь должен обновить вручную
        
        if (!response.ok || !result.success) {
          // Возвращаем результат даже при ошибке, чтобы компонент мог его обработать
          setState({ isLoading: false, error: result.error || 'Произошла ошибка' });
          optionsRef.current?.onError?.(result.error || 'Произошла ошибка');
          return result;
        }

        setState({ isLoading: false, error: null });
        optionsRef.current?.onSuccess?.(result as T);
        return result; // Возвращаем весь объект result, а не только data
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Неизвестная ошибка';
        setState({ isLoading: false, error: errorMessage });
        optionsRef.current?.onError?.(errorMessage);
        return null;
      }
    },
    [] // Убираем зависимости, используем refs
  );

  const get = useCallback(
    (url: string) => {
      return execute(url, { method: 'GET' });
    },
    [execute]
  );

  const post = useCallback(
    (url: string, data?: unknown) => {
      return execute(url, {
        method: 'POST',
        body: data ? JSON.stringify(data) : undefined,
      });
    },
    [execute]
  );

  const put = useCallback(
    (url: string, data?: unknown) => {
      return execute(url, {
        method: 'PUT',
        body: data ? JSON.stringify(data) : undefined,
      });
    },
    [execute]
  );

  const del = useCallback(
    (url: string) => {
      return execute(url, { method: 'DELETE' });
    },
    [execute]
  );

  return {
    ...state,
    execute,
    get,
    post,
    put,
    delete: del,
  };
}
