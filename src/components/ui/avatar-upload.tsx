'use client';

import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, X, AlertCircle, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

export interface AvatarUploadProps {
  currentAvatar?: string;
  onUploadSuccess?: (url: string, key: string) => void;
  onUploadError?: (error: string) => void;
  onRemoveAvatar?: () => void;
  className?: string;
  disabled?: boolean;
  userId: string;
}

export const AvatarUpload: React.FC<AvatarUploadProps> = ({
  currentAvatar,
  onUploadSuccess,
  onUploadError,
  onRemoveAvatar,
  className,
  disabled = false,
  userId,
}) => {
  // console.log('AvatarUpload props:', { userId, currentAvatar, disabled });
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Пожалуйста, выберите изображение');
      return;
    }

    // Validate file size (5MB for avatars)
    if (file.size > 5 * 1024 * 1024) {
      setError('Размер файла не должен превышать 5MB');
      return;
    }

    await uploadAvatar(file);
  };

  const uploadAvatar = async (file: File) => {
    setIsUploading(true);
    setError(null);
    setUploadProgress(0);

    try {
      // Validate userId
      if (!userId) {
        throw new Error('User ID is required for upload');
      }

      // console.log('Uploading avatar for user:', userId);

      // Get presigned URL
      const response = await fetch('/api/upload/presigned-url', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fileName: file.name,
          fileType: file.type,
          fileSize: file.size,
          uploadType: 'avatar',
          userId,
        }),
      });

      if (!response.ok) {
        throw new Error('Не удалось получить URL для загрузки');
      }

      const { presignedData } = await response.json();

      // Upload file
      const formData = new FormData();
      Object.entries(presignedData.fields).forEach(([key, value]) => {
        formData.append(key, value as string);
      });
      formData.append('file', file);

      const uploadResponse = await fetch(presignedData.url, {
        method: 'POST',
        body: formData,
      });

      if (!uploadResponse.ok) {
        throw new Error('Ошибка загрузки файла');
      }

      const fileUrl = `https://${presignedData.fields.bucket}.s3.${process.env.NEXT_PUBLIC_AWS_REGION || 'eu-north-1'}.amazonaws.com/${presignedData.fields.key}`;
      
      setUploadProgress(100);
      onUploadSuccess?.(fileUrl, presignedData.fields.key);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Ошибка загрузки';
      setError(errorMessage);
      onUploadError?.(errorMessage);
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemoveAvatar = () => {
    setError(null);
    onRemoveAvatar?.();
  };

  const openFileDialog = () => {
    if (!disabled && fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  return (
    <div className={cn('flex flex-col items-center space-y-4', className)}>
      {/* Avatar Display */}
      <div className="relative">
        <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-border bg-bg-menu-open flex items-center justify-center">
          {currentAvatar ? (
            <img
              src={currentAvatar}
              alt="Avatar"
              className="w-full h-full object-cover"
            />
          ) : (
            <User className="w-16 h-16 text-text-body" />
          )}
        </div>

        {/* Upload Overlay */}
        <AnimatePresence>
          {isUploading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center"
            >
              <div className="text-center text-white">
                <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                <p className="text-xs">{uploadProgress.toFixed(0)}%</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Upload Controls */}
      <div className="flex flex-col items-center space-y-2">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          className="hidden"
          disabled={disabled}
        />

        <div className="flex space-x-2">
          <Button
            onClick={openFileDialog}
            disabled={disabled || isUploading}
            variant="outline"
            size="sm"
            className="flex items-center space-x-2"
          >
            <Upload className="w-4 h-4" />
            <span>Загрузить</span>
          </Button>

          {currentAvatar && (
            <Button
              onClick={handleRemoveAvatar}
              disabled={disabled || isUploading}
              variant="outline"
              size="sm"
              className="flex items-center space-x-2 hover:bg-red-100 hover:text-red-600 hover:border-red-300"
            >
              <X className="w-4 h-4" />
              <span>Удалить</span>
            </Button>
          )}
        </div>

        <p className="text-xs text-text-body text-center">
          JPG, PNG, WEBP до 5MB
        </p>
      </div>

      {/* Progress Bar */}
      <AnimatePresence>
        {isUploading && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="w-full max-w-xs"
          >
            <Progress value={uploadProgress} className="h-2" />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Error Message */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex items-center space-x-2 text-red-600 bg-red-50 px-3 py-2 rounded-md border border-red-200"
          >
            <AlertCircle className="w-4 h-4" />
            <span className="text-sm">{error}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

