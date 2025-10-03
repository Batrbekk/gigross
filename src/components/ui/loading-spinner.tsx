'use client';

import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const sizeClasses = {
  sm: 'h-4 w-4',
  md: 'h-6 w-6',
  lg: 'h-8 w-8',
  xl: 'h-12 w-12',
};

export function LoadingSpinner({ size = 'md', className }: LoadingSpinnerProps) {
  return (
    <motion.div
      className={cn('flex items-center justify-center', className)}
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
    >
      <motion.div
        className={cn(
          'relative rounded-full border-2 border-accent-primary/20',
          sizeClasses[size]
        )}
        animate={{ rotate: 360 }}
        transition={{
          duration: 1,
          repeat: Infinity,
          ease: 'linear',
        }}
      >
        {/* Вращающаяся граница */}
        <motion.div
          className="absolute inset-0 rounded-full border-2 border-transparent border-t-accent-primary border-r-accent-secondary"
          animate={{ rotate: -360 }}
          transition={{
            duration: 1,
            repeat: Infinity,
            ease: 'linear',
          }}
        />
        
        {/* Центральная точка */}
        <motion.div
          className={cn(
            'absolute inset-0 m-auto rounded-full bg-gradient-to-r from-accent-primary to-accent-secondary',
            size === 'sm' ? 'h-1 w-1' : 
            size === 'md' ? 'h-1.5 w-1.5' : 
            size === 'lg' ? 'h-2 w-2' : 'h-3 w-3'
          )}
          animate={{ 
            scale: [1, 1.5, 1],
            opacity: [0.8, 1, 0.8]
          }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      </motion.div>
    </motion.div>
  );
}

// Компонент для кнопок
export function ButtonSpinner({ size = 'sm' }: { size?: 'sm' | 'md' }) {
  return (
    <motion.div
      className={cn(
        'relative rounded-full border-2 border-white/20',
        size === 'sm' ? 'h-4 w-4' : 'h-5 w-5'
      )}
      animate={{ rotate: 360 }}
      transition={{
        duration: 1,
        repeat: Infinity,
        ease: 'linear',
      }}
    >
      {/* Вращающаяся граница */}
      <motion.div
        className="absolute inset-0 rounded-full border-2 border-transparent border-t-white border-r-white/60"
        animate={{ rotate: -360 }}
        transition={{
          duration: 1,
          repeat: Infinity,
          ease: 'linear',
        }}
      />
      
      {/* Центральная точка */}
      <motion.div
        className={cn(
          'absolute inset-0 m-auto rounded-full bg-white/80',
          size === 'sm' ? 'h-0.5 w-0.5' : 'h-1 w-1'
        )}
        animate={{ 
          scale: [1, 1.5, 1],
          opacity: [0.6, 1, 0.6]
        }}
        transition={{
          duration: 1.2,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />
    </motion.div>
  );
}

// Компонент для полной страницы
export function PageLoader({ message = 'Загрузка...' }: { message?: string }) {
  return (
    <motion.div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-gradient-to-br from-white via-bg-sidebar-header/30 to-white"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
    >
      {/* Анимированный фон */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-br from-accent-primary/5 via-transparent to-accent-secondary/5"
        animate={{
          background: [
            'linear-gradient(45deg, rgba(87, 60, 255, 0.05), rgba(0, 0, 254, 0.05))',
            'linear-gradient(225deg, rgba(87, 60, 255, 0.08), rgba(0, 0, 254, 0.08))',
            'linear-gradient(45deg, rgba(87, 60, 255, 0.05), rgba(0, 0, 254, 0.05))'
          ]
        }}
        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
      />

      <motion.div
        className="relative z-10 flex flex-col items-center space-y-8"
        initial={{ scale: 0.8, opacity: 0, y: 30 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
      >
        {/* Стильный логотип с множественными кольцами */}
        <motion.div
          className="relative"
          animate={{ 
            rotate: [0, 360],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: 'linear',
          }}
        >
          {/* Внешнее кольцо */}
          <motion.div
            className="absolute -inset-4 rounded-full border-2 border-accent-primary/20"
            animate={{ 
              scale: [1, 1.1, 1],
              opacity: [0.3, 0.6, 0.3]
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />
          
          {/* Среднее кольцо */}
          <motion.div
            className="absolute -inset-2 rounded-full border-2 border-accent-secondary/30"
            animate={{ 
              scale: [1, 1.05, 1],
              opacity: [0.4, 0.7, 0.4]
            }}
            transition={{
              duration: 2.5,
              repeat: Infinity,
              ease: 'easeInOut',
              delay: 0.5,
            }}
          />

          {/* Основной логотип */}
          <motion.div
            className="relative h-20 w-20 rounded-2xl bg-gradient-to-br from-accent-primary to-accent-secondary shadow-2xl flex items-center justify-center"
            animate={{ 
              scale: [1, 1.02, 1],
              boxShadow: [
                '0 20px 40px rgba(87, 60, 255, 0.3)',
                '0 25px 50px rgba(87, 60, 255, 0.4)',
                '0 20px 40px rgba(87, 60, 255, 0.3)'
              ]
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          >
            <motion.span
              className="text-3xl font-bold text-white"
              animate={{ 
                scale: [1, 1.1, 1],
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                ease: 'easeInOut',
                delay: 0.3,
              }}
            >
              G
            </motion.span>
          </motion.div>
        </motion.div>

        {/* Стильный текст с анимацией */}
        <motion.div
          className="text-center space-y-2"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.5 }}
        >
          <motion.h2
            className="text-2xl font-bold bg-gradient-to-r from-accent-primary to-accent-secondary bg-clip-text text-transparent"
            animate={{ 
              backgroundPosition: ['0% 50%', '100% 50%', '0% 50%']
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          >
            Gigross
          </motion.h2>
          <motion.p
            className="text-text-body text-lg font-medium"
            animate={{ opacity: [0.7, 1, 0.7] }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          >
            {message}
          </motion.p>
        </motion.div>

        {/* Стильный прогресс бар */}
        <motion.div
          className="w-64 h-2 bg-bg-menu-open/50 rounded-full overflow-hidden backdrop-blur-sm"
          initial={{ opacity: 0, scaleX: 0 }}
          animate={{ opacity: 1, scaleX: 1 }}
          transition={{ duration: 0.6, delay: 0.6 }}
        >
          <motion.div
            className="h-full bg-gradient-to-r from-accent-primary via-accent-secondary to-accent-primary rounded-full relative"
            initial={{ x: '-100%' }}
            animate={{ x: '100%' }}
            transition={{
              duration: 2.5,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          >
            {/* Блестящий эффект */}
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
              animate={{ x: ['-100%', '100%'] }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                ease: 'easeInOut',
                delay: 0.5,
              }}
            />
          </motion.div>
        </motion.div>

        {/* Анимированные точки */}
        <motion.div
          className="flex space-x-3"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.7 }}
        >
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className="w-3 h-3 bg-gradient-to-br from-accent-primary to-accent-secondary rounded-full"
              animate={{
                scale: [1, 1.3, 1],
                opacity: [0.5, 1, 0.5],
                y: [0, -8, 0]
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                ease: 'easeInOut',
                delay: i * 0.3,
              }}
            />
          ))}
        </motion.div>
      </motion.div>
    </motion.div>
  );
}
