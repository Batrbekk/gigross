'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PasswordInput } from '@/components/ui/password-input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAuthStore } from '@/stores/authStore';

interface LoginFormProps {
  onSwitchToRegister: () => void;
  onForgotPassword?: () => void;
  onError?: (error: Error & { data?: unknown }) => void;
}

export function LoginForm({ onSwitchToRegister, onForgotPassword, onError }: LoginFormProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login, isLoading, error, clearError } = useAuthStore();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    
    try {
      await login(email, password);
    } catch (error) {
      onError?.(error as Error & { data?: unknown });
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className='mx-auto grid w-[350px] gap-6'
    >
      <div className='grid gap-2 text-center'>
        <h1 className='text-3xl font-bold text-text-heading'>Вход в аккаунт</h1>
        <p className='text-text-body text-balance'>
          Введите ваш email ниже для входа в аккаунт
        </p>
      </div>

      {error && (
        <Alert variant='destructive'>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleSubmit} className='grid gap-4'>
        <div className='grid gap-2'>
          <Label htmlFor='email' className='text-text-heading'>Email</Label>
          <Input
            id='email'
            type='email'
            placeholder='m@example.com'
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
            disabled={isLoading}
          />
        </div>
        <div className='grid gap-2'>
          <div className='flex items-center'>
            <Label htmlFor='password' className='text-text-heading'>Пароль</Label>
            <Button variant='link' className='ml-auto inline-block text-sm underline text-accent-primary' type='button'>
              Забыли пароль?
            </Button>
          </div>
          <PasswordInput
            id='password'
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
            disabled={isLoading}
          />
        </div>
        <Button type='submit' className='w-full' disabled={isLoading}>
          {isLoading ? 'Вход...' : 'Войти'}
        </Button>
      </form>

      <div className='mt-4 space-y-2 text-center text-sm text-text-body'>
        <div>
          Нет аккаунта?{' '}
          <Button variant='link' className='p-0 underline text-accent-primary' onClick={onSwitchToRegister}>
            Зарегистрироваться
          </Button>
        </div>
        {onForgotPassword && (
          <div>
            <Button variant='link' className='p-0 underline text-xs text-accent-primary' onClick={onForgotPassword}>
              Забыли пароль?
            </Button>
          </div>
        )}
      </div>
    </motion.div>
  );
}
