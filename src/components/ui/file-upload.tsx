'use client';

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, X, CheckCircle, AlertCircle, FileImage } from 'lucide-react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useFileUpload, UseFileUploadOptions } from '@/hooks/useFileUpload';
import { cn } from '@/lib/utils';

export interface FileUploadProps {
  accept?: string;
  maxSize?: number;
  uploadType: 'avatar' | 'certificate' | 'product';
  userId: string;
  onUploadSuccess?: (url: string, key: string) => void;
  onUploadError?: (error: string) => void;
  onFileChange?: () => void;
  className?: string;
  disabled?: boolean;
  multiple?: boolean;
}

interface UploadedFile {
  file: File;
  url?: string;
  key?: string;
  error?: string;
  preview?: string;
}

export const FileUpload: React.FC<FileUploadProps> = ({
  accept = 'image/*,.pdf,.doc,.docx',
  maxSize = 10 * 1024 * 1024, // 10MB
  uploadType,
  userId,
  onUploadSuccess,
  onUploadError,
  onFileChange,
  className,
  disabled = false,
  multiple = false,
}) => {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const uploadOptions: UseFileUploadOptions = {
    onSuccess: (url, key) => {
      onUploadSuccess?.(url, key);
    },
    onError: (error) => {
      onUploadError?.(error);
    },
  };

  const { uploadFile, isUploading, progress, error } = useFileUpload(uploadOptions);

  const uploadSingleFile = useCallback(async (file: File) => {
    try {
      // Validate userId
      if (!userId) {
        throw new Error('User ID is required for upload');
      }

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
          uploadType,
          userId,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get presigned URL');
      }

      const { presignedData } = await response.json();

      // Upload file
      const result = await uploadFile(file, presignedData);
      
      // Update file state with success
      if (result) {
        setFiles(prev => prev.map(f => 
          f.file === file ? { ...f, url: result.url, key: result.key } : f
        ));
      }
    } catch (error) {
      // Update file state with error
      setFiles(prev => prev.map(f => 
        f.file === file ? { ...f, error: error instanceof Error ? error.message : 'Upload failed' } : f
      ));
      onUploadError?.(error instanceof Error ? error.message : 'Upload failed');
    }
  }, [userId, uploadType, uploadFile, onUploadError]);

  const handleFiles = useCallback(async (newFiles: FileList | File[]) => {
    const fileArray = Array.from(newFiles);
    const validFiles: UploadedFile[] = [];

    for (const file of fileArray) {
      // Validate file size
      if (file.size > maxSize) {
        validFiles.push({
          file,
          error: `File size exceeds ${Math.round(maxSize / 1024 / 1024)}MB limit`,
        });
        continue;
      }

      // Validate file type
      const allowedTypes = [
        'image/png',
        'image/jpg', 
        'image/jpeg',
        'application/pdf',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
        'application/msword' // .doc
      ];
      
      if (accept && !allowedTypes.includes(file.type)) {
        validFiles.push({
          file,
          error: 'Неподдерживаемый формат файла. Разрешены: PNG, JPG, JPEG, PDF, DOC, DOCX',
        });
        continue;
      }

      // Create preview for images
      const preview = file.type.startsWith('image/') ? URL.createObjectURL(file) : undefined;
      validFiles.push({ file, preview });
    }

    setFiles(prev => multiple ? [...prev, ...validFiles] : validFiles);

    // Уведомляем о изменении файлов
    onFileChange?.();

    // Auto-upload files
    for (const fileData of validFiles) {
      if (!fileData.error) {
        await uploadSingleFile(fileData.file);
      }
    }
  }, [maxSize, accept, multiple, uploadSingleFile]);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (disabled) return;

    const droppedFiles = e.dataTransfer.files;
    if (droppedFiles.length > 0) {
      handleFiles(droppedFiles);
    }
  }, [disabled, handleFiles]);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files;
    if (selectedFiles && selectedFiles.length > 0) {
      handleFiles(selectedFiles);
    }
  }, [handleFiles]);

  const removeFile = useCallback((index: number) => {
    setFiles(prev => {
      const fileToRemove = prev[index];
      // Clean up preview URL to prevent memory leaks
      if (fileToRemove?.preview) {
        URL.revokeObjectURL(fileToRemove.preview);
      }
      return prev.filter((_, i) => i !== index);
    });
    // Уведомляем о изменении файлов
    onFileChange?.();
  }, [onFileChange]);

  const openFileDialog = useCallback(() => {
    if (!disabled && fileInputRef.current) {
      fileInputRef.current.click();
    }
  }, [disabled]);

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Clean up preview URLs on unmount
  useEffect(() => {
    return () => {
      files.forEach(fileData => {
        if (fileData.preview) {
          URL.revokeObjectURL(fileData.preview);
        }
      });
    };
  }, [files]);

  return (
    <div className={cn('w-full', className)}>
      {/* Drop Zone */}
      <div
        className={cn(
          'relative border-2 border-dashed rounded-lg p-6 transition-colors',
          dragActive ? 'border-accent-primary bg-accent-primary/5' : 'border-border',
          disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:border-accent-primary/50'
        )}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={openFileDialog}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={accept}
          multiple={multiple}
          onChange={handleFileInput}
          className="hidden"
          disabled={disabled}
        />

        <div className="flex flex-col items-center justify-center text-center">
          <motion.div
            initial={{ scale: 1 }}
            animate={{ scale: dragActive ? 1.1 : 1 }}
            transition={{ duration: 0.2 }}
          >
            <Upload className="w-12 h-12 text-text-body mb-4" />
          </motion.div>
          
          <h3 className="text-lg font-semibold text-text-heading mb-2">
            Загрузить файлы
          </h3>
          
          <p className="text-sm text-text-body mb-4">
            Перетащите файлы сюда или нажмите для выбора
          </p>
          
          <div className="text-xs text-text-body space-y-1">
            <p>Поддерживаемые форматы: PNG, JPG, JPEG, PDF, DOC, DOCX</p>
            <p>Максимальный размер: {Math.round(maxSize / 1024 / 1024)}MB</p>
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <AnimatePresence>
        {isUploading && progress && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="mt-4"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-text-body">Загрузка...</span>
              <span className="text-sm text-text-body">{progress.percentage.toFixed(0)}%</span>
            </div>
            <Progress value={progress.percentage} className="h-2" />
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
            className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md flex items-center space-x-2"
          >
            <AlertCircle className="w-4 h-4 text-red-500" />
            <span className="text-sm text-red-700">{error}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* File List */}
      <AnimatePresence>
        {files.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="mt-4 space-y-2"
          >
            {files.map((fileData, index) => (
              <motion.div
                key={`${fileData.file.name}-${index}`}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="flex items-center justify-between p-3 bg-bg-menu-open rounded-lg border border-border"
              >
                <div className="flex items-center space-x-3">
                  {/* Preview for images */}
                  {fileData.file.type.startsWith('image/') ? (
                    <div className="w-12 h-12 rounded-lg overflow-hidden bg-bg-menu-open border border-border flex-shrink-0">
                      {(fileData.url || fileData.preview) ? (
                        <Image 
                          src={fileData.url || fileData.preview || ''} 
                          alt={fileData.file.name}
                          width={48}
                          height={48}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <FileImage className="w-6 h-6 text-text-body" />
                        </div>
                      )}
                    </div>
                  ) : (
                    <FileImage className="w-5 h-5 text-text-body" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-text-heading truncate">
                      {fileData.file.name}
                    </p>
                    <p className="text-xs text-text-body">
                      {formatFileSize(fileData.file.size)}
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  {fileData.error ? (
                    <AlertCircle className="w-4 h-4 text-red-500" />
                  ) : fileData.url ? (
                    <CheckCircle className="w-4 h-4 text-green-500" />
                  ) : (
                    <div className="w-4 h-4 border-2 border-accent-primary border-t-transparent rounded-full animate-spin" />
                  )}
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeFile(index)}
                    className="h-8 w-8 p-0 hover:bg-red-100 hover:text-red-600"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

