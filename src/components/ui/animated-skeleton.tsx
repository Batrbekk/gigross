'use client';

import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface AnimatedSkeletonProps {
  className?: string;
  children?: React.ReactNode;
}

export function AnimatedSkeleton({ className, children }: AnimatedSkeletonProps) {
  return (
    <motion.div
      className={cn('bg-skeleton-bg rounded-md', className)}
      initial={{ opacity: 0.6 }}
      animate={{ 
        opacity: [0.6, 0.8, 0.6],
      }}
      transition={{
        duration: 1.5,
        repeat: Infinity,
        ease: 'easeInOut',
      }}
    >
      {children}
    </motion.div>
  );
}

// Компонент для shimmer эффекта
export function ShimmerSkeleton({ className }: { className?: string }) {
  return (
    <motion.div
      className={cn('relative bg-skeleton-bg rounded-md overflow-hidden', className)}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      {/* Shimmer эффект */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-r from-transparent via-skeleton-shimmer to-transparent"
        initial={{ x: '-100%' }}
        animate={{ x: '100%' }}
        transition={{
          duration: 1.5,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />
    </motion.div>
  );
}

// Компонент для таблицы с shimmer
export function TableShimmer({ rows = 5, columns = 6 }: { rows?: number; columns?: number }) {
  return (
    <>
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <motion.tr
          key={`skeleton-row-${rowIndex}`}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: rowIndex * 0.1 }}
        >
          {Array.from({ length: columns }).map((_, colIndex) => (
            <td key={`skeleton-cell-${rowIndex}-${colIndex}`} className="px-4 py-3">
              <ShimmerSkeleton 
                className={cn(
                  'h-4',
                  colIndex === columns - 1 ? 'w-8 rounded' : 'w-20',
                  colIndex === 2 ? 'w-16' : '',
                  colIndex === 0 ? 'w-24' : ''
                )}
              />
            </td>
          ))}
        </motion.tr>
      ))}
    </>
  );
}

// Компонент для карточек
export function CardShimmer({ count = 4 }: { count?: number }) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {Array.from({ length: count }).map((_, index) => (
        <motion.div
          key={`skeleton-card-${index}`}
          className="rounded-lg border bg-card p-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: index * 0.1 }}
        >
          <div className="space-y-3">
            <ShimmerSkeleton className="h-4 w-3/4" />
            <ShimmerSkeleton className="h-8 w-1/2" />
            <ShimmerSkeleton className="h-3 w-full" />
          </div>
        </motion.div>
      ))}
    </div>
  );
}

// Компонент для списка
export function ListShimmer({ count = 5 }: { count?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, index) => (
        <motion.div
          key={`skeleton-list-${index}`}
          className="flex items-center space-x-4 p-4"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3, delay: index * 0.1 }}
        >
          <ShimmerSkeleton className="h-10 w-10 rounded-full" />
          <div className="flex-1 space-y-2">
            <ShimmerSkeleton className="h-4 w-3/4" />
            <ShimmerSkeleton className="h-3 w-1/2" />
          </div>
          <ShimmerSkeleton className="h-8 w-8 rounded" />
        </motion.div>
      ))}
    </div>
  );
}
