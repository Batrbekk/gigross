import { NextRequest, NextResponse } from 'next/server';
import { generatePresignedGetUrl } from '@/lib/s3-utils';

interface ViewUrlRequest {
  key: string;
  expiresIn?: number;
}

export async function POST(request: NextRequest) {
  try {
    const body: ViewUrlRequest = await request.json();
    const { key, expiresIn = 3600 } = body;

    // Validate required fields
    if (!key) {
      return NextResponse.json(
        { error: 'Missing required field: key' },
        { status: 400 }
      );
    }

    // Generate presigned GET URL
    const url = await generatePresignedGetUrl(key, expiresIn);

    return NextResponse.json({
      success: true,
      url,
      expiresIn,
    });
  } catch (error) {
    console.error('Error generating view URL:', error);
    return NextResponse.json(
      { error: 'Failed to generate view URL' },
      { status: 500 }
    );
  }
}

