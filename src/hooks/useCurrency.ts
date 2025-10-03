'use client';

import { useState, useEffect } from 'react';
import { convertCurrency, getExchangeRates, CurrencyCode } from '@/lib/currency';

interface UseCurrencyOptions {
  from: CurrencyCode;
  to: CurrencyCode;
  amount: number;
  autoUpdate?: boolean;
  updateInterval?: number;
}

interface UseCurrencyReturn {
  convertedAmount: number | null;
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

export function useCurrency({
  from,
  to,
  amount,
  autoUpdate = false,
  updateInterval = 300000, // 5 минут
}: UseCurrencyOptions): UseCurrencyReturn {
  const [convertedAmount, setConvertedAmount] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = async () => {
    if (from === to) {
      setConvertedAmount(amount);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const converted = await convertCurrency(amount, from, to);
      setConvertedAmount(converted);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Conversion failed');
      setConvertedAmount(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refresh();
  }, [from, to, amount]);

  useEffect(() => {
    if (!autoUpdate) return;

    const interval = setInterval(refresh, updateInterval);
    return () => clearInterval(interval);
  }, [autoUpdate, updateInterval]);

  return {
    convertedAmount,
    isLoading,
    error,
    refresh,
  };
}

// Хук для получения всех курсов валют
export function useExchangeRates() {
  const [rates, setRates] = useState<Map<string, any> | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const exchangeRates = await getExchangeRates();
      setRates(exchangeRates);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch rates');
      setRates(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refresh();
  }, []);

  return {
    rates,
    isLoading,
    error,
    refresh,
  };
}
