import { NextRequest, NextResponse } from 'next/server';
import { requireOwnership } from '@/lib/auth/middleware';
import { updateLotSchema } from '@/lib/validation/schemas';
import { Lot } from '@/database/models/Lot';
import { Bid } from '@/database/models/Bid';
import connectDB from '@/config/database';

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

// GET /api/lots/[id] - Получить лот по ID
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    await connectDB();

    const { id } = await params;

    const lot = await Lot.findById(id)
      .populate('productId', 'name category images')
      .populate('producerId', 'email profile.firstName profile.lastName profile.company profile.phoneNumber profile.rating profile.address')
      .exec();

    if (!lot) {
      return NextResponse.json(
        {
          success: false,
          error: 'Lot not found',
        },
        { status: 404 }
      );
    }

    // Подсчитываем количество ставок для этого лота
    const bidsCount = await Bid.countDocuments({ lotId: id });
    
    // Добавляем количество ставок к объекту лота
    const lotWithCounts = {
      ...lot.toObject(),
      bidsCount,
      viewsCount: lot.viewsCount || 0, // Если viewsCount не определен, используем 0
    };

    return NextResponse.json(
      {
        success: true,
        data: lotWithCounts,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Get lot error:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
      },
      { status: 500 }
    );
  }
}

// PUT /api/lots/[id] - Обновить лот
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    await connectDB();

    const { id } = await params;

    // Сначала найдем лот для проверки владельца
    const existingLot = await Lot.findById(id);
    if (!existingLot) {
      return NextResponse.json(
        {
          success: false,
          error: 'Lot not found',
        },
        { status: 404 }
      );
    }

    // Проверка прав доступа
    const authResult = await requireOwnership(request, typeof existingLot.producerId === 'string' ? existingLot.producerId : existingLot.producerId._id, 'lot');
    if (!authResult.success) {
      return authResult.response;
    }

    const body = await request.json();

    // Валидация входных данных
    const validationResult = updateLotSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Validation failed',
          details: validationResult.error.issues,
        },
        { status: 400 }
      );
    }

    const updateData = validationResult.data;

    // Обновление лота
    const lot = await Lot.findByIdAndUpdate(id, { $set: updateData }, { new: true })
      .populate('productId', 'name category images')
      .populate('producerId', 'profile.firstName profile.lastName profile.company')
      .exec();

    return NextResponse.json(
      {
        success: true,
        data: lot,
        message: 'Lot updated successfully',
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Update lot error:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
      },
      { status: 500 }
    );
  }
}

// DELETE /api/lots/[id] - Удалить лот
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    await connectDB();

    const { id } = await params;

    // Сначала найдем лот для проверки владельца
    const existingLot = await Lot.findById(id);
    if (!existingLot) {
      return NextResponse.json(
        {
          success: false,
          error: 'Lot not found',
        },
        { status: 404 }
      );
    }

    // Проверка прав доступа
    const authResult = await requireOwnership(request, typeof existingLot.producerId === 'string' ? existingLot.producerId : existingLot.producerId._id, 'lot');
    if (!authResult.success) {
      return authResult.response;
    }

    // Удаление лота
    await Lot.findByIdAndDelete(id);

    return NextResponse.json(
      {
        success: true,
        message: 'Lot deleted successfully',
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Delete lot error:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
      },
      { status: 500 }
    );
  }
}
