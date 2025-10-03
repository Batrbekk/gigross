# Настройка AWS S3 для загрузки файлов

## Обзор

В проекте реализована система загрузки файлов в AWS S3 с использованием presigned URLs для безопасной загрузки файлов с фронтенда.

## Функциональность

- ✅ Загрузка аватарок пользователей
- ✅ Загрузка сертификатов
- ✅ Загрузка изображений товаров
- ✅ Прогресс-бар загрузки
- ✅ Валидация типов и размеров файлов
- ✅ Удаление файлов
- ✅ Генерация временных ссылок для просмотра

## Настройка

### 1. Переменные окружения

Создайте файл `.env.local` в корне проекта и добавьте следующие переменные:

```env
# AWS S3 Configuration
AWS_ACCESS_KEY_ID=your_aws_access_key_id
AWS_SECRET_ACCESS_KEY=your_aws_secret_access_key
AWS_REGION=us-east-1
AWS_S3_BUCKET_NAME=gigross-uploads

# File Upload Configuration
MAX_FILE_SIZE=10485760 # 10MB in bytes
ALLOWED_FILE_TYPES=image/jpeg,image/png,image/webp,application/pdf

# Upload Paths
UPLOAD_PATH_AVATARS=avatars/
UPLOAD_PATH_CERTIFICATES=certificates/
UPLOAD_PATH_PRODUCTS=products/
```

### 2. Создание S3 Bucket

1. Войдите в AWS Console
2. Перейдите в S3
3. Создайте новый bucket с именем `gigross-uploads`
4. Настройте CORS для bucket:

```json
[
    {
        "AllowedHeaders": ["*"],
        "AllowedMethods": ["GET", "POST", "PUT", "DELETE"],
        "AllowedOrigins": ["http://localhost:3000", "https://yourdomain.com"],
        "ExposeHeaders": []
    }
]
```

### 3. Создание IAM пользователя

1. Создайте IAM пользователя с програмным доступом
2. Создайте политику с правами:

```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Action": [
                "s3:GetObject",
                "s3:PutObject",
                "s3:DeleteObject",
                "s3:PutObjectAcl"
            ],
            "Resource": "arn:aws:s3:::gigross-uploads/*"
        },
        {
            "Effect": "Allow",
            "Action": [
                "s3:ListBucket"
            ],
            "Resource": "arn:aws:s3:::gigross-uploads"
        }
    ]
}
```

3. Привяжите политику к пользователю
4. Создайте Access Key и добавьте в переменные окружения

## Использование

### Компоненты

#### FileUpload
Универсальный компонент для загрузки файлов:

```tsx
import { FileUpload } from '@/components/ui/file-upload';

<FileUpload
  accept="image/*,.pdf"
  maxSize={10 * 1024 * 1024} // 10MB
  uploadType="certificate"
  userId={user.id}
  onUploadSuccess={(url, key) => console.log('Uploaded:', url)}
  onUploadError={(error) => console.error('Error:', error)}
  multiple={false}
/>
```

#### AvatarUpload
Специализированный компонент для аватарок:

```tsx
import { AvatarUpload } from '@/components/ui/avatar-upload';

<AvatarUpload
  currentAvatar={avatarUrl}
  onUploadSuccess={(url, key) => setAvatarUrl(url)}
  onUploadError={(error) => console.error('Error:', error)}
  onRemoveAvatar={() => setAvatarUrl('')}
  userId={user.id}
/>
```

### API Endpoints

#### POST /api/upload/presigned-url
Получение presigned URL для загрузки:

```typescript
const response = await fetch('/api/upload/presigned-url', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    fileName: file.name,
    fileType: file.type,
    fileSize: file.size,
    uploadType: 'avatar', // 'avatar' | 'certificate' | 'product'
    userId: user.id,
  }),
});
```

#### DELETE /api/upload/delete
Удаление файла:

```typescript
const response = await fetch('/api/upload/delete', {
  method: 'DELETE',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ key: 'path/to/file.jpg' }),
});
```

#### POST /api/upload/view-url
Получение временной ссылки для просмотра:

```typescript
const response = await fetch('/api/upload/view-url', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ 
    key: 'path/to/file.jpg',
    expiresIn: 3600 // 1 час
  }),
});
```

### Хуки

#### useFileUpload
Хук для управления загрузкой файлов:

```typescript
import { useFileUpload } from '@/hooks/useFileUpload';

const { uploadFile, isUploading, progress, error, reset } = useFileUpload({
  onSuccess: (url, key) => console.log('Success:', url),
  onError: (error) => console.error('Error:', error),
});

await uploadFile(file, presignedData);
```

## Структура файлов

```
src/
├── lib/
│   ├── aws-config.ts          # Конфигурация AWS
│   └── s3-utils.ts            # Утилиты для работы с S3
├── hooks/
│   └── useFileUpload.ts       # Хук для загрузки файлов
├── components/ui/
│   ├── file-upload.tsx        # Универсальный компонент загрузки
│   └── avatar-upload.tsx      # Компонент для аватарок
└── app/api/upload/
    ├── presigned-url/route.ts # Генерация presigned URLs
    ├── delete/route.ts        # Удаление файлов
    └── view-url/route.ts      # Временные ссылки
```

## Безопасность

- Presigned URLs имеют ограниченное время действия (1 час)
- Валидация типов и размеров файлов на сервере
- Разделение файлов по папкам (avatars/, certificates/, products/)
- Уникальные имена файлов для предотвращения коллизий

## Ограничения

- Максимальный размер файла: 10MB (настраивается)
- Поддерживаемые типы: JPEG, PNG, WEBP, PDF
- Presigned URLs действительны 1 час

## Отладка

Для отладки включите логирование в `src/lib/s3-utils.ts`:

```typescript
console.log('Upload result:', result);
```

Проверьте переменные окружения:
```bash
echo $AWS_ACCESS_KEY_ID
echo $AWS_S3_BUCKET_NAME
```

