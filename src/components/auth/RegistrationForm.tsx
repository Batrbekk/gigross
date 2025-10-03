'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PasswordInput } from '@/components/ui/password-input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useAuthStore } from '@/stores/authStore';
import { UserRole } from '@/types';

interface RegistrationFormProps {
  onSwitchToLogin: () => void;
  onSuccess?: (email: string) => void;
}

export function RegistrationForm({ onSwitchToLogin, onSuccess }: RegistrationFormProps) {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [company, setCompany] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState<UserRole>(UserRole.DISTRIBUTOR);
  const [localError, setLocalError] = useState('');
  const { register, isLoading, error, clearError } = useAuthStore();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    setLocalError('');

    if (password !== confirmPassword) {
      setLocalError('Пароли не совпадают');
      return;
    }

    if (password.length < 6) {
      setLocalError('Пароль должен содержать минимум 6 символов');
      return;
    }

    if (!firstName.trim() || !lastName.trim()) {
      setLocalError('Имя и фамилия обязательны');
      return;
    }

    const result = await register({
      email,
      password,
      role,
      profile: {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        company: company.trim() || undefined,
      },
    });

    // Если регистрация успешна, вызываем onSuccess
    if (result && onSuccess) {
      onSuccess(email);
    }
  };

  const displayError = error || localError;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className='mx-auto grid w-[350px] gap-6'
    >
      <div className='grid gap-2 text-center'>
        <h1 className='text-3xl font-bold text-text-heading'>Создать аккаунт</h1>
        <p className='text-text-body text-balance'>
          Введите ваши данные ниже для создания аккаунта
        </p>
      </div>

      {displayError && (
        <Alert variant='destructive'>
          <AlertDescription>{displayError}</AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleSubmit} className='grid gap-4'>
        <div className='grid grid-cols-2 gap-2'>
          <div className='grid gap-2'>
            <Label htmlFor='firstName'>Имя</Label>
            <Input
              id='firstName'
              type='text'
              placeholder='Иван'
              value={firstName}
              onChange={e => setFirstName(e.target.value)}
              required
              disabled={isLoading}
            />
          </div>
          <div className='grid gap-2'>
            <Label htmlFor='lastName'>Фамилия</Label>
            <Input
              id='lastName'
              type='text'
              placeholder='Иванов'
              value={lastName}
              onChange={e => setLastName(e.target.value)}
              required
              disabled={isLoading}
            />
          </div>
        </div>
        <div className='grid gap-2'>
          <Label htmlFor='company'>Компания (необязательно)</Label>
          <Input
            id='company'
            type='text'
            placeholder='ООО "Пример"'
            value={company}
            onChange={e => setCompany(e.target.value)}
            disabled={isLoading}
          />
        </div>
        <div className='grid gap-2'>
          <Label htmlFor='role'>Роль</Label>
          <Select
            value={role}
            onValueChange={(value: UserRole) => setRole(value)}
            disabled={isLoading}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder='Выберите роль' />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={UserRole.PRODUCER}>Производитель</SelectItem>
              <SelectItem value={UserRole.DISTRIBUTOR}>Дистрибьютор</SelectItem>
              <SelectItem value={UserRole.INVESTOR}>Инвестор</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className='grid gap-2'>
          <Label htmlFor='email'>Email</Label>
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
          <Label htmlFor='password'>Пароль</Label>
          <PasswordInput
            id='password'
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
            disabled={isLoading}
            minLength={6}
          />
        </div>
        <div className='grid gap-2'>
          <Label htmlFor='confirmPassword'>Подтвердите пароль</Label>
          <PasswordInput
            id='confirmPassword'
            value={confirmPassword}
            onChange={e => setConfirmPassword(e.target.value)}
            required
            disabled={isLoading}
            minLength={6}
          />
        </div>
        <Button type='submit' className='w-full' disabled={isLoading}>
          {isLoading ? 'Создание аккаунта...' : 'Создать аккаунт'}
        </Button>
      </form>

      <div className='mt-4 text-center text-sm text-text-body'>
        Уже есть аккаунт?{' '}
        <Button variant='link' className='p-0 underline text-accent-primary' onClick={onSwitchToLogin}>
          Войти
        </Button>
      </div>
    </motion.div>
  );
}
