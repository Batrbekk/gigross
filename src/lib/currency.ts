// Конфигурация валют
export const CURRENCIES = {
  KZT: {
    code: 'KZT',
    symbol: '₸',
    name: 'Казахстанский тенге',
    decimals: 0,
  },
  RUB: {
    code: 'RUB',
    symbol: '₽',
    name: 'Российский рубль',
    decimals: 0,
  },
  USD: {
    code: 'USD',
    symbol: '$',
    name: 'Доллар США',
    decimals: 2,
  },
  EUR: {
    code: 'EUR',
    symbol: '€',
    name: 'Евро',
    decimals: 2,
  },
} as const;

export type CurrencyCode = keyof typeof CURRENCIES;

// Интерфейс для курса валют
export interface ExchangeRate {
  from: CurrencyCode;
  to: CurrencyCode;
  rate: number;
  timestamp: number;
}

// Кэш курсов валют
let exchangeRatesCache: Map<string, ExchangeRate> = new Map();
let lastCacheUpdate = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 минут

// Получение актуального курса валют
export async function getExchangeRates(): Promise<Map<string, ExchangeRate>> {
  const now = Date.now();
  
  // Проверяем, нужно ли обновить кэш
  if (now - lastCacheUpdate < CACHE_DURATION && exchangeRatesCache.size > 0) {
    return exchangeRatesCache;
  }

  try {
    // Используем бесплатный API для получения курсов валют
    const response = await fetch('https://api.exchangerate-api.com/v4/latest/USD');
    const data = await response.json();
    
    const rates = new Map<string, ExchangeRate>();
    const timestamp = now;
    
    // Создаем курсы для всех пар валют
    const currencies: CurrencyCode[] = ['KZT', 'RUB', 'USD', 'EUR'];
    
    for (const from of currencies) {
      for (const to of currencies) {
        if (from === to) {
          rates.set(`${from}-${to}`, {
            from,
            to,
            rate: 1,
            timestamp,
          });
        } else {
          // Конвертируем через USD
          const fromToUsd = from === 'USD' ? 1 : data.rates[from] || 1;
          const usdToTo = to === 'USD' ? 1 : (1 / (data.rates[to] || 1));
          const rate = fromToUsd * usdToTo;
          
          rates.set(`${from}-${to}`, {
            from,
            to,
            rate,
            timestamp,
          });
        }
      }
    }
    
    exchangeRatesCache = rates;
    lastCacheUpdate = timestamp;
    
    return rates;
  } catch {
    // Ошибка получения курсов валют
    
    // Возвращаем кэшированные данные или базовые курсы
    if (exchangeRatesCache.size > 0) {
      return exchangeRatesCache;
    }
    
    // Базовые курсы (примерные)
    const fallbackRates = new Map<string, ExchangeRate>();
    const timestamp = now;
    
    const baseRates = {
      'KZT-USD': 0.0022,
      'KZT-EUR': 0.0020,
      'KZT-RUB': 0.20,
      'RUB-USD': 0.011,
      'RUB-EUR': 0.010,
      'RUB-KZT': 5.0,
      'USD-EUR': 0.92,
      'USD-KZT': 450,
      'USD-RUB': 90,
      'EUR-USD': 1.09,
      'EUR-KZT': 490,
      'EUR-RUB': 98,
    };
    
    for (const [pair, rate] of Object.entries(baseRates)) {
      const [from, to] = pair.split('-') as [CurrencyCode, CurrencyCode];
      fallbackRates.set(pair, { from, to, rate, timestamp });
    }
    
    // Добавляем обратные курсы
    for (const [pair, rate] of Object.entries(baseRates)) {
      const [from, to] = pair.split('-') as [CurrencyCode, CurrencyCode];
      fallbackRates.set(`${to}-${from}`, { 
        from: to, 
        to: from, 
        rate: 1 / rate, 
        timestamp 
      });
    }
    
    // Добавляем курсы 1:1 для одинаковых валют
    for (const currency of ['KZT', 'RUB', 'USD', 'EUR'] as CurrencyCode[]) {
      fallbackRates.set(`${currency}-${currency}`, {
        from: currency,
        to: currency,
        rate: 1,
        timestamp,
      });
    }
    
    exchangeRatesCache = fallbackRates;
    lastCacheUpdate = timestamp;
    
    return fallbackRates;
  }
}

// Конвертация суммы из одной валюты в другую
export async function convertCurrency(
  amount: number,
  from: CurrencyCode,
  to: CurrencyCode
): Promise<number> {
  if (from === to) {
    return amount;
  }
  
  const rates = await getExchangeRates();
  const rate = rates.get(`${from}-${to}`);
  
  if (!rate) {
    // Курс не найден, возвращаем исходную сумму
    return amount;
  }
  
  return amount * rate.rate;
}

// Форматирование суммы с символом валюты
export function formatCurrency(
  amount: number | undefined | null,
  currency: CurrencyCode | string,
  showSymbol: boolean = true
): string {
  // Проверяем валидность валюты и используем KZT как fallback
  const validCurrency = isValidCurrency(currency) ? currency as CurrencyCode : 'KZT';
  const currencyConfig = CURRENCIES[validCurrency];
  
  // Проверяем, что amount является валидным числом
  if (amount === undefined || amount === null || isNaN(amount)) {
    const formattedAmount = (0).toFixed(currencyConfig.decimals);
    if (showSymbol) {
      return `${formattedAmount} ${currencyConfig.symbol}`;
    }
    return formattedAmount;
  }
  
  const formattedAmount = amount.toFixed(currencyConfig.decimals);
  
  if (showSymbol) {
    return `${formattedAmount} ${currencyConfig.symbol}`;
  }
  
  return formattedAmount;
}

// Получение символа валюты
export function getCurrencySymbol(currency: CurrencyCode): string {
  return CURRENCIES[currency].symbol;
}

// Получение названия валюты
export function getCurrencyName(currency: CurrencyCode): string {
  return CURRENCIES[currency].name;
}

// Проверка, является ли строка валидным кодом валюты
export function isValidCurrency(currency: string): currency is CurrencyCode {
  return currency in CURRENCIES;
}

// Получение всех доступных валют
export function getAllCurrencies() {
  return Object.entries(CURRENCIES).map(([currencyCode, config]) => ({
    ...config,
    code: currencyCode as CurrencyCode,
  }));
}
