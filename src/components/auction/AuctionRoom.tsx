'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { useAuction, AuctionBid } from '@/hooks/useAuction';
import { useAuthStore } from '@/stores/authStore';
import { 
  Clock, 
  Gavel, 
  TrendingUp, 
  Users, 
  AlertCircle, 
  CheckCircle,
  Loader2,
  Send
} from 'lucide-react';

interface AuctionRoomProps {
  lotId: string;
  lotTitle: string;
  initialPrice: number;
  currency?: string;
  endTime: Date;
  className?: string;
}

export const AuctionRoom: React.FC<AuctionRoomProps> = ({
  lotId,
  lotTitle,
  initialPrice,
  currency = 'RUB',
  endTime,
  className = '',
}) => {
  const { user } = useAuthStore();
  const [bidAmount, setBidAmount] = useState<string>('');
  const [bidMessage, setBidMessage] = useState<string>('');
  const [isPlacingBid, setIsPlacingBid] = useState(false);

  const {
    auctionState,
    isConnected,
    isLoading,
    error,
    connect,
    placeBid,
    clearError,
  } = useAuction({
    lotId,
    autoConnect: true,
    onBidUpdate: (bid: AuctionBid) => {
      console.log('New bid received:', bid);
      // Можно добавить звуковое уведомление или анимацию
    },
    onAuctionEnd: (winner) => {
      console.log('Auction ended:', winner);
      // Показать результат аукциона
    },
    onError: (error) => {
      console.error('Auction error:', error);
    },
  });

  // Форматирование времени
  const formatTimeRemaining = (ms: number): string => {
    if (ms <= 0) return 'Завершен';
    
    const hours = Math.floor(ms / (1000 * 60 * 60));
    const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((ms % (1000 * 60)) / 1000);
    
    if (hours > 0) {
      return `${hours}ч ${minutes}м ${seconds}с`;
    } else if (minutes > 0) {
      return `${minutes}м ${seconds}с`;
    } else {
      return `${seconds}с`;
    }
  };

  // Форматирование цены
  const formatPrice = (amount: number): string => {
    return new Intl.NumberFormat('ru-RU').format(amount);
  };

  // Обработка размещения ставки
  const handlePlaceBid = async () => {
    if (!bidAmount || isPlacingBid) return;

    const amount = parseFloat(bidAmount);
    if (isNaN(amount) || amount <= auctionState.currentPrice) {
      return;
    }

    try {
      setIsPlacingBid(true);
      await placeBid(amount, bidMessage.trim() || undefined);
      setBidAmount('');
      setBidMessage('');
    } catch (error) {
      console.error('Failed to place bid:', error);
    } finally {
      setIsPlacingBid(false);
    }
  };

  // Предложение следующей ставки
  const suggestNextBid = (): number => {
    const currentPrice = auctionState.currentPrice || initialPrice;
    const increment = Math.max(Math.floor(currentPrice * 0.05), 100); // 5% или минимум 100
    return currentPrice + increment;
  };

  // Статус подключения
  const getConnectionStatus = () => {
    if (isLoading) return { icon: Loader2, text: 'Подключение...', color: 'text-yellow-500' };
    if (isConnected) return { icon: CheckCircle, text: 'Подключен', color: 'text-green-500' };
    return { icon: AlertCircle, text: 'Не подключен', color: 'text-red-500' };
  };

  const connectionStatus = getConnectionStatus();
  const ConnectionIcon = connectionStatus.icon;

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Заголовок аукциона */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Gavel className="h-5 w-5" />
                {lotTitle}
              </CardTitle>
              <CardDescription>Лот #{lotId.slice(-8)}</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <ConnectionIcon className={`h-4 w-4 ${connectionStatus.color} ${isLoading ? 'animate-spin' : ''}`} />
              <span className={`text-sm ${connectionStatus.color}`}>
                {connectionStatus.text}
              </span>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Ошибки */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="flex items-center justify-between">
                {error}
                <Button variant="ghost" size="sm" onClick={clearError}>
                  Закрыть
                </Button>
              </AlertDescription>
            </Alert>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Текущая информация об аукционе */}
        <div className="lg:col-span-2 space-y-4">
          {/* Текущая цена */}
          <Card>
            <CardContent className="pt-6">
              <div className="text-center space-y-2">
                <div className="text-sm text-muted-foreground">Текущая цена</div>
                <motion.div
                  key={auctionState.currentPrice}
                  initial={{ scale: 1.1, color: '#10b981' }}
                  animate={{ scale: 1, color: 'inherit' }}
                  className="text-4xl font-bold"
                >
                  {formatPrice(auctionState.currentPrice || initialPrice)} {currency}
                </motion.div>
                {auctionState.lastBid && (
                  <div className="text-sm text-muted-foreground">
                    Ставка от {auctionState.lastBid.bidderName}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Статистика */}
          <div className="grid grid-cols-3 gap-4">
            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <div className="text-sm text-muted-foreground">Осталось</div>
                    <div className="font-semibold">
                      {formatTimeRemaining(auctionState.timeRemaining)}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <div className="text-sm text-muted-foreground">Ставок</div>
                    <div className="font-semibold">{auctionState.bids.length}</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <div className="text-sm text-muted-foreground">Участников</div>
                    <div className="font-semibold">{auctionState.participants}</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Форма размещения ставки */}
          {isConnected && user && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Сделать ставку</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <div className="flex-1">
                    <Input
                      type="number"
                      placeholder={`Минимум ${formatPrice(suggestNextBid())}`}
                      value={bidAmount}
                      onChange={(e) => setBidAmount(e.target.value)}
                      min={suggestNextBid()}
                      step="100"
                    />
                  </div>
                  <Button
                    onClick={() => setBidAmount(suggestNextBid().toString())}
                    variant="outline"
                    size="sm"
                  >
                    +{formatPrice(suggestNextBid() - (auctionState.currentPrice || initialPrice))}
                  </Button>
                </div>

                <Input
                  placeholder="Комментарий (необязательно)"
                  value={bidMessage}
                  onChange={(e) => setBidMessage(e.target.value)}
                  maxLength={100}
                />

                <Button
                  onClick={handlePlaceBid}
                  disabled={!bidAmount || isPlacingBid || parseFloat(bidAmount) <= (auctionState.currentPrice || initialPrice)}
                  className="w-full"
                >
                  {isPlacingBid ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Размещение ставки...
                    </>
                  ) : (
                    <>
                      <Send className="mr-2 h-4 w-4" />
                      Сделать ставку {bidAmount && `${formatPrice(parseFloat(bidAmount))} ${currency}`}
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          )}
        </div>

        {/* История ставок */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">История ставок</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              <AnimatePresence>
                {auctionState.bids.map((bid, index) => (
                  <motion.div
                    key={bid.bidId}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="flex items-center justify-between p-3 rounded-lg border"
                  >
                    <div>
                      <div className="font-semibold">
                        {formatPrice(bid.amount)} {bid.currency}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {bid.bidderName}
                      </div>
                      {bid.message && (
                        <div className="text-xs text-muted-foreground italic">
                          "{bid.message}"
                        </div>
                      )}
                    </div>
                    <div className="text-right">
                      <Badge variant={index === 0 ? 'default' : 'secondary'}>
                        {index === 0 ? 'Лидер' : `#${index + 1}`}
                      </Badge>
                      <div className="text-xs text-muted-foreground mt-1">
                        {new Date(bid.timestamp).toLocaleTimeString('ru-RU')}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>

              {auctionState.bids.length === 0 && (
                <div className="text-center text-muted-foreground py-8">
                  Ставок пока нет
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
