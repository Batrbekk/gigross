import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth/middleware';
import { Product } from '@/database/models/Product';
import { Lot } from '@/database/models/Lot';
import { Certificate } from '@/database/models/Certificate';
import connectDB from '@/config/database';
import { ProductStatus, LotStatus, CertificateStatus } from '@/types';

// GET /api/admin/moderation - Получить контент для модерации
export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const authResult = await requireAdmin(request);
    if (!authResult.success) {
      return authResult.response;
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'all';
    const limit = parseInt(searchParams.get('limit') || '20');

    const moderationData: Record<string, unknown> = {};

    if (type === 'all' || type === 'products') {
      // Продукты ожидающие модерации
      const pendingProducts = await Product.find({ status: ProductStatus.INACTIVE })
        .populate('producerId', 'profile.firstName profile.lastName profile.company email')
        .sort({ createdAt: -1 })
        .limit(limit)
        .exec();

      moderationData.products = pendingProducts;
    }

    if (type === 'all' || type === 'lots') {
      // Лоты ожидающие модерации
      const pendingLots = await Lot.find({ status: LotStatus.DRAFT })
        .populate('producerId', 'profile.firstName profile.lastName profile.company email')
        .populate('productId', 'name category')
        .sort({ createdAt: -1 })
        .limit(limit)
        .exec();

      moderationData.lots = pendingLots;
    }

    if (type === 'all' || type === 'certificates') {
      // Сертификаты ожидающие модерации
      const pendingCertificates = await Certificate.find({ status: CertificateStatus.PENDING })
        .populate('userId', 'profile.firstName profile.lastName profile.company email')
        .sort({ createdAt: -1 })
        .limit(limit)
        .exec();

      moderationData.certificates = pendingCertificates;
    }

    // Статистика модерации
    const [productCount, lotCount, certificateCount] = await Promise.all([
      Product.countDocuments({ status: ProductStatus.INACTIVE }),
      Lot.countDocuments({ status: LotStatus.DRAFT }),
      Certificate.countDocuments({ status: CertificateStatus.PENDING }),
    ]);

    moderationData.statistics = {
      pendingProducts: productCount,
      pendingLots: lotCount,
      pendingCertificates: certificateCount,
      total: productCount + lotCount + certificateCount,
    };

    return NextResponse.json(
      {
        success: true,
        data: moderationData,
      },
      { status: 200 }
    );
  } catch (error) {
    // Log error for debugging purposes

    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
      },
      { status: 500 }
    );
  }
}

// PUT /api/admin/moderation - Модерировать контент
export async function PUT(request: NextRequest) {
  try {
    await connectDB();

    const authResult = await requireAdmin(request);
    if (!authResult.success) {
      return authResult.response;
    }

    const body = await request.json();

    if (!body.type || !body.id || !body.action) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required fields: type, id, action',
        },
        { status: 400 }
      );
    }

    const { type, id, action, reason } = body;
    let result;

    switch (type) {
      case 'product':
        if (action === 'approve') {
          result = await Product.findByIdAndUpdate(id, { status: ProductStatus.ACTIVE });
        } else if (action === 'reject') {
          result = await Product.findByIdAndUpdate(id, { 
            status: ProductStatus.DISCONTINUED,
            moderationNotes: reason 
          });
        }
        break;

      case 'lot':
        if (action === 'approve') {
          result = await Lot.findByIdAndUpdate(id, { status: LotStatus.ACTIVE });
        } else if (action === 'reject') {
          result = await Lot.findByIdAndUpdate(id, { 
            status: LotStatus.CANCELLED,
            moderationNotes: reason 
          });
        }
        break;

      case 'certificate':
        if (action === 'approve') {
          result = await Certificate.findByIdAndUpdate(id, { 
            status: CertificateStatus.VERIFIED,
            verifiedBy: authResult.user.userId,
            verifiedAt: new Date(),
            verificationNotes: reason || 'Approved by admin'
          });
        } else if (action === 'reject') {
          result = await Certificate.findByIdAndUpdate(id, { 
            status: CertificateStatus.REJECTED,
            verifiedBy: authResult.user.userId,
            verifiedAt: new Date(),
            verificationNotes: reason || 'Rejected by admin'
          });
        }
        break;

      default:
        return NextResponse.json(
          {
            success: false,
            error: 'Invalid type. Must be: product, lot, or certificate',
          },
          { status: 400 }
        );
    }

    if (!result) {
      return NextResponse.json(
        {
          success: false,
          error: 'Item not found or action failed',
        },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        data: result,
        message: `${type} ${action}ed successfully`,
      },
      { status: 200 }
    );
  } catch (error) {
    // Log error for debugging purposes

    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
      },
      { status: 500 }
    );
  }
}
