'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { FileUpload } from '@/components/ui/file-upload';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useApi } from '@/hooks/useApi';
import { useAuthStore } from '@/stores/authStore';
import { CertificateStatus } from '@/types';
import { ArrowLeft, Save, Upload, Calendar as CalendarIcon } from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';

export default function CreateCertificatePage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { execute, isLoading } = useApi();

  
  const [formData, setFormData] = useState({
    title: '',
    issuedBy: '',
    certificateNumber: '',
    issueDate: undefined as Date | undefined,
    expiryDate: undefined as Date | undefined,
    description: '',
  });
  
  const [uploadedFiles, setUploadedFiles] = useState<{url: string, key: string}[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleInputChange = (field: string, value: string | Date | undefined) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: '',
      }));
    }
  };

  const handleFileChange = () => {
    // Очищаем ошибку файлов при изменении состояния загрузки
    if (errors.files) {
      setErrors(prev => ({
        ...prev,
        files: '',
      }));
    }
  };

  const handleFileUploadSuccess = (url: string, key: string) => {
    setUploadedFiles(prev => [...prev, { url, key }]);
    // Очищаем ошибку валидации файлов при успешной загрузке
    setErrors(prev => ({
      ...prev,
      files: '',
    }));
  };

  const handleFileUploadError = (error: string) => {
    setErrors(prev => ({
      ...prev,
      files: error,
    }));
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.title) newErrors.title = 'Название обязательно';
    if (!formData.issuedBy) newErrors.issuedBy = 'Организация обязательна';
    if (!formData.certificateNumber) newErrors.certificateNumber = 'Номер сертификата обязателен';
    if (!formData.issueDate) newErrors.issueDate = 'Дата выдачи обязательна';
    if (!formData.expiryDate) newErrors.expiryDate = 'Дата истечения обязательна';
    
    if (formData.issueDate && formData.expiryDate) {
      if (formData.expiryDate <= formData.issueDate) {
        newErrors.expiryDate = 'Дата истечения должна быть после даты выдачи';
      }
    }

    if (uploadedFiles.length === 0) {
      newErrors.files = 'Необходимо загрузить хотя бы один документ';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      const certificateData = {
        ...formData,
        issueDate: formData.issueDate?.toISOString(),
        expiryDate: formData.expiryDate?.toISOString(),
        documents: {
          original: uploadedFiles[0]?.url || '',
          thumbnail: uploadedFiles[0]?.url || '',
        },
        status: CertificateStatus.PENDING,
      };

      const response = await execute('/api/certificates', {
        method: 'POST',
        body: JSON.stringify(certificateData),
      });
      
      if (response && response.success) {
        router.push('/dashboard/certificates');
      }
    } catch {
      setErrors(prev => ({
        ...prev,
        submit: 'Ошибка при создании сертификата',
      }));
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/dashboard/certificates">
              <ArrowLeft className="w-4 h-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Новый сертификат</h1>
            <p className="text-text-body">
              Создайте новый сертификат
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid gap-6 md:grid-cols-2">
          {/* Основная информация */}
          <Card>
            <CardHeader>
              <CardTitle>Основная информация</CardTitle>
              <CardDescription>
                Заполните основные данные сертификата
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Название сертификата</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                  placeholder="Введите название сертификата"
                />
                {errors.title && <p className="text-sm text-red-600">{errors.title}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="issuedBy">Выдано организацией</Label>
                <Input
                  id="issuedBy"
                  value={formData.issuedBy}
                  onChange={(e) => handleInputChange('issuedBy', e.target.value)}
                  placeholder="Введите название организации"
                />
                {errors.issuedBy && <p className="text-sm text-red-600">{errors.issuedBy}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="certificateNumber">Номер сертификата</Label>
                <Input
                  id="certificateNumber"
                  value={formData.certificateNumber}
                  onChange={(e) => handleInputChange('certificateNumber', e.target.value)}
                  placeholder="Введите номер сертификата"
                />
                {errors.certificateNumber && <p className="text-sm text-red-600">{errors.certificateNumber}</p>}
              </div>
            </CardContent>
          </Card>

          {/* Даты и описание */}
          <Card>
            <CardHeader>
              <CardTitle>Даты и описание</CardTitle>
              <CardDescription>
                Укажите срок действия и описание
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Дата выдачи</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-start text-left font-normal"
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {formData.issueDate ? (
                        format(formData.issueDate, 'PPP', { locale: ru })
                      ) : (
                        <span>Выберите дату</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start" side="bottom">
                    <Calendar
                      mode="single"
                      selected={formData.issueDate}
                      onSelect={(date) => handleInputChange('issueDate', date)}
                      disabled={(date) => date > new Date()}
                      formatters={{
                        formatMonthDropdown: (date) => date.toLocaleDateString('ru-RU', { month: 'long' }),
                        formatWeekdayName: (date) => date.toLocaleDateString('ru-RU', { weekday: 'short' }),
                      }}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                {errors.issueDate && <p className="text-sm text-red-600">{errors.issueDate}</p>}
              </div>

              <div className="space-y-2">
                <Label>Дата истечения</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-start text-left font-normal"
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {formData.expiryDate ? (
                        format(formData.expiryDate, 'PPP', { locale: ru })
                      ) : (
                        <span>Выберите дату</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start" side="bottom">
                    <Calendar
                      mode="single"
                      selected={formData.expiryDate}
                      onSelect={(date) => handleInputChange('expiryDate', date)}
                      disabled={(date) => 
                        date < new Date() || 
                        (formData.issueDate ? date <= formData.issueDate : false)
                      }
                      formatters={{
                        formatMonthDropdown: (date) => date.toLocaleDateString('ru-RU', { month: 'long' }),
                        formatWeekdayName: (date) => date.toLocaleDateString('ru-RU', { weekday: 'short' }),
                      }}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                {errors.expiryDate && <p className="text-sm text-red-600">{errors.expiryDate}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Описание</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  placeholder="Введите описание сертификата (необязательно)"
                  rows={4}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Загрузка документов */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="w-5 h-5" />
              Документы сертификата
            </CardTitle>
            <CardDescription>
              Загрузите скан или фотографию сертификата в формате PNG, JPG, JPEG, PDF, DOC или DOCX. 
              После загрузки сертификат будет отправлен на модерацию.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <FileUpload
              accept="image/*,.pdf,.doc,.docx"
              maxSize={10 * 1024 * 1024} // 10MB
              uploadType="certificate"
              userId={user?._id || user?.id || ''}
              onUploadSuccess={handleFileUploadSuccess}
              onUploadError={handleFileUploadError}
              onFileChange={handleFileChange}
              multiple={false}
            />
            {errors.files && <p className="text-sm text-red-600 mt-2">{errors.files}</p>}
          </CardContent>
        </Card>

        {/* Submit Error */}
        {errors.submit && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-md">
            <p className="text-sm text-red-700">{errors.submit}</p>
          </div>
        )}

        {/* Submit Button */}
        <div className="flex justify-end space-x-4">
          <Button variant="outline" asChild>
            <Link href="/dashboard/certificates">Отмена</Link>
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                Создание...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Создать сертификат
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}

