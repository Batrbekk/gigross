import { NextRequest, NextResponse } from 'next/server';
import { Shipment } from '@/database/models/Shipment';
import connectDB from '@/config/database';

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

// GET /api/shipments/tracking/[id] - Получить информацию о трекинге отгрузки
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    await connectDB();

    const { id } = await params;

    // Ищем по трекинг номеру или ID
    const shipment = await Shipment.findOne({
      $or: [{ _id: id }, { trackingNumber: id }],
    })
      .populate('sellerId', 'profile.firstName profile.lastName profile.company')
      .populate('buyerId', 'profile.firstName profile.lastName profile.company')
      .populate('lotId', 'title quantity unit')
      .exec();

    if (!shipment) {
      return NextResponse.json(
        {
          success: false,
          error: 'Shipment not found',
        },
        { status: 404 }
      );
    }

    // Возвращаем публичную информацию о трекинге
    const trackingInfo = {
      trackingNumber: (shipment as any).trackingNumber,
      status: (shipment as any).status,
      carrier: (shipment as any).carrier,
      origin: (shipment as any).origin,
      destination: (shipment as any).destination,
      timeline: (shipment as any).timeline,
      estimatedDelivery: (shipment as any).estimatedDelivery,
      actualDelivery: (shipment as any).actualDelivery,
      iotData: (shipment as any).iotData,
      lot: (shipment as any).lotId,
    };

    return NextResponse.json(
      {
        success: true,
        data: trackingInfo,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Get tracking info error:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
      },
      { status: 500 }
    );
  }
}
