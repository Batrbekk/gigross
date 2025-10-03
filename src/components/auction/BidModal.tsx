'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { useApi } from '@/hooks/useApi';
import { formatCurrency } from '@/lib/currency';
import { useAuthStore } from '@/stores/authStore';
import { UserRole } from '@/types';
import {
  Gavel,
  AlertCircle,
  CheckCircle,
  Loader2,
  Zap,
  Target,
  DollarSign,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { AuctionTimer } from './AuctionTimer';

interface BidModalProps {
  isOpen: boolean;
  onClose: () => void;
  lotId: string;
  lotTitle: string;
  currentPrice: number;
  currency: string;
  endDate: string | Date;
  onBidPlaced?: (bid: any) => void;
}

interface BidValidation {
  isValid: boolean;
  message: string;
  type: 'success' | 'warning' | 'error';
}

export const BidModal: React.FC<BidModalProps> = ({
  isOpen,
  onClose,
  lotId,
  lotTitle,
  currentPrice,
  currency,
  endDate,
  onBidPlaced,
}) => {
  const { execute } = useApi();
  const { user } = useAuthStore();
  const [bidAmount, setBidAmount] = useState<string>('');
  const [bidMessage, setBidMessage] = useState<string>('');
  const [isPlacingBid, setIsPlacingBid] = useState(false);
  const [validation, setValidation] = useState<BidValidation>({
    isValid: false,
    message: '',
    type: 'warning',
  });
  const [suggestedAmounts, setSuggestedAmounts] = useState<number[]>([]);

  // Вычисляем рекомендуемые суммы ставок
  useEffect(() => {
    const suggestions = [
      currentPrice + Math.max(Math.floor(currentPrice * 0.05), 100), // +5% или +100
      currentPrice + Math.max(Math.floor(currentPrice * 0.1), 200),  // +10% или +200
      currentPrice + Math.max(Math.floor(currentPrice * 0.15), 300), // +15% или +300
      currentPrice + Math.max(Math.floor(currentPrice * 0.25), 500), // +25% или +500
    ];
    setSuggestedAmounts(suggestions);
  }, [currentPrice]);

  // Валидация ставки
  useEffect(() => {
    const amount = parseFloat(bidAmount);
    
    if (!bidAmount || isNaN(amount)) {
      setValidation({
        isValid: false,
        message: 'Введите сумму ставки',
        type: 'warning',
      });
      return;
    }

    if (amount <= currentPrice) {
      setValidation({
        isValid: false,
        message: `Ставка должна быть больше ${formatCurrency(currentPrice, currency)}`,
        type: 'error',
      });
      return;
    }

    if (amount > currentPrice * 10) {
      setValidation({
        isValid: false,
        message: 'Ставка слишком высокая (более 1000% от текущей цены)',
        type: 'warning',
      });
      return;
    }

    const increment = Math.max(Math.floor(currentPrice * 0.05), 100);
    if (amount < currentPrice + increment) {
      setValidation({
        isValid: true,
        message: `Рекомендуемый минимум: ${formatCurrency(currentPrice + increment, currency)}`,
        type: 'warning',
      });
      return;
    }

    setValidation({
      isValid: true,
      message: 'Ставка готова к размещению',
      type: 'success',
    });
  }, [bidAmount, currentPrice, currency]);

  const handlePlaceBid = async () => {
    if (!validation.isValid || isPlacingBid) return;

    // Проверяем роль пользователя
    if (!user?.role || ![UserRole.DISTRIBUTOR, UserRole.INVESTOR].includes(user.role)) {
      setValidation({
        isValid: false,
        message: 'Только дистрибьюторы и инвесторы могут делать ставки',
        type: 'error',
      });
      return;
    }

    const amount = parseFloat(bidAmount);
    
    try {
      setIsPlacingBid(true);
      
      console.log('Starting bid placement:', {
        lotId,
        amount: Number(amount),
        currentPrice,
        message: bidMessage.trim() || undefined,
        userRole: user?.role,
        canBid: user?.role && [UserRole.DISTRIBUTOR, UserRole.INVESTOR].includes(user.role),
      });
      
      const response = await execute('/api/bids', {
        method: 'POST',
        body: JSON.stringify({
          lotId,
          amount: Number(amount), // Убеждаемся, что отправляем число
          message: bidMessage.trim() || undefined,
        }),
      });

      console.log('Bid request data:', {
        lotId,
        amount: Number(amount),
        message: bidMessage.trim() || undefined,
      });
      console.log('Bid response:', response); // Добавляем логирование для отладки

      if (response && response.success) {
        onBidPlaced?.(response.data);
        handleClose();
      } else {
        // Более детальная обработка ошибок
        const errorMessage = response?.error || response?.message || 'Не удалось разместить ставку';
        const errorDetails = (response as any)?.details ? ` Детали: ${JSON.stringify((response as any).details)}` : '';
        throw new Error(errorMessage + errorDetails);
      }
    } catch (error) {
      console.error('Error placing bid:', error);
      
      // Более детальная обработка ошибок
      let errorMessage = 'Ошибка при размещении ставки';
      
      if (error instanceof Error) {
        errorMessage = error.message;
      }
      
      // Специальные случаи ошибок
      if (errorMessage.includes('Validation failed')) {
        errorMessage = 'Проверьте правильность введенных данных';
      } else if (errorMessage.includes('Lot not found')) {
        errorMessage = 'Лот не найден или был удален';
      } else if (errorMessage.includes('Lot is not active')) {
        errorMessage = 'Аукцион уже завершен';
      } else if (errorMessage.includes('Bid amount must be higher')) {
        errorMessage = 'Ставка должна быть выше текущей цены';
      } else if (errorMessage.includes('Cannot bid on your own lot')) {
        errorMessage = 'Нельзя делать ставки на свои лоты';
      }
      
      setValidation({
        isValid: false,
        message: errorMessage,
        type: 'error',
      });
    } finally {
      setIsPlacingBid(false);
    }
  };

  const handleClose = () => {
    setBidAmount('');
    setBidMessage('');
    setValidation({
      isValid: false,
      message: '',
      type: 'warning',
    });
    onClose();
  };

  const handleSuggestedAmount = (amount: number) => {
    setBidAmount(amount.toString());
  };

  const getValidationIcon = () => {
    switch (validation.type) {
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return <AlertCircle className="h-4 w-4 text-yellow-500" />;
    }
  };

  const getValidationClasses = () => {
    switch (validation.type) {
      case 'success':
        return 'border-green-200 bg-green-50';
      case 'error':
        return 'border-red-200 bg-red-50';
      default:
        return 'border-yellow-200 bg-yellow-50';
    }
  };

  const isAuctionActive = new Date(endDate) > new Date();
  const canUserBid = user?.role && [UserRole.DISTRIBUTOR, UserRole.INVESTOR].includes(user.role);

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Gavel className="h-5 w-5 text-primary" />
            Размещение ставки
          </DialogTitle>
          <DialogDescription>
            Лот: <span className="font-medium">{lotTitle}</span>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Информация о лоте */}
          <Card>
            <CardContent className="p-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">Текущая цена:</span>
                  </div>
                  <p className="text-2xl font-bold text-green-600">
                    {formatCurrency(currentPrice, currency)}
                  </p>
                </div>
                
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Target className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">До окончания:</span>
                  </div>
                  <AuctionTimer 
                    endDate={endDate} 
                    variant="compact"
                    showIcon={false}
                    className="text-lg"
                  />
                </div>
              </div>
              
              {!isAuctionActive && (
                <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 text-red-500" />
                    <span className="text-sm text-red-700 font-medium">
                      Аукцион завершен
                    </span>
                  </div>
                </div>
              )}
              
              {user?.role && ![UserRole.DISTRIBUTOR, UserRole.INVESTOR].includes(user.role) && (
                <div className="mt-4 p-3 bg-orange-50 border border-orange-200 rounded-lg">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 text-orange-500" />
                    <span className="text-sm text-orange-700 font-medium">
                      Только дистрибьюторы и инвесторы могут делать ставки
                    </span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Форма ставки */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="bidAmount">Сумма ставки ({currency})</Label>
              <Input
                id="bidAmount"
                type="number"
                value={bidAmount}
                onChange={(e) => setBidAmount(e.target.value)}
                placeholder="Введите сумму"
                className="mt-1"
                disabled={!isAuctionActive || !canUserBid || isPlacingBid}
              />
            </div>

            {/* Рекомендуемые суммы */}
            <div>
              <Label className="text-sm text-muted-foreground mb-2 block">
                Быстрые ставки:
              </Label>
              <div className="flex flex-wrap gap-2">
                {suggestedAmounts.map((amount, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    size="sm"
                    onClick={() => handleSuggestedAmount(amount)}
                    disabled={!isAuctionActive || !canUserBid || isPlacingBid}
                    className="h-8"
                  >
                    <Zap className="h-3 w-3 mr-1" />
                    {formatCurrency(amount, currency)}
                  </Button>
                ))}
              </div>
            </div>

            {/* Валидация */}
            {validation.message && (
              <div className={cn(
                "flex items-center gap-2 p-3 rounded-lg border",
                getValidationClasses()
              )}>
                {getValidationIcon()}
                <span className={cn(
                  "text-sm",
                  validation.type === 'success' && "text-green-700",
                  validation.type === 'error' && "text-red-700",
                  validation.type === 'warning' && "text-yellow-700"
                )}>
                  {validation.message}
                </span>
              </div>
            )}

            {/* Сообщение к ставке */}
            <div>
              <Label htmlFor="bidMessage">Сообщение (необязательно)</Label>
              <Textarea
                id="bidMessage"
                value={bidMessage}
                onChange={(e) => setBidMessage(e.target.value)}
                placeholder="Добавьте комментарий к ставке..."
                className="mt-1"
                rows={3}
                maxLength={200}
                disabled={!isAuctionActive || !canUserBid || isPlacingBid}
              />
              <p className="text-xs text-muted-foreground mt-1">
                {bidMessage.length}/200 символов
              </p>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={isPlacingBid}>
            Отмена
          </Button>
          <Button
            onClick={handlePlaceBid}
            disabled={!validation.isValid || !isAuctionActive || !canUserBid || isPlacingBid}
            className="min-w-[140px]"
          >
            {isPlacingBid ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Размещение...
              </>
            ) : (
              <>
                <Gavel className="h-4 w-4 mr-2" />
                Разместить ставку
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default BidModal;
