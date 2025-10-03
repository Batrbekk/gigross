import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/middleware';
import connectDB from '@/config/database';

// POST /api/certificates/upload - Загрузка файлов сертификатов (mock)
export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const authResult = await requireAuth(request);
    if (!authResult.success) {
      return authResult.response;
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        {
          success: false,
          error: 'No file provided',
        },
        { status: 400 }
      );
    }

    // Валидация типа файла
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid file type. Only JPEG, PNG, and PDF files are allowed',
        },
        { status: 400 }
      );
    }

    // Валидация размера файла (максимум 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      return NextResponse.json(
        {
          success: false,
          error: 'File size too large. Maximum size is 10MB',
        },
        { status: 400 }
      );
    }

    // Mock загрузка файла
    const mockFileName = `certificate_${Date.now()}_${Math.random().toString(36).substr(2, 8)}.${file.name.split('.').pop()}`;
    const mockFileUrl = `https://mock-storage.gigross.com/certificates/${mockFileName}`;
    const mockThumbnailUrl = file.type.startsWith('image/') 
      ? `https://mock-storage.gigross.com/certificates/thumbnails/${mockFileName}`
      : null;

    // Имитируем обработку файла
    await new Promise(resolve => setTimeout(resolve, 1000));

    const uploadResult = {
      fileName: mockFileName,
      originalName: file.name,
      url: mockFileUrl,
      thumbnailUrl: mockThumbnailUrl,
      size: file.size,
      type: file.type,
      uploadedAt: new Date(),
      mockInfo: {
        processingTime: '1.2s',
        storageLocation: 'mock-s3-bucket',
        virusScanResult: 'clean',
        ocrExtracted: file.type === 'application/pdf' ? 'Certificate text extracted successfully' : null,
      },
    };

    return NextResponse.json(
      {
        success: true,
        data: uploadResult,
        message: 'File uploaded successfully',
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Upload certificate error:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
      },
      { status: 500 }
    );
  }
}
