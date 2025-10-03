import { NextRequest, NextResponse } from 'next/server';
import { Bid } from '@/database/models/Bid';
import connectDB from '@/config/database';

interface RouteParams {
  params: Promise<{
    lotId: string;
  }>;
}

// GET /api/bids/lot/[lotId] - Получить ставки по лоту
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    await connectDB();

    const { lotId } = await params;
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '20');

    // Получение ставок по лоту, отсортированных по сумме (убывание)
    const bids = await Bid.find({ lotId })
      .sort({ amount: -1, createdAt: -1 })
      .limit(limit)
      .populate('bidderId', 'email profile.firstName profile.lastName profile.company')
      .exec();

    return NextResponse.json(
      {
        success: true,
        data: bids,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Get lot bids error:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
      },
      { status: 500 }
    );
  }
}
