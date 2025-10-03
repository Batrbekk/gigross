'use client';

import { useState, useEffect, useCallback } from 'react';
import { Clock, Timer, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AuctionTimerProps {
  endDate: string | Date;
  className?: string;
  showIcon?: boolean;
  variant?: 'default' | 'compact' | 'detailed';
  onTimeUp?: () => void;
}

interface TimeRemaining {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  total: number;
  isUrgent: boolean;
  isExpired: boolean;
}

export const AuctionTimer: React.FC<AuctionTimerProps> = ({
  endDate,
  className,
  showIcon = true,
  variant = 'default',
  onTimeUp,
}) => {
  const [timeRemaining, setTimeRemaining] = useState<TimeRemaining>({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
    total: 0,
    isUrgent: false,
    isExpired: false,
  });

  const calculateTimeRemaining = useCallback((): TimeRemaining => {
    const now = new Date().getTime();
    const end = new Date(endDate).getTime();
    const diff = end - now;

    if (diff <= 0) {
      return {
        days: 0,
        hours: 0,
        minutes: 0,
        seconds: 0,
        total: 0,
        isUrgent: false,
        isExpired: true,
      };
    }

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);

    // Определяем, является ли время критическим
    const isUrgent = days === 0 && (hours < 2 || (hours === 2 && minutes < 30));

    return {
      days,
      hours,
      minutes,
      seconds,
      total: diff,
      isUrgent,
      isExpired: false,
    };
  }, [endDate]);

  useEffect(() => {
    // Вычисляем время сразу
    setTimeRemaining(calculateTimeRemaining());

    // Обновляем каждую секунду
    const interval = setInterval(() => {
      const newTime = calculateTimeRemaining();
      setTimeRemaining(newTime);

      // Если время истекло, вызываем callback
      if (newTime.isExpired && onTimeUp) {
        onTimeUp();
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [calculateTimeRemaining, onTimeUp]);

  const formatTime = () => {
    const { days, hours, minutes, seconds, isExpired } = timeRemaining;

    if (isExpired) {
      return 'Завершен';
    }

    switch (variant) {
      case 'compact':
        if (days > 0) {
          return `${days}д ${hours}ч`;
        } else if (hours > 0) {
          return `${hours}ч ${minutes}м`;
        } else {
          return `${minutes}м ${seconds}с`;
        }

      case 'detailed':
        return `${days}д ${hours.toString().padStart(2, '0')}ч ${minutes.toString().padStart(2, '0')}м ${seconds.toString().padStart(2, '0')}с`;

      default:
        if (days > 0) {
          return `${days}д ${hours}ч ${minutes}м`;
        } else if (hours > 0) {
          return `${hours}ч ${minutes}м`;
        } else {
          return `${minutes}м ${seconds}с`;
        }
    }
  };

  const getIcon = () => {
    if (timeRemaining.isExpired) {
      return <AlertTriangle className="h-4 w-4 text-red-500" />;
    }
    if (timeRemaining.isUrgent) {
      return <Timer className="h-4 w-4 text-orange-500" />;
    }
    return <Clock className="h-4 w-4 text-muted-foreground" />;
  };

  const getContainerClasses = () => {
    const baseClasses = 'flex items-center gap-2';
    
    if (timeRemaining.isExpired) {
      return cn(baseClasses, 'text-red-600 bg-red-50 px-3 py-2 rounded-lg');
    }
    if (timeRemaining.isUrgent) {
      return cn(baseClasses, 'text-orange-600 bg-orange-50 px-3 py-2 rounded-lg animate-pulse');
    }
    return cn(baseClasses, 'text-muted-foreground');
  };

  return (
    <div className={cn(getContainerClasses(), className)}>
      {showIcon && getIcon()}
      <span className={cn(
        'font-medium',
        timeRemaining.isUrgent && 'font-semibold',
        timeRemaining.isExpired && 'font-semibold'
      )}>
        {formatTime()}
      </span>
    </div>
  );
};

export default AuctionTimer;
