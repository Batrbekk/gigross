'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useApi } from '@/hooks/useApi';
import { Mail, ArrowLeft } from 'lucide-react';

interface ForgotPasswordFormProps {
  onSuccess: (email: string) => void;
  onBack: () => void;
}

export function ForgotPasswordForm({ onSuccess, onBack }: ForgotPasswordFormProps) {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const { execute, isLoading } = useApi();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!email.trim()) {
      setError('Введите email адрес');
      return;
    }

    try {
      await execute('/api/auth/send-otp', {
        method: 'POST',
        body: JSON.stringify({
          email: email.trim(),
          type: 'password-reset',
        }),
      });

      setSuccess('Код подтверждения отправлен на ваш email');
      setTimeout(() => {
        onSuccess(email.trim());
      }, 1500);
    } catch (error: any) {
      setError(error.message || 'Ошибка при отправке кода');
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="mx-auto grid w-[350px] gap-6"
    >
      <div className="grid gap-2 text-center">
        <h1 className="text-3xl font-bold text-text-heading">Сброс пароля</h1>
        <p className="text-text-body text-balance">
          Введите ваш email для получения кода сброса пароля
        </p>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert>
          <Mail className="h-4 w-4" />
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleSubmit} className="grid gap-4">
        <div className="grid gap-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            placeholder="m@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            disabled={isLoading}
          />
        </div>

        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? 'Отправка...' : 'Отправить код'}
        </Button>
      </form>

      <div className="text-center">
        <Button variant="link" onClick={onBack} className="text-sm text-accent-primary">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Вернуться к входу
        </Button>
      </div>
    </motion.div>
  );
}
