import { 
  createPresignedPost, 
  PresignedPostOptions 
} from '@aws-sdk/s3-presigned-post';
import { 
  getSignedUrl, 
} from '@aws-sdk/s3-request-presigner';
import { 
  GetObjectCommand, 
  PutObjectCommand,
  DeleteObjectCommand 
} from '@aws-sdk/client-s3';
import { s3Client, uploadConfig, generateUniqueFilename } from './aws-config';

// Types
export interface PresignedPostResponse {
  url: string;
  fields: Record<string, string>;
}

export interface UploadFileParams {
  file: File;
  userId: string;
  uploadType: 'avatar' | 'certificate' | 'product';
  metadata?: Record<string, string>;
}

export interface UploadResult {
  success: boolean;
  url?: string;
  key?: string;
  error?: string;
}

// Generate presigned POST URL for direct upload from frontend
export const generatePresignedPost = async (
  key: string,
  contentType: string,
  metadata?: Record<string, string>
): Promise<PresignedPostResponse> => {
  try {
    // For S3 Express One Zone, we need to use PUT instead of POST
    if (uploadConfig.bucketName.includes('--')) {
      const putUrl = await generatePresignedPutUrl(key, contentType, metadata);
      return {
        url: putUrl,
        fields: {
          'Content-Type': contentType,
          ...metadata,
        }
      };
    }

    // For regular S3 bucket, use presigned POST

    const conditions: PresignedPostOptions['Conditions'] = [
      ['content-length-range', 0, uploadConfig.maxFileSize],
      ['starts-with', '$Content-Type', contentType.split('/')[0]],
      { bucket: uploadConfig.bucketName },
      { key },
    ];

    if (metadata) {
      Object.entries(metadata).forEach(([key, value]) => {
        conditions.push(['starts-with', `$${key}`, value]);
      });
    }

    const { url, fields } = await createPresignedPost(s3Client, {
      Bucket: uploadConfig.bucketName,
      Key: key,
      Conditions: conditions,
      Fields: {
        'Content-Type': contentType,
        ...metadata,
      },
      Expires: uploadConfig.presignedUrlExpiration,
    });

    return { url, fields };
  } catch (error) {
    console.error('Error generating presigned POST:', error);
    throw new Error('Failed to generate presigned URL');
  }
};

// Generate presigned URL for PUT operation
export const generatePresignedPutUrl = async (
  key: string,
  contentType: string,
  metadata?: Record<string, string>
): Promise<string> => {
  try {
    const command = new PutObjectCommand({
      Bucket: uploadConfig.bucketName,
      Key: key,
      ContentType: contentType,
      Metadata: metadata,
    });

    const url = await getSignedUrl(s3Client, command, {
      expiresIn: uploadConfig.presignedUrlExpiration,
    });

    return url;
  } catch (error) {
    console.error('Error generating presigned PUT URL:', error);
    throw new Error('Failed to generate presigned URL');
  }
};

// Generate presigned URL for GET operation (viewing files)
export const generatePresignedGetUrl = async (
  key: string,
  expiresIn: number = 3600
): Promise<string> => {
  try {
    const command = new GetObjectCommand({
      Bucket: uploadConfig.bucketName,
      Key: key,
    });

    const url = await getSignedUrl(s3Client, command, {
      expiresIn,
    });

    return url;
  } catch (error) {
    console.error('Error generating presigned GET URL:', error);
    throw new Error('Failed to generate presigned URL');
  }
};

// Delete file from S3
export const deleteFileFromS3 = async (key: string): Promise<boolean> => {
  try {
    const command = new DeleteObjectCommand({
      Bucket: uploadConfig.bucketName,
      Key: key,
    });

    await s3Client.send(command);
    return true;
  } catch (error) {
    console.error('Error deleting file from S3:', error);
    return false;
  }
};

// Prepare file for upload
export const prepareFileUpload = async (params: UploadFileParams): Promise<{
  key: string;
  contentType: string;
  presignedData: PresignedPostResponse;
}> => {
  const { file, userId, uploadType, metadata = {} } = params;

  // Validate file type
  if (!uploadConfig.allowedFileTypes.includes(file.type)) {
    throw new Error(`File type ${file.type} is not allowed`);
  }

  // Validate file size
  if (file.size > uploadConfig.maxFileSize) {
    throw new Error(`File size exceeds maximum allowed size of ${uploadConfig.maxFileSize} bytes`);
  }

  // Generate unique filename and key
  const filename = generateUniqueFilename(file.name, userId);
  const path = uploadConfig.uploadPaths[uploadType === 'avatar' ? 'avatars' : 
                                        uploadType === 'certificate' ? 'certificates' : 'products'];
  const key = `${path}${filename}`;

  // Add metadata
  const fileMetadata = {
    userId,
    uploadType,
    originalName: file.name,
    uploadedAt: new Date().toISOString(),
    ...metadata,
  };

  // Generate presigned POST data
  const presignedData = await generatePresignedPost(key, file.type, fileMetadata);

  return {
    key,
    contentType: file.type,
    presignedData,
  };
};

// Upload file using presigned POST or PUT
export const uploadFileToS3 = async (
  file: File,
  presignedData: PresignedPostResponse
): Promise<UploadResult> => {
  try {
    // For S3 Express One Zone, use PUT method
    if (uploadConfig.bucketName.includes('--')) {
      const response = await fetch(presignedData.url, {
        method: 'PUT',
        headers: {
          'Content-Type': presignedData.fields['Content-Type'] || file.type,
        },
        body: file,
      });

      if (!response.ok) {
        throw new Error(`Upload failed with status: ${response.status}`);
      }

      // Extract key from the URL or use a generated one
      const key = presignedData.fields.key || 'unknown';
      const fileUrl = getPublicUrl(key);

      return {
        success: true,
        url: fileUrl,
        key,
      };
    }

    // For regular S3 bucket, use POST with form data

    // For regular S3, use POST with form data
    const formData = new FormData();
    
    // Add all fields from presigned POST
    Object.entries(presignedData.fields).forEach(([key, value]) => {
      formData.append(key, value);
    });
    
    // Add the file last
    formData.append('file', file);

    const response = await fetch(presignedData.url, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`Upload failed with status: ${response.status}`);
    }

    // Extract key from form data to construct the URL
    const key = presignedData.fields.key;
    const fileUrl = getPublicUrl(key);

    return {
      success: true,
      url: fileUrl,
      key,
    };
  } catch (error) {
    console.error('Error uploading file to S3:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Upload failed',
    };
  }
};

// Get public URL for a file (if bucket is public)
export const getPublicUrl = (key: string): string => {
  // Handle S3 Express One Zone bucket format
  if (uploadConfig.bucketName.includes('--')) {
    // Format: gigross--eun1-az1--x-s3 -> gigross--eun1-az1--x-s3.s3express-eun1-az1.eu-north-1.amazonaws.com
    const bucketParts = uploadConfig.bucketName.split('--');
    const region = uploadConfig.region;
    const az = bucketParts[1]; // eun1-az1
    return `https://${uploadConfig.bucketName}.s3express-${az}.${region}.amazonaws.com/${key}`;
  }
  // Regular S3 bucket format
  return `https://${uploadConfig.bucketName}.s3.${uploadConfig.region}.amazonaws.com/${key}`;
};

// Check if file exists in S3
export const fileExists = async (key: string): Promise<boolean> => {
  try {
    const command = new GetObjectCommand({
      Bucket: uploadConfig.bucketName,
      Key: key,
    });

    await s3Client.send(command);
    return true;
  } catch (error) {
    console.error('Error checking if file exists in S3:', error);
    return false;
  }
};

