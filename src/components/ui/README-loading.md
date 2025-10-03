# Компоненты загрузки с Framer Motion

## Обзор

Созданы красивые анимированные компоненты загрузки с использованием Framer Motion для единообразного пользовательского опыта.

## Компоненты

### 1. LoadingSpinner

Базовый спиннер загрузки с разными размерами.

```tsx
import { LoadingSpinner, ButtonSpinner } from '@/components/ui/loading-spinner';

// Обычный спиннер
<LoadingSpinner size="md" />

// Для кнопок
<ButtonSpinner size="sm" />
```

### 2. PageLoader

Полноэкранный загрузчик для страниц.

```tsx
import { PageLoader } from '@/components/ui/loading-spinner';

<PageLoader message="Загрузка данных..." />
```

### 3. AnimatedSkeleton

Анимированные skeleton элементы.

```tsx
import { 
  ShimmerSkeleton, 
  TableShimmer, 
  CardShimmer, 
  ListShimmer 
} from '@/components/ui/animated-skeleton';

// Базовый shimmer
<ShimmerSkeleton className="h-4 w-20" />

// Для таблиц
<TableShimmer rows={5} columns={6} />

// Для карточек
<CardShimmer count={4} />

// Для списков
<ListShimmer count={5} />
```

### 4. Button с загрузкой

Кнопка с встроенным спиннером.

```tsx
import { Button } from '@/components/ui/button';

<Button loading={isLoading}>
  Сохранить
</Button>
```

### 5. PageLoaderWrapper

Обертка для страниц с загрузкой.

```tsx
import { PageLoaderWrapper } from '@/components/ui/page-loader';

<PageLoaderWrapper isLoading={isLoading} message="Загрузка...">
  <YourContent />
</PageLoaderWrapper>
```

### 6. RedirectLoader

Загрузчик для перенаправлений.

```tsx
import { RedirectLoader } from '@/components/ui/page-loader';

<RedirectLoader message="Перенаправление..." />
```

## Использование

### В таблицах

Замените старые skeleton на новые анимированные:

```tsx
// Старый способ
{isLoading ? (
  Array.from({ length: 5 }).map((_, index) => (
    <TableRow key={`skeleton-${index}`}>
      <TableCell><Skeleton className="h-4 w-[100px]" /></TableCell>
      // ...
    </TableRow>
  ))
) : (
  // данные
)}

// Новый способ
{isLoading ? (
  <TableShimmer rows={5} columns={6} />
) : (
  // данные
)}
```

### В кнопках

```tsx
// Автоматический спиннер в кнопке
<Button loading={isSubmitting}>
  Отправить
</Button>
```

### Для страниц

```tsx
// Обертка с загрузкой
<PageLoaderWrapper isLoading={isPageLoading}>
  <PageContent />
</PageLoaderWrapper>
```

## Анимации

- **Пульсирующие skeleton** с плавными переходами
- **Shimmer эффект** для таблиц
- **Вращающиеся спиннеры** с градиентами
- **Плавные появления** контента
- **Пульсирующий логотип** в PageLoader

## Цвета

Все компоненты используют обновленную цветовую схему:
- `bg-skeleton-bg` - фон skeleton
- `skeleton-shimmer` - shimmer эффект
- `accent-primary` - основной акцент
- `accent-secondary` - вторичный акцент
