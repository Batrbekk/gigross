import { NextRequest, NextResponse } from 'next/server';
import { Lot } from '@/database/models/Lot';
import { LotStatus } from '@/types';
import connectDB from '@/config/database';

// GET /api/lots/active - Получить активные лоты
export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '10');

    // Получение активных лотов, которые еще не завершились
    const now = new Date();
    const lots = await Lot.find({
      status: LotStatus.ACTIVE,
      'auction.endDate': { $gt: now },
    })
      .sort({ 'auction.endDate': 1 }) // Сортировка по времени окончания
      .limit(limit)
      .populate('productId', 'name category images')
      .populate('producerId', 'profile.firstName profile.lastName profile.company')
      .exec();

    return NextResponse.json(
      {
        success: true,
        data: lots,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Get active lots error:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
      },
      { status: 500 }
    );
  }
}
