import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/middleware';
import { Certificate } from '@/database/models/Certificate';
import connectDB from '@/config/database';
import { UserRole, CertificateStatus } from '@/types';
import { createCertificateNotification } from '@/lib/notifications';
import { z } from 'zod';

const moderateCertificateSchema = z.object({
  status: z.enum([CertificateStatus.APPROVED, CertificateStatus.REJECTED]),
  verificationNotes: z.string().max(1000, 'Verification notes too long').optional(),
});

// POST /api/admin/certificates/[id]/moderate - Модерировать сертификат
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();

    const authResult = await requireAuth(request);
    if (!authResult.success) {
      return authResult.response;
    }

    // Проверяем, что пользователь - админ
    if (authResult.userRole !== UserRole.ADMIN) {
      return NextResponse.json(
        {
          success: false,
          error: 'Access denied. Admin role required.',
        },
        { status: 403 }
      );
    }

    const { id } = await params;
    const body = await request.json();

    // Валидация входных данных
    const validationResult = moderateCertificateSchema.safeParse(body);
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

    const { status, verificationNotes } = validationResult.data;

    // Находим сертификат
    const certificate = await Certificate.findById(id);
    if (!certificate) {
      return NextResponse.json(
        {
          success: false,
          error: 'Certificate not found',
        },
        { status: 404 }
      );
    }

    // Проверяем, что сертификат на модерации
    if (certificate.status !== CertificateStatus.PENDING) {
      return NextResponse.json(
        {
          success: false,
          error: 'Certificate is not pending moderation',
        },
        { status: 400 }
      );
    }

    // Обновляем сертификат
    certificate.status = status;
    certificate.verificationNotes = verificationNotes;
    certificate.verifiedBy = authResult.userId;
    certificate.verifiedAt = new Date();

    await certificate.save();

    // Отправляем уведомление пользователю
    try {
      await createCertificateNotification(
        certificate.userId,
        certificate.title,
        status === CertificateStatus.APPROVED ? 'approved' : 'rejected',
        verificationNotes
      );
    } catch (notificationError) {
      console.error('Error creating notification:', notificationError);
      // Не прерываем выполнение, если уведомление не удалось отправить
    }

    return NextResponse.json(
      {
        success: true,
        data: certificate,
        message: `Certificate ${status === CertificateStatus.APPROVED ? 'approved' : 'rejected'} successfully`,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Moderate certificate error:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
      },
      { status: 500 }
    );
  }
}
