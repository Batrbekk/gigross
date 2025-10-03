'use client';

import { cn } from '@/lib/utils';
import { Wifi, WifiOff, Clock } from 'lucide-react';

interface PollingStatusProps {
  isConnected: boolean;
  interval?: number;
  className?: string;
  showInterval?: boolean;
}

export function PollingStatus({ 
  isConnected, 
  interval = 5000, 
  className,
  showInterval = false 
}: PollingStatusProps) {
  const formatInterval = (ms: number) => {
    const seconds = ms / 1000;
    if (seconds < 60) {
      return `${seconds}с`;
    }
    const minutes = seconds / 60;
    return `${minutes}м`;
  };

  if (isConnected) {
    return (
      <div className={cn(
        "flex items-center gap-1 text-green-600",
        className
      )}>
        <Wifi className="h-4 w-4" />
        <span className="text-sm font-medium">Автообновление</span>
        {showInterval && (
          <span className="text-xs text-muted-foreground">
            ({formatInterval(interval)})
          </span>
        )}
      </div>
    );
  }

  return (
    <div className={cn(
      "flex items-center gap-1 text-gray-500",
      className
    )}>
      <WifiOff className="h-4 w-4" />
      <span className="text-sm font-medium">Офлайн</span>
    </div>
  );
}

export default PollingStatus;
