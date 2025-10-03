'use client';

import { useState, useEffect } from 'react';
import { formatCurrency, convertCurrency, CurrencyCode } from '@/lib/currency';

interface CurrencyDisplayProps {
  amount: number;
  currency: CurrencyCode;
  showSymbol?: boolean;
  convertTo?: CurrencyCode;
  showConverted?: boolean;
  className?: string;
}

export function CurrencyDisplay({
  amount,
  currency,
  showSymbol = true,
  convertTo,
  showConverted = false,
  className = '',
}: CurrencyDisplayProps) {
  const [convertedAmount, setConvertedAmount] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (convertTo && convertTo !== currency) {
      setIsLoading(true);
      convertCurrency(amount, currency, convertTo)
        .then((converted) => {
          setConvertedAmount(converted);
        })
        .catch((error) => {
          console.error('Currency conversion error:', error);
          setConvertedAmount(null);
        })
        .finally(() => {
          setIsLoading(false);
        });
    } else {
      setConvertedAmount(null);
    }
  }, [amount, currency, convertTo]);

  const displayAmount = formatCurrency(amount, currency, showSymbol);
  const convertedDisplay = convertedAmount 
    ? formatCurrency(convertedAmount, convertTo!, showSymbol)
    : null;

  if (showConverted && convertTo && convertedAmount !== null) {
    return (
      <div className={`flex flex-col ${className}`}>
        <span className="text-sm text-text-body">
          {displayAmount}
        </span>
        <span className="text-xs text-text-body/70">
          ≈ {isLoading ? '...' : convertedDisplay}
        </span>
      </div>
    );
  }

  return (
    <span className={className}>
      {displayAmount}
    </span>
  );
}

// Компонент для отображения диапазона цен
interface CurrencyRangeProps {
  minAmount: number;
  maxAmount: number;
  currency: CurrencyCode;
  showSymbol?: boolean;
  className?: string;
}

export function CurrencyRange({
  minAmount,
  maxAmount,
  currency,
  showSymbol = true,
  className = '',
}: CurrencyRangeProps) {
  const minDisplay = formatCurrency(minAmount, currency, showSymbol);
  const maxDisplay = formatCurrency(maxAmount, currency, showSymbol);

  return (
    <span className={className}>
      {minDisplay} - {maxDisplay}
    </span>
  );
}

// Компонент для отображения валюты с конвертацией
interface CurrencyWithConversionProps {
  amount: number;
  fromCurrency: CurrencyCode;
  toCurrency: CurrencyCode;
  showBoth?: boolean;
  className?: string;
}

export function CurrencyWithConversion({
  amount,
  fromCurrency,
  toCurrency,
  showBoth = true,
  className = '',
}: CurrencyWithConversionProps) {
  const [convertedAmount, setConvertedAmount] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (fromCurrency !== toCurrency) {
      setIsLoading(true);
      convertCurrency(amount, fromCurrency, toCurrency)
        .then((converted) => {
          setConvertedAmount(converted);
        })
        .catch((error) => {
          console.error('Currency conversion error:', error);
          setConvertedAmount(null);
        })
        .finally(() => {
          setIsLoading(false);
        });
    } else {
      setConvertedAmount(amount);
    }
  }, [amount, fromCurrency, toCurrency]);

  const originalDisplay = formatCurrency(amount, fromCurrency, true);
  const convertedDisplay = convertedAmount 
    ? formatCurrency(convertedAmount, toCurrency, true)
    : null;

  if (!showBoth || fromCurrency === toCurrency) {
    return (
      <span className={className}>
        {originalDisplay}
      </span>
    );
  }

  return (
    <div className={`flex flex-col ${className}`}>
      <span className="text-sm">
        {originalDisplay}
      </span>
      {convertedDisplay && (
        <span className="text-xs text-text-body/70">
          ≈ {isLoading ? '...' : convertedDisplay}
        </span>
      )}
    </div>
  );
}
