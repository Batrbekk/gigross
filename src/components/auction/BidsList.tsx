'use client';

import { useState, useEffect } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useApi } from '@/hooks/useApi';
import { useBidsPolling } from '@/hooks/useBidsPolling';
import { formatCurrency } from '@/lib/currency';
import { Bid } from '@/types';
import { 
  Trophy, 
  Clock, 
  TrendingUp, 
  RefreshCw,
  Eye,
  EyeOff,
  Wifi
} from 'lucide-react';
import { cn } from '@/lib/utils';


interface BidsListProps {
  lotId: string;
  currentPrice: number;
  currency: string;
  showAllBids?: boolean;
  maxHeight?: string;
  className?: string;
  onBidUpdate?: (newBid: Bid) => void;
}

export const BidsList: React.FC<BidsListProps> = ({
  lotId,
  currentPrice: _currentPrice,
  currency,
  showAllBids = true,
  maxHeight = '400px',
  className,
  onBidUpdate: _onBidUpdate,
}) => {
  const { execute, isLoading } = useApi();
  const [bids, setBids] = useState<Bid[]>([]);
  const [showBidders, setShowBidders] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Polling обновления для конкретного лота каждые 5 секунд
  const { 
    isConnected: isPollingConnected,
    refreshBids 
  } = useBidsPolling({
    lotId: lotId,
    interval: 5000, // 5 секунд
    enabled: true,
    onBidsUpdate: (data) => {
      console.log('BidsList updated via polling:', data.length, 'bids');
      // Обновляем локальное состояние
      setBids(data);
    },
    onError: (error) => {
      console.error('Polling error in BidsList:', error);
    },
  });

  const fetchBids = async () => {
    try {
      setRefreshing(true);
      const response = await execute(`/api/bids/lot/${lotId}?limit=50`, { 
        method: 'GET' 
      });
      
      if (response && response.success) {
        setBids(response.data);
      }
    } catch (error) {
      console.error('Error fetching bids:', error);
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchBids();
  }, [lotId]);

  const formatBidderName = (bidder: Bid['bidderId']) => {
    if (typeof bidder === 'string') {
      return 'Анонимный участник';
    }
    
    if (bidder.profile?.company) {
      return bidder.profile.company;
    }
    if (bidder.profile?.firstName && bidder.profile?.lastName) {
      return `${bidder.profile.firstName} ${bidder.profile.lastName}`;
    }
    if (bidder.email) {
      return bidder.email.split('@')[0];
    }
    return 'Анонимный участник';
  };

  const getBidderInitials = (bidder: Bid['bidderId']) => {
    if (typeof bidder === 'string') {
      return '??';
    }
    
    if (bidder.profile?.company) {
      return bidder.profile.company.substring(0, 2).toUpperCase();
    }
    if (bidder.profile?.firstName && bidder.profile?.lastName) {
      return `${bidder.profile.firstName[0]}${bidder.profile.lastName[0]}`.toUpperCase();
    }
    if (bidder.email) {
      return bidder.email.substring(0, 2).toUpperCase();
    }
    return '??';
  };

  const getBidStatus = (bid: Bid, index: number) => {
    if (bid.isWinning) {
      return { label: 'Лидирует', variant: 'default' as const, icon: Trophy };
    }
    if (index === 0) {
      return { label: 'Лидирует', variant: 'default' as const, icon: Trophy };
    }
    if (bid.status === 'outbid') {
      return { label: 'Перебито', variant: 'secondary' as const, icon: TrendingUp };
    }
    return { label: 'Активно', variant: 'outline' as const, icon: Clock };
  };

  const formatTimeAgo = (dateString: string) => {
    const now = new Date();
    const date = new Date(dateString);
    const diff = now.getTime() - date.getTime();
    
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (minutes < 1) {
      return 'Только что';
    } else if (minutes < 60) {
      return `${minutes}м назад`;
    } else if (hours < 24) {
      return `${hours}ч назад`;
    } else {
      return `${days}д назад`;
    }
  };

  const handleRefresh = () => {
    refreshBids();
  };

  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5" />
            Ставки
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3 p-3 border rounded-lg">
                <Skeleton className="h-8 w-8 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-20" />
                </div>
                <Skeleton className="h-6 w-16" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const displayBids = showAllBids ? bids : bids.slice(0, 5);

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5" />
            Ставки ({bids.length})
            {isPollingConnected && (
              <div className="flex items-center gap-1 text-green-600">
                <Wifi className="h-3 w-3" />
                <span className="text-xs font-medium">Live</span>
              </div>
            )}
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowBidders(!showBidders)}
            >
              {showBidders ? (
                <Eye className="h-4 w-4" />
              ) : (
                <EyeOff className="h-4 w-4" />
              )}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleRefresh}
              disabled={refreshing}
            >
              <RefreshCw className={cn("h-4 w-4", refreshing && "animate-spin")} />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {bids.length === 0 ? (
          <div className="text-center py-8">
            <Trophy className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">Пока нет ставок</p>
            <p className="text-sm text-muted-foreground mt-1">
              Станьте первым участником аукциона!
            </p>
          </div>
        ) : (
          <ScrollArea className="w-full" style={{ maxHeight }}>
            <div className="space-y-2">
              {displayBids.map((bid, index) => {
                const status = getBidStatus(bid, index);
                const StatusIcon = status.icon;
                
                return (
                  <div
                    key={bid._id}
                    className={cn(
                      "flex items-center gap-3 p-3 border rounded-lg transition-all hover:bg-muted/50",
                      bid.isWinning && "bg-green-50 border-green-200",
                      index === 0 && !bid.isWinning && "bg-blue-50 border-blue-200"
                    )}
                  >
                    <Avatar className="h-8 w-8">
                      <AvatarImage src="" />
                      <AvatarFallback className="text-xs">
                        {showBidders ? getBidderInitials(bid.bidderId) : '?'}
                      </AvatarFallback>
                    </Avatar>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-sm truncate">
                          {showBidders ? formatBidderName(bid.bidderId) : 'Участник'}
                        </p>
                        <Badge variant={status.variant} className="text-xs">
                          <StatusIcon className="h-3 w-3 mr-1" />
                          {status.label}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {formatTimeAgo(bid.createdAt)}
                      </p>
                    </div>
                    
                    <div className="text-right">
                      <p className="font-semibold text-lg">
                        {formatCurrency(bid.amount, currency)}
                      </p>
                      {index === 0 && (
                        <p className="text-xs text-green-600 font-medium">
                          Лидирует
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
              
              {!showAllBids && bids.length > 5 && (
                <div className="text-center pt-3">
                  <Button variant="outline" size="sm">
                    Показать все {bids.length} ставок
                  </Button>
                </div>
              )}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
};

export default BidsList;
