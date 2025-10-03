import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/middleware';
import connectDB from '@/config/database';
import { Product } from '@/database/models/Product';
import { Lot } from '@/database/models/Lot';
import { Certificate } from '@/database/models/Certificate';
import { LotStatus, CertificateStatus } from '@/types';

// GET /api/products/[id] - Получить детальную информацию о продукте
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB();

    const authResult = await requireAuth(request);
    if (!authResult.success) {
      return authResult.response;
    }

    const { id } = params;

    // Получаем детальную информацию о продукте
    const product = await Product.findById(id)
      .populate('producerId', 'profile.firstName profile.lastName profile.company profile.phoneNumber profile.address')
      .exec();

    if (!product) {
      return NextResponse.json(
        { success: false, error: 'Product not found' },
        { status: 404 }
      );
    }

    // Получаем активные лоты этого продукта
    const activeLots = await Lot.find({ 
      productId: id,
      status: { $ne: LotStatus.DRAFT }
    })
      .populate('producerId', 'profile.firstName profile.lastName profile.company')
      .sort({ createdAt: -1 })
      .limit(10)
      .exec();

    // Получаем сертификаты, связанные с этим продуктом (если есть связь)
    const certificates = await Certificate.find({ 
      userId: product.producerId,
      status: CertificateStatus.APPROVED
    })
      .select('title issuedBy certificateNumber issueDate expiryDate documents')
      .sort({ createdAt: -1 })
      .limit(5)
      .exec();

    // Статистика продукта
    const stats = {
      totalLots: await Lot.countDocuments({ productId: id }),
      activeLots: await Lot.countDocuments({ 
        productId: id, 
        status: LotStatus.ACTIVE 
      }),
      soldLots: await Lot.countDocuments({ 
        productId: id, 
        status: LotStatus.SOLD 
      }),
      totalCertificates: certificates.length,
    };

    return NextResponse.json({
      success: true,
      data: {
        product: {
          _id: product._id,
          name: product.name,
          description: product.description,
          category: product.category,
          images: product.images,
          specifications: product.specifications,
          producerId: product.producerId,
          createdAt: product.createdAt,
          updatedAt: product.updatedAt,
        },
        producer: product.producerId,
        activeLots,
        certificates,
        stats,
      },
    });
  } catch (error) {
    console.error('Get product details error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}