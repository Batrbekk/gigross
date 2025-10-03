import { S3Client } from '@aws-sdk/client-s3';

// AWS S3 Configuration
export const awsConfig = {
  region: process.env.AWS_REGION || 'eu-north-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
  },
};

// S3 Client instance
export const s3Client = new S3Client(awsConfig);

// Upload configuration
export const uploadConfig = {
  bucketName: process.env.AWS_S3_BUCKET_NAME || 'gigross',
  region: process.env.AWS_REGION || 'eu-north-1',
  maxFileSize: parseInt(process.env.MAX_FILE_SIZE || '10485760'), // 10MB
  allowedFileTypes: (process.env.ALLOWED_FILE_TYPES || 'image/jpeg,image/png,image/jpg,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/msword').split(','),
  uploadPaths: {
    avatars: process.env.UPLOAD_PATH_AVATARS || 'avatars/',
    certificates: process.env.UPLOAD_PATH_CERTIFICATES || 'certificates/',
    products: process.env.UPLOAD_PATH_PRODUCTS || 'products/',
  },
  presignedUrlExpiration: 3600, // 1 hour
};


// File type validation
export const validateFileType = (fileType: string): boolean => {
  return uploadConfig.allowedFileTypes.includes(fileType);
};

// File size validation
export const validateFileSize = (fileSize: number): boolean => {
  return fileSize <= uploadConfig.maxFileSize;
};

// Generate unique filename
export const generateUniqueFilename = (originalName: string, userId: string): string => {
  const timestamp = Date.now();
  const randomString = Math.random().toString(36).substring(2, 15);
  const extension = originalName.split('.').pop();
  return `${timestamp}-${randomString}-${userId}.${extension}`;
};

