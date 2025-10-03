import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/config/database';
import mongoose from 'mongoose';

// GET /api/health - Проверка состояния API и подключения к БД
export async function GET(request: NextRequest) {
  try {
    // Проверяем подключение к MongoDB
    await connectDB();
    
    const dbStatus = mongoose.connection.readyState;
    const statusMap: Record<number, string> = {
      0: 'disconnected',
      1: 'connected',
      2: 'connecting',
      3: 'disconnecting',
    };
    const dbStatusText = statusMap[dbStatus] || 'unknown';

    const healthData = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      database: {
        status: dbStatusText,
        connected: dbStatus === 1,
      },
      environment: process.env.NODE_ENV || 'development',
      version: '1.0.0',
    };

    return NextResponse.json(
      {
        success: true,
        data: healthData,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Health check error:', error);
    
    return NextResponse.json(
      {
        success: false,
        status: 'unhealthy',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      },
      { status: 503 }
    );
  }
}
