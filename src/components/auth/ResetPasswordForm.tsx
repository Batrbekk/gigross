'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { PasswordInput } from '@/components/ui/password-input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useApi } from '@/hooks/useApi';
import { CheckCircle } from 'lucide-react';

interface ResetPasswordFormProps {
  resetToken: string;
  onSuccess: () => void;
}

export function ResetPasswordForm({ resetToken, onSuccess }: ResetPasswordFormProps) {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const { execute, isLoading } = useApi();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (newPassword !== confirmPassword) {
      setError('Пароли не совпадают');
      return;
    }

    if (newPassword.length < 8) {
      setError('Пароль должен содержать минимум 8 символов');
      return;
    }

    try {
      await execute('/api/auth/reset-password', {
        method: 'POST',
        body: JSON.stringify({
          resetToken,
          newPassword,
        }),
      });

      setSuccess('Пароль успешно изменен');
      setTimeout(() => {
        onSuccess();
      }, 2000);
    } catch (error: any) {
      setError(error.message || 'Ошибка при смене пароля');
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
        <h1 className="text-3xl font-bold">Новый пароль</h1>
        <p className="text-muted-foreground text-balance">
          Введите новый пароль для вашего аккаунта
        </p>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert>
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleSubmit} className="grid gap-4">
        <div className="grid gap-2">
          <Label htmlFor="newPassword">Новый пароль</Label>
          <PasswordInput
            id="newPassword"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
            disabled={isLoading}
            minLength={8}
            placeholder="Минимум 8 символов"
          />
        </div>

        <div className="grid gap-2">
          <Label htmlFor="confirmPassword">Подтвердите пароль</Label>
          <PasswordInput
            id="confirmPassword"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            disabled={isLoading}
            minLength={8}
            placeholder="Повторите пароль"
          />
        </div>

        <Button type="submit" className="w-full" disabled={isLoading || success !== ''}>
          {isLoading ? 'Сохранение...' : 'Сохранить пароль'}
        </Button>
      </form>
    </motion.div>
  );
}
