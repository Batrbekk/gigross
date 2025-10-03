import { useState, useCallback } from 'react';
import { uploadFileToS3 } from '@/lib/s3-utils';

export interface UploadProgress {
  loaded: number;
  total: number;
  percentage: number;
}

export interface UseFileUploadOptions {
  onSuccess?: (url: string, key: string) => void;
  onError?: (error: string) => void;
  onProgress?: (progress: UploadProgress) => void;
}

export interface UseFileUploadReturn {
  uploadFile: (file: File, presignedData: { url: string; fields: Record<string, string> }) => Promise<{ url: string; key: string } | null>;
  isUploading: boolean;
  progress: UploadProgress | null;
  error: string | null;
  reset: () => void;
}

export const useFileUpload = (options: UseFileUploadOptions = {}): UseFileUploadReturn => {
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState<UploadProgress | null>(null);
  const [error, setError] = useState<string | null>(null);

  const uploadFile = useCallback(async (file: File, presignedData: { url: string; fields: Record<string, string> }) => {
    setIsUploading(true);
    setError(null);
    setProgress({ loaded: 0, total: file.size, percentage: 0 });

    try {
      const result = await uploadFileToS3(file, presignedData);

      if (result.success && result.url && result.key) {
        options.onSuccess?.(result.url, result.key);
        setProgress({ loaded: file.size, total: file.size, percentage: 100 });
        return { url: result.url, key: result.key };
      } else {
        const errorMessage = result.error || 'Upload failed';
        setError(errorMessage);
        options.onError?.(errorMessage);
        return null;
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Upload failed';
      setError(errorMessage);
      options.onError?.(errorMessage);
      return null;
    } finally {
      setIsUploading(false);
    }
  }, [options]);

  const reset = useCallback(() => {
    setIsUploading(false);
    setProgress(null);
    setError(null);
  }, []);

  return {
    uploadFile,
    isUploading,
    progress,
    error,
    reset,
  };
};
