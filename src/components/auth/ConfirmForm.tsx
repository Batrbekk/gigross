'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { useApi } from '@/hooks/useApi';
import { useAuthStore } from '@/stores/authStore';
import { Mail, Timer, RefreshCw } from 'lucide-react';

interface ConfirmFormProps {
  email: string;
  type: 'registration' | 'password-reset';
  onSuccess?: (data?: unknown) => void;
  onBack?: () => void;
}

export function ConfirmForm({ email, type, onSuccess, onBack }: ConfirmFormProps) {
  const [otp, setOtp] = useState('');
  const [timeLeft, setTimeLeft] = useState(600); // 10 минут в секундах
  const [canResend, setCanResend] = useState(false);
  const { execute, isLoading } = useApi();
  const { setUser, setTokens } = useAuthStore();
  const [error, setError] = useState('');
  const [isResending, setIsResending] = useState(false);
  const router = useRouter();

  // Таймер обратного отсчета
  useEffect(() => {
    if (timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      setCanResend(true);
    }
  }, [timeLeft]);

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const handleVerifyOTP = async () => {
    if (otp.length !== 6) {
      setError('Введите 6-значный код');
      return;
    }

    setError('');

    try {
      const response = await execute('/api/auth/verify-otp', {
        method: 'POST',
        body: JSON.stringify({
          email,
          code: otp,
          type,
        }),
      });

      if (response && response.success) {
        if (type === 'registration') {
          // Для регистрации - автоматически авторизуем пользователя
          const data = response.data as { user: Record<string, unknown>; accessToken: string };
          const userData = {
            ...data.user,
            userId: data.user.id
          };
          
          const tokens = {
            accessToken: data.accessToken,
            refreshToken: '', // Refresh token в httpOnly cookie
          };
          
          // Сохраняем данные в store
          setUser(userData as any); // Временное решение для типизации
          setTokens(tokens);
          
          // Используем Next.js router для навигации без перезагрузки страницы
          router.push('/');
        } else if (type === 'password-reset') {
          // Для сброса пароля - переходим к форме смены пароля
          onSuccess?.(response.data);
        }
      }
    } catch (error) {
      setError((error as Error).message || 'Неверный код подтверждения');
    }
  };

  const handleResendOTP = async () => {
    setIsResending(true);
    setError('');

    try {
      await execute('/api/auth/send-otp', {
        method: 'POST',
        body: JSON.stringify({
          email,
          type,
        }),
      });

      setTimeLeft(600); // Сбрасываем таймер
      setCanResend(false);
      setOtp(''); // Очищаем поле ввода
    } catch (error) {
      setError((error as Error).message || 'Ошибка при отправке кода');
    } finally {
      setIsResending(false);
    }
  };

  const getTitle = () => {
    return type === 'registration' 
      ? 'Подтвердите email'
      : 'Подтверждение сброса пароля';
  };

  const getDescription = () => {
    return type === 'registration'
      ? 'Мы отправили код подтверждения на ваш email'
      : 'Введите код из письма для сброса пароля';
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="mx-auto grid w-[400px] gap-6"
    >
      <div className="grid gap-2 text-center">
        <h1 className="text-3xl font-bold">{getTitle()}</h1>
        <p className="text-muted-foreground text-balance">
          {getDescription()}
        </p>
        <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground mt-2">
          <Mail className="h-4 w-4" />
          <span>{email}</span>
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="grid gap-6">
        <div className="grid gap-4">
          <div className="flex flex-col items-center gap-4">
            <InputOTP
              maxLength={6}
              value={otp}
              onChange={(value) => setOtp(value)}
              disabled={isLoading}
            >
              <InputOTPGroup>
                <InputOTPSlot index={0} />
                <InputOTPSlot index={1} />
                <InputOTPSlot index={2} />
                <InputOTPSlot index={3} />
                <InputOTPSlot index={4} />
                <InputOTPSlot index={5} />
              </InputOTPGroup>
            </InputOTP>

            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Timer className="h-4 w-4" />
              <span>
                {timeLeft > 0 
                  ? `Код действителен: ${formatTime(timeLeft)}`
                  : 'Код истек'
                }
              </span>
            </div>
          </div>

          <Button 
            onClick={handleVerifyOTP} 
            disabled={isLoading || otp.length !== 6}
            className="w-full"
            size="lg"
          >
            {isLoading ? 'Проверка...' : 'Подтвердить'}
          </Button>
        </div>

        <div className="grid gap-2">
          <div className="text-center text-sm text-muted-foreground">
            Не получили код?
          </div>
          <Button
            variant="outline"
            onClick={handleResendOTP}
            disabled={!canResend || isResending}
            className="w-full"
          >
            {isResending ? (
              <>
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                Отправка...
              </>
            ) : (
              'Отправить повторно'
            )}
          </Button>
        </div>

        {onBack && (
          <div className="text-center">
            <Button variant="link" onClick={onBack} className="text-sm">
              Вернуться назад
            </Button>
          </div>
        )}
      </div>
    </motion.div>
  );
}
