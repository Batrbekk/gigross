'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { PasswordInput } from '@/components/ui/password-input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AvatarUpload } from '@/components/ui/avatar-upload';
import { useAuthStore } from '@/stores/authStore';
import { useApi } from '@/hooks/useApi';
import { UserRole } from '@/types';
import { getAllCurrencies } from '@/lib/currency';
import { 
  MapPin, 
  Edit, 
  Save, 
  X,
  Shield,
  Bell,
  Globe,
  CreditCard,
  Clock,
  RefreshCw,
} from 'lucide-react';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from '@/components/ui/input-otp';

export default function ProfilePage() {
  const { user, logout, updateAvatar, fetchProfile } = useAuthStore();
  const { execute, isLoading } = useApi();
  const [isEditing, setIsEditing] = useState(true);
  
  // Состояние для смены пароля
  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false);
  const [passwordStep, setPasswordStep] = useState<'send-code' | 'verify-code' | 'new-password'>('send-code');
  const [verificationCode, setVerificationCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [codeTimer, setCodeTimer] = useState(0);
  const [passwordError, setPasswordError] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [avatarUrl, setAvatarUrl] = useState(user?.profile?.avatar || '');
  const [formData, setFormData] = useState({
    firstName: user?.profile?.firstName || '',
    lastName: user?.profile?.lastName || '',
    company: user?.profile?.company || '',
    phone: user?.profile?.phone || '',
    address: {
      street: user?.profile?.address?.street || '',
      city: user?.profile?.address?.city || '',
      state: user?.profile?.address?.state || '',
      country: user?.profile?.address?.country || '',
      postalCode: user?.profile?.address?.postalCode || '',
      zipCode: user?.profile?.address?.zipCode || '',
    },
    preferences: {
      notifications: user?.preferences?.notifications ?? true,
      language: user?.preferences?.language || 'ru',
      currency: user?.preferences?.currency || 'KZT',
    },
  });

  // Загружаем профиль при монтировании компонента
  useEffect(() => {
    const loadProfile = async () => {
      try {
        await fetchProfile();
      } catch {
        // Ошибка загрузки профиля - можно добавить уведомление пользователю
      }
    };

    loadProfile();
  }, [fetchProfile]);

  // Обновляем локальное состояние при изменении user из store
  useEffect(() => {
    if (user) {
      setAvatarUrl(user.profile?.avatar || '');
      setFormData({
        firstName: user.profile?.firstName || '',
        lastName: user.profile?.lastName || '',
        company: user.profile?.company || '',
        phone: user.profile?.phone || '',
        address: {
          street: user.profile?.address?.street || '',
          city: user.profile?.address?.city || '',
          state: user.profile?.address?.state || '',
          country: user.profile?.address?.country || '',
          postalCode: user.profile?.address?.postalCode || '',
          zipCode: user.profile?.address?.zipCode || '',
        },
        preferences: {
          notifications: user.preferences?.notifications ?? true,
          language: user.preferences?.language || 'ru',
          currency: user.preferences?.currency || 'KZT',
        },
      });
    }
  }, [user]);

  const handleInputChange = (field: string, value: string | boolean) => {
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...(prev[parent as keyof typeof prev] as Record<string, unknown>),
          [child]: value,
        },
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [field]: value,
      }));
    }
  };

  const handleAvatarUploadSuccess = async (url: string, key: string) => {
    setAvatarUrl(url);
    
    // Обновляем аватарку в store (для header и sidebar)
    updateAvatar(url);
    
    // Получаем текущий avatarKey для удаления старой аватарки
    const currentAvatarKey = user?.profile?.avatarKey;
    
    // Обновляем профиль пользователя с новой аватаркой
    try {
      await execute('/api/users/profile', {
        method: 'PUT',
        body: JSON.stringify({
          avatar: url,
          avatarKey: key,
          // Передаем старый ключ для удаления из S3
          oldAvatarKey: currentAvatarKey,
        }),
      });
    } catch {
      // Ошибка обновления аватарки - можно добавить уведомление пользователю
    }
  };

  const handleAvatarUploadError = (_error: string) => {
    // Ошибка загрузки аватарки - можно добавить уведомление пользователю
  };

  const handleRemoveAvatar = async () => {
    setAvatarUrl('');
    
    // Обновляем аватарку в store (для header и sidebar)
    updateAvatar('');
    
    // Получаем текущий avatarKey для удаления из S3
    const currentAvatarKey = user?.profile?.avatarKey;
    
    // Удаляем аватарку из профиля
    try {
      await execute('/api/users/profile', {
        method: 'PUT',
        body: JSON.stringify({
          avatar: '',
          avatarKey: '',
          // Передаем старый ключ для удаления из S3
          oldAvatarKey: currentAvatarKey,
        }),
      });
    } catch {
      // Ошибка удаления аватарки - можно добавить уведомление пользователю
    }
  };

  const handleSave = async () => {
    try {
      const response = await execute('/api/users/profile', {
        method: 'PUT',
        body: JSON.stringify({
          profile: {
            firstName: formData.firstName,
            lastName: formData.lastName,
            company: formData.company,
            ...(formData.phone && { phone: formData.phone }),
            ...(Object.values(formData.address).some(value => value.trim()) && { address: formData.address }),
          },
          preferences: formData.preferences,
        }),
      });

      if (response?.success) {
        // Обновляем профиль из API
        window.location.reload();  
        setIsEditing(false);
      }
    } catch {
      // Обработка ошибки обновления профиля
    }
  };

  const handleCancel = () => {
    setFormData({
      firstName: user?.profile?.firstName || '',
      lastName: user?.profile?.lastName || '',
      company: user?.profile?.company || '',
      phone: user?.profile?.phone || '',
      address: {
        street: user?.profile?.address?.street || '',
        city: user?.profile?.address?.city || '',
        state: user?.profile?.address?.state || '',
        country: user?.profile?.address?.country || '',
        postalCode: user?.profile?.address?.postalCode || '',
        zipCode: user?.profile?.address?.zipCode || '',
      },
      preferences: {
        notifications: user?.preferences?.notifications ?? true,
        language: user?.preferences?.language || 'ru',
        currency: user?.preferences?.currency || 'KZT',
      },
    });
    setIsEditing(false);
  };

  // Функции для смены пароля
  const handleSendCode = async () => {
    try {
      setPasswordError('');
      const response = await execute('/api/auth/send-otp', {
        method: 'POST',
        body: JSON.stringify({ 
          email: user?.email,
          type: 'password-reset'
        }),
      });

      if (response?.success) {
        setPasswordStep('verify-code');
        setCodeTimer(60); // 60 секунд таймера
        
        // Запускаем таймер
        const timer = setInterval(() => {
          setCodeTimer(prev => {
            if (prev <= 1) {
              clearInterval(timer);
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
      } else {
        setPasswordError('Не удалось отправить код. Попробуйте еще раз.');
      }
    } catch {
      setPasswordError('Произошла ошибка при отправке кода.');
    }
  };

  const handleResendCode = async () => {
    await handleSendCode();
  };

  const handleVerifyCode = async () => {
    try {
      setPasswordError('');
      const response = await execute('/api/auth/verify-otp', {
        method: 'POST',
        body: JSON.stringify({ 
          email: user?.email,
          code: verificationCode,
          type: 'password-reset'
        }),
      });

      if (response?.success) {
        setResetToken((response.data as { resetToken: string }).resetToken);
        setPasswordStep('new-password');
      } else {
        setPasswordError('Неверный код подтверждения.');
      }
    } catch {
      setPasswordError('Произошла ошибка при подтверждении кода.');
    }
  };

  const handleChangePassword = async () => {
    if (newPassword !== confirmPassword) {
      setPasswordError('Пароли не совпадают.');
      return;
    }

    if (newPassword.length < 6) {
      setPasswordError('Пароль должен содержать минимум 6 символов.');
      return;
    }

    try {
      setPasswordError('');
      const response = await execute('/api/auth/reset-password', {
        method: 'POST',
        body: JSON.stringify({ 
          resetToken: resetToken,
          newPassword
        }),
      });

      if (response?.success) {
        // Закрываем диалог и делаем logout
        setIsPasswordDialogOpen(false);
        await logout();
        window.location.href = '/';
      } else {
        setPasswordError('Не удалось изменить пароль.');
      }
    } catch {
      setPasswordError('Произошла ошибка при смене пароля.');
    }
  };

  const resetPasswordDialog = () => {
    setIsPasswordDialogOpen(false);
    setPasswordStep('send-code');
    setVerificationCode('');
    setNewPassword('');
    setConfirmPassword('');
    setCodeTimer(0);
    setPasswordError('');
    setResetToken('');
  };

  // const getInitials = (firstName?: string, lastName?: string, email?: string) => {
  //   if (firstName && lastName) {
  //     return `${firstName[0]}${lastName[0]}`.toUpperCase();
  //   }
  //   if (email) {
  //     return email.substring(0, 2).toUpperCase();
  //   }
  //   return 'U';
  // };

  const getRoleDisplayName = (role: string) => {
    const roleNames = {
      [UserRole.ADMIN]: 'Администратор',
      [UserRole.PRODUCER]: 'Производитель',
      [UserRole.DISTRIBUTOR]: 'Дистрибьютор',
      [UserRole.INVESTOR]: 'Инвестор',
    };
    return roleNames[role as UserRole] || role;
  };

  const getRoleBadgeVariant = (role: string) => {
    const variants = {
      [UserRole.ADMIN]: 'destructive' as const,
      [UserRole.PRODUCER]: 'default' as const,
      [UserRole.DISTRIBUTOR]: 'secondary' as const,
      [UserRole.INVESTOR]: 'outline' as const,
    };
    return variants[role as UserRole] || 'outline' as const;
  };

  if (!user) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
          <p className="mt-2 text-sm text-muted-foreground">Загрузка профиля...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Заголовок */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Профиль</h1>
          <p className="text-muted-foreground">
            Управляйте своей учетной записью и настройками
          </p>
        </div>
        <div className="flex items-center gap-2">
          {isEditing ? (
            <>
              <Button variant="outline" onClick={handleCancel}>
                <X className="mr-2 h-4 w-4" />
                Отмена
              </Button>
              <Button onClick={handleSave} disabled={isLoading}>
                <Save className="mr-2 h-4 w-4" />
                Сохранить
              </Button>
            </>
          ) : (
            <Button onClick={() => setIsEditing(true)}>
              <Edit className="mr-2 h-4 w-4" />
              Редактировать
            </Button>
          )}
        </div>
      </div>

      <Tabs defaultValue="general" className="space-y-4">
        <TabsList>
          <TabsTrigger value="general">Общие</TabsTrigger>
          <TabsTrigger value="security">Безопасность</TabsTrigger>
          <TabsTrigger value="preferences">Настройки</TabsTrigger>
          <TabsTrigger value="billing">Платежи</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-4">
          <div className="grid gap-6 md:grid-cols-3">
            {/* Аватар и основная информация */}
            <Card>
              <CardHeader>
                <CardTitle>Фото профиля</CardTitle>
                <CardDescription>
                  Загрузите свое фото для отображения в системе
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col items-center space-y-4">
                <AvatarUpload
                  currentAvatar={avatarUrl}
                  onUploadSuccess={handleAvatarUploadSuccess}
                  onUploadError={handleAvatarUploadError}
                  onRemoveAvatar={handleRemoveAvatar}
                  userId={user._id}
                  disabled={!isEditing}
                />
                <div className="text-center">
                  <Badge variant={getRoleBadgeVariant(user.role)} className="mb-2">
                    {getRoleDisplayName(user.role)}
                  </Badge>
                  <p className="text-sm text-muted-foreground">
                    Участник с {new Date(user.createdAt).toLocaleDateString('ru-RU')}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Личная информация */}
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle>Личная информация</CardTitle>
                <CardDescription>
                  Основные данные вашего профиля
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">Имя</Label>
                    <Input
                      id="firstName"
                      value={formData.firstName}
                      onChange={(e) => handleInputChange('firstName', e.target.value)}
                      disabled={!isEditing}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Фамилия</Label>
                    <Input
                      id="lastName"
                      value={formData.lastName}
                      onChange={(e) => handleInputChange('lastName', e.target.value)}
                      disabled={!isEditing}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={user.email}
                    disabled
                    className="bg-muted"
                  />
                  <p className="text-xs text-muted-foreground">
                    Email нельзя изменить. Обратитесь в поддержку для смены email.
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="company">Компания</Label>
                  <Input
                    id="company"
                    value={formData.company}
                    onChange={(e) => handleInputChange('company', e.target.value)}
                    disabled={!isEditing}
                    placeholder="ТОО «Ваша компания»"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Телефон (необязательно)</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    disabled={!isEditing}
                    placeholder="+7 (777) 123-45-67"
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Адрес */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Адрес (необязательно)
              </CardTitle>
              <CardDescription>
                Ваш рабочий адрес для доставки и документооборота
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="street">Улица и дом</Label>
                  <Input
                    id="street"
                    value={formData.address.street}
                    onChange={(e) => handleInputChange('address.street', e.target.value)}
                    disabled={!isEditing}
                    placeholder="пр. Абая, д. 123"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="city">Город</Label>
                  <Input
                    id="city"
                    value={formData.address.city}
                    onChange={(e) => handleInputChange('address.city', e.target.value)}
                    disabled={!isEditing}
                    placeholder="Алматы"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="state">Регион/Область</Label>
                  <Input
                    id="state"
                    value={formData.address.state}
                    onChange={(e) => handleInputChange('address.state', e.target.value)}
                    disabled={!isEditing}
                    placeholder="Алматинская область"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="country">Страна</Label>
                  <Input
                    id="country"
                    value={formData.address.country}
                    onChange={(e) => handleInputChange('address.country', e.target.value)}
                    disabled={!isEditing}
                    placeholder="Казахстан"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="postalCode">Почтовый индекс</Label>
                  <Input
                    id="postalCode"
                    value={formData.address.postalCode}
                    onChange={(e) => handleInputChange('address.postalCode', e.target.value)}
                    disabled={!isEditing}
                    placeholder="050000"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="zipCode">ZIP код</Label>
                  <Input
                    id="zipCode"
                    value={formData.address.zipCode}
                    onChange={(e) => handleInputChange('address.zipCode', e.target.value)}
                    disabled={!isEditing}
                    placeholder="050000"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Безопасность аккаунта
              </CardTitle>
              <CardDescription>
                Управляйте паролем и настройками безопасности
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <h4 className="font-medium">Пароль</h4>
                  <p className="text-sm text-muted-foreground">
                    Последнее изменение: {new Date(user.updatedAt).toLocaleDateString('ru-RU')}
                  </p>
                </div>
                <Dialog open={isPasswordDialogOpen} onOpenChange={setIsPasswordDialogOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline">
                      Изменить пароль
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                      <DialogTitle>Изменение пароля</DialogTitle>
                      <DialogDescription>
                        {passwordStep === 'send-code' && 'Отправьте код подтверждения на вашу почту для смены пароля'}
                        {passwordStep === 'verify-code' && 'Введите 6-значный код подтверждения, отправленный на вашу почту'}
                        {passwordStep === 'new-password' && 'Введите новый пароль'}
                      </DialogDescription>
                    </DialogHeader>
                    
                    <div className="space-y-4">
                      {/* Шаг 1: Отправка кода */}
                      {passwordStep === 'send-code' && (
                        <div className="space-y-4">
                          <div className="text-center py-4">
                            <Shield className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                            <p className="text-sm text-muted-foreground">
                              Код подтверждения будет отправлен на {user?.email}
                            </p>
                          </div>
                        </div>
                      )}

                      {/* Шаг 2: Подтверждение кода */}
                      {passwordStep === 'verify-code' && (
                        <div className="space-y-4">
                          <div className="space-y-2">
                            <Label htmlFor="verificationCode">Код подтверждения</Label>
                            <div className="flex justify-center">
                              <InputOTP
                                maxLength={6}
                                value={verificationCode}
                                onChange={(value) => setVerificationCode(value)}
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
                            </div>
                          </div>
                          <div className="text-center">
                            {codeTimer > 0 ? (
                              <p className="text-sm text-muted-foreground flex items-center justify-center gap-1">
                                <Clock className="h-4 w-4" />
                                Повторная отправка через {codeTimer} сек
                              </p>
                            ) : (
                              <Button
                                variant="link"
                                size="sm"
                                onClick={handleResendCode}
                                className="text-primary"
                              >
                                <RefreshCw className="h-4 w-4 mr-1" />
                                Отправить код повторно
                              </Button>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Шаг 3: Новый пароль */}
                      {passwordStep === 'new-password' && (
                        <div className="space-y-4">
                          <div className="space-y-2">
                            <Label htmlFor="newPassword">Новый пароль</Label>
                            <PasswordInput
                              id="newPassword"
                              placeholder="Введите новый пароль"
                              value={newPassword}
                              onChange={(e) => setNewPassword(e.target.value)}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="confirmPassword">Подтвердите пароль</Label>
                            <PasswordInput
                              id="confirmPassword"
                              placeholder="Подтвердите новый пароль"
                              value={confirmPassword}
                              onChange={(e) => setConfirmPassword(e.target.value)}
                            />
                          </div>
                        </div>
                      )}

                      {/* Ошибки */}
                      {passwordError && (
                        <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-md">
                          {passwordError}
                        </div>
                      )}
                    </div>

                    <DialogFooter>
                      <Button variant="outline" onClick={resetPasswordDialog}>
                        Отмена
                      </Button>
                      {passwordStep === 'send-code' && (
                        <Button onClick={handleSendCode} disabled={isLoading}>
                          Отправить код
                        </Button>
                      )}
                      {passwordStep === 'verify-code' && (
                        <Button 
                          onClick={handleVerifyCode} 
                          disabled={isLoading || verificationCode.length !== 6}
                        >
                          Подтвердить
                        </Button>
                      )}
                      {passwordStep === 'new-password' && (
                        <Button 
                          onClick={handleChangePassword} 
                          disabled={isLoading || !newPassword || !confirmPassword}
                        >
                          Изменить пароль
                        </Button>
                      )}
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>

              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <h4 className="font-medium">Двухфакторная аутентификация</h4>
                  <p className="text-sm text-muted-foreground">
                    Дополнительная защита вашего аккаунта
                  </p>
                </div>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="outline">
                      Настроить 2FA
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Функция в разработке</AlertDialogTitle>
                      <AlertDialogDescription>
                        Двухфакторная аутентификация будет доступна в следующих версиях приложения.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Понятно</AlertDialogCancel>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>

              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <h4 className="font-medium">Активные сессии</h4>
                  <p className="text-sm text-muted-foreground">
                    Управляйте устройствами, с которых выполнен вход
                  </p>
                </div>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="outline">
                      Просмотреть сессии
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Функция в разработке</AlertDialogTitle>
                      <AlertDialogDescription>
                        Управление активными сессиями будет доступно в следующих версиях приложения.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Понятно</AlertDialogCancel>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="preferences" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Уведомления
              </CardTitle>
              <CardDescription>
                Настройте, какие уведомления вы хотите получать
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="notifications">Email уведомления</Label>
                  <p className="text-sm text-muted-foreground">
                    Получать уведомления о важных событиях на email
                  </p>
                </div>
                <Switch
                  id="notifications"
                  checked={formData.preferences.notifications}
                  onCheckedChange={(checked) => 
                    handleInputChange('preferences.notifications', checked.toString())
                  }
                  disabled={!isEditing}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5" />
                Региональные настройки
              </CardTitle>
              <CardDescription>
                Язык интерфейса и валюта по умолчанию
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="language">Язык</Label>
                  <Select
                    value={formData.preferences.language}
                    onValueChange={(value) => handleInputChange('preferences.language', value)}
                    disabled={!isEditing}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ru">Русский</SelectItem>
                      <SelectItem value="en">English</SelectItem>
                      <SelectItem value="kz">Қазақша</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="currency">Валюта</Label>
                  <Select
                    value={formData.preferences.currency}
                    onValueChange={(value) => handleInputChange('preferences.currency', value)}
                    disabled={!isEditing}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {getAllCurrencies().map((currency) => (
                        <SelectItem key={currency.code} value={currency.code}>
                          {currency.symbol} {currency.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="billing" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Платежная информация
              </CardTitle>
              <CardDescription>
                Управляйте способами оплаты и счетами
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <CreditCard className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Платежные методы</h3>
                <p className="text-muted-foreground mb-4">
                  Добавьте способы оплаты для удобных расчетов
                </p>
                <Button>
                  Добавить способ оплаты
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
