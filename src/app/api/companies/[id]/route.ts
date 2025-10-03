import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/middleware';
import connectDB from '@/config/database';
import { User } from '@/database/models/User';
import { Product } from '@/database/models/Product';
import { Lot } from '@/database/models/Lot';
import { Certificate } from '@/database/models/Certificate';
import { UserRole, LotStatus, CertificateStatus } from '@/types';

// GET /api/companies/[id] - Получить данные компании
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

    // Получаем данные компании
    const company = await User.findById(id)
      .select('-password')
      .exec();

    if (!company) {
      return NextResponse.json(
        { success: false, error: 'Company not found' },
        { status: 404 }
      );
    }

    // Проверяем, что это производитель
    if (company.role !== UserRole.PRODUCER) {
      return NextResponse.json(
        { success: false, error: 'User is not a producer' },
        { status: 400 }
      );
    }

    // Получаем активные продукты компании
    const products = await Product.find({ producerId: id })
      .select('name category images description createdAt')
      .sort({ createdAt: -1 })
      .limit(20)
      .exec();

    // Получаем активные лоты компании (исключаем черновики)
    const lots = await Lot.find({ 
      producerId: id,
      status: { $ne: LotStatus.DRAFT }
    })
      .populate('productId', 'name category images')
      .sort({ createdAt: -1 })
      .limit(20)
      .exec();

    // Получаем одобренные сертификаты компании
    const certificates = await Certificate.find({ 
      userId: id,
      status: CertificateStatus.APPROVED
    })
      .select('title issuedBy certificateNumber issueDate expiryDate documents')
      .sort({ createdAt: -1 })
      .limit(20)
      .exec();

    // Статистика компании
    const stats = {
      totalProducts: await Product.countDocuments({ producerId: id }),
      activeLots: await Lot.countDocuments({ 
        producerId: id, 
        status: LotStatus.ACTIVE 
      }),
      soldLots: await Lot.countDocuments({ 
        producerId: id, 
        status: LotStatus.SOLD 
      }),
      totalCertificates: await Certificate.countDocuments({ 
        userId: id,
        status: CertificateStatus.APPROVED
      }),
    };

    return NextResponse.json({
      success: true,
      data: {
        company: {
          _id: company._id,
          email: company.email,
          role: company.role,
          isVerified: company.isVerified,
          isActive: company.isActive,
          profile: company.profile,
          createdAt: company.createdAt,
        },
        products,
        lots,
        certificates,
        stats,
      },
    });
  } catch (error) {
    console.error('Get company error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
