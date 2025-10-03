'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { RefreshCw, TrendingUp, TrendingDown } from 'lucide-react';
import { useExchangeRates } from '@/hooks/useCurrency';
import { CurrencyCode, formatCurrency } from '@/lib/currency';

interface CurrencyRatesProps {
  baseCurrency?: CurrencyCode;
  showAll?: boolean;
  className?: string;
}

export function CurrencyRates({ 
  baseCurrency = 'KZT', 
  showAll = false,
  className = '' 
}: CurrencyRatesProps) {
  const { rates, isLoading, error, refresh } = useExchangeRates();
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  useEffect(() => {
    if (rates) {
      setLastUpdate(new Date());
    }
  }, [rates]);

  if (error) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Курсы валют
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-red-500">
            <p>Ошибка загрузки курсов</p>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={refresh}
              className="mt-2"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Обновить
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!rates) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Курсы валют
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center">
            <p className="text-text-body">Загрузка курсов...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Получаем курсы для базовой валюты
  const baseRates = Array.from(rates.entries())
    .filter(([key]) => key.startsWith(`${baseCurrency}-`))
    .map(([key, rate]) => ({
      pair: key,
      to: key.split('-')[1] as CurrencyCode,
      rate: rate.rate,
      timestamp: rate.timestamp,
    }))
    .filter(({ to }) => to !== baseCurrency)
    .sort((a, b) => a.to.localeCompare(b.to));

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Курсы валют
            </CardTitle>
            <CardDescription>
              {lastUpdate && `Обновлено: ${lastUpdate.toLocaleTimeString('ru-RU')}`}
            </CardDescription>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={refresh}
            disabled={isLoading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Обновить
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {baseRates.map(({ to, rate }) => (
            <div key={to} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Badge variant="outline">
                  {baseCurrency} → {to}
                </Badge>
              </div>
              <div className="text-right">
                <div className="font-medium">
                  {formatCurrency(1, baseCurrency)} = {formatCurrency(rate, to)}
                </div>
                <div className="text-xs text-text-body">
                  {formatCurrency(1 / rate, to)} = {formatCurrency(1, baseCurrency)}
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// Компонент для отображения курса конкретной валюты
interface CurrencyRateProps {
  from: CurrencyCode;
  to: CurrencyCode;
  amount?: number;
  showInverse?: boolean;
  className?: string;
}

export function CurrencyRate({ 
  from, 
  to, 
  amount = 1, 
  showInverse = true,
  className = '' 
}: CurrencyRateProps) {
  const { rates, isLoading, error } = useExchangeRates();

  if (error) {
    return (
      <div className={`text-red-500 ${className}`}>
        Ошибка загрузки курса
      </div>
    );
  }

  if (isLoading || !rates) {
    return (
      <div className={`text-text-body ${className}`}>
        Загрузка...
      </div>
    );
  }

  const rate = rates.get(`${from}-${to}`);
  if (!rate) {
    return (
      <div className={`text-text-body ${className}`}>
        Курс не найден
      </div>
    );
  }

  const convertedAmount = amount * rate.rate;

  return (
    <div className={className}>
      <div className="font-medium">
        {formatCurrency(amount, from)} = {formatCurrency(convertedAmount, to)}
      </div>
      {showInverse && (
        <div className="text-xs text-text-body">
          {formatCurrency(1, to)} = {formatCurrency(1 / rate.rate, from)}
        </div>
      )}
    </div>
  );
}
