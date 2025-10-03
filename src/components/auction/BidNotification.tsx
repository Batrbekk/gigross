'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatCurrency } from '@/lib/currency';
import { 
  Trophy, 
  X, 
  User,
  Clock
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface BidNotificationProps {
  isVisible: boolean;
  onClose: () => void;
  bidData?: {
    lotId: string;
    amount: number;
    currency: string;
    bidderName: string;
    lotTitle: string;
    timestamp: string;
  };
  autoHide?: boolean;
  duration?: number;
}

export const BidNotification: React.FC<BidNotificationProps> = ({
  isVisible,
  onClose,
  bidData,
  autoHide = true,
  duration = 5000,
}) => {
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (isVisible) {
      setIsAnimating(true);
      
      if (autoHide) {
        const timer = setTimeout(() => {
          handleClose();
        }, duration);

        return () => clearTimeout(timer);
      }
    }
  }, [isVisible, autoHide, duration]);

  const handleClose = () => {
    setIsAnimating(false);
    setTimeout(() => {
      onClose();
    }, 300); // Ждем завершения анимации
  };

  if (!isVisible || !bidData) return null;

  const formatTimeAgo = (timestamp: string) => {
    const now = new Date();
    const date = new Date(timestamp);
    const diff = now.getTime() - date.getTime();
    
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));

    if (seconds < 60) {
      return 'Только что';
    } else if (minutes < 60) {
      return `${minutes}м назад`;
    } else if (hours < 24) {
      return `${hours}ч назад`;
    } else {
      return date.toLocaleDateString('ru-RU');
    }
  };

  return (
    <div className="fixed top-4 right-4 z-50 max-w-sm">
      <Card className={cn(
        "border-l-4 border-l-green-500 shadow-lg transition-all duration-300",
        isAnimating ? "translate-x-0 opacity-100" : "translate-x-full opacity-0"
      )}>
        <CardContent className="p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <div className="flex items-center gap-1">
                  <Trophy className="h-4 w-4 text-green-600" />
                  <span className="text-sm font-semibold text-green-700">
                    Новая ставка!
                  </span>
                </div>
                <Badge variant="outline" className="text-xs">
                  Live
                </Badge>
              </div>
              
              <div className="space-y-2">
                <div>
                  <p className="text-sm font-medium line-clamp-1">
                    {bidData.lotTitle}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Лот #{bidData.lotId.slice(-8).toUpperCase()}
                  </p>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <User className="h-3 w-3 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">
                      {bidData.bidderName}
                    </span>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-green-600">
                      {formatCurrency(bidData.amount, bidData.currency)}
                    </p>
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {formatTimeAgo(bidData.timestamp)}
                    </p>
                  </div>
                </div>
              </div>
            </div>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClose}
              className="h-6 w-6 p-0 hover:bg-gray-100"
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default BidNotification;
