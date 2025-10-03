import { NextRequest, NextResponse } from 'next/server';
import { prepareFileUpload } from '@/lib/s3-utils';
import { validateFileType, validateFileSize } from '@/lib/aws-config';

// Types
interface PresignedUrlRequest {
  fileName: string;
  fileType: string;
  fileSize: number;
  uploadType: 'avatar' | 'certificate' | 'product';
  userId: string;
  metadata?: Record<string, string>;
}

export async function POST(request: NextRequest) {
  try {
    const body: PresignedUrlRequest = await request.json();
    const { fileName, fileType, fileSize, uploadType, userId, metadata } = body;

    console.log('Received request body:', body);

    // Validate required fields with detailed error messages
    const missingFields = [];
    if (!fileName) missingFields.push('fileName');
    if (!fileType) missingFields.push('fileType');
    if (!fileSize) missingFields.push('fileSize');
    if (!uploadType) missingFields.push('uploadType');
    if (!userId) missingFields.push('userId');

    if (missingFields.length > 0) {
      console.log('Missing fields:', missingFields);
      return NextResponse.json(
        { 
          error: 'Missing required fields',
          missingFields,
          received: body
        },
        { status: 400 }
      );
    }

    // Validate file type
    if (!validateFileType(fileType)) {
      return NextResponse.json(
        { error: `File type ${fileType} is not allowed` },
        { status: 400 }
      );
    }

    // Validate file size
    if (!validateFileSize(fileSize)) {
      return NextResponse.json(
        { error: 'File size exceeds maximum allowed size' },
        { status: 400 }
      );
    }

    // Create a mock File object for validation (we don't have the actual file yet)
    const mockFile = {
      name: fileName,
      type: fileType,
      size: fileSize,
    } as File;

    // Prepare file upload and get presigned data
    const uploadData = await prepareFileUpload({
      file: mockFile,
      userId,
      uploadType,
      metadata,
    });

    return NextResponse.json({
      success: true,
      key: uploadData.key,
      presignedData: uploadData.presignedData,
    });
  } catch (error) {
    console.error('Error generating presigned URL:', error);
    return NextResponse.json(
      { error: 'Failed to generate presigned URL' },
      { status: 500 }
    );
  }
}

