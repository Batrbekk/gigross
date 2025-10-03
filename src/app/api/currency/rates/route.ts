import { NextRequest, NextResponse } from 'next/server';
import { getExchangeRates } from '@/lib/currency';

// GET /api/currency/rates - Получить актуальные курсы валют
export async function GET(_request: NextRequest) {
  try {
    const rates = await getExchangeRates();
    
    // Преобразуем Map в объект для JSON
    const ratesObject: Record<string, any> = {};
    rates.forEach((rate, key) => {
      ratesObject[key] = rate;
    });
    
    return NextResponse.json({
      success: true,
      data: {
        rates: ratesObject,
        timestamp: Date.now(),
      },
    });
  } catch {
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch exchange rates',
      },
      { status: 500 }
    );
  }
}
