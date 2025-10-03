import { NextRequest, NextResponse } from 'next/server';
import { deleteFileFromS3 } from '@/lib/s3-utils';

interface DeleteFileRequest {
  key: string;
}

export async function DELETE(request: NextRequest) {
  try {
    const body: DeleteFileRequest = await request.json();
    const { key } = body;

    // Validate required fields
    if (!key) {
      return NextResponse.json(
        { error: 'Missing required field: key' },
        { status: 400 }
      );
    }

    // Delete file from S3
    const success = await deleteFileFromS3(key);

    if (success) {
      return NextResponse.json({
        success: true,
        message: 'File deleted successfully',
      });
    } else {
      return NextResponse.json(
        { error: 'Failed to delete file' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error deleting file:', error);
    return NextResponse.json(
      { error: 'Failed to delete file' },
      { status: 500 }
    );
  }
}

