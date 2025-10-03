'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useApi } from '@/hooks/useApi';
import { UserRole } from '@/types';
import { 
  Users, 
  UserPlus, 
  Trash2, 
  CheckCircle, 
  XCircle, 
  RefreshCw,
  Mail,
  Phone,
  Building
} from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface TestUser {
  _id: string;
  email: string;
  role: UserRole;
  profile: {
    firstName: string;
    lastName: string;
    phone: string;
    company: string;
    position: string;
  };
  isVerified: boolean;
  isActive: boolean;
  createdAt: string;
}

export default function TestUsersPage() {
  const { execute, isLoading } = useApi();
  const [testUsers, setTestUsers] = useState<TestUser[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetchTestUsers = async () => {
    try {
      const response = await execute('/api/admin/test-users', { method: 'GET' });
      if (response && response.success) {
        setTestUsers(response.data as TestUser[]);
      }
    } catch (error) {
      console.error('Error fetching test users:', error);
      setMessage({ type: 'error', text: 'Ошибка загрузки тестовых пользователей' });
    }
  };

  const createTestUsers = async () => {
    setIsCreating(true);
    setMessage(null);
    
    try {
      const response = await execute('/api/admin/test-users', { method: 'POST' });
      if (response && response.success) {
        setMessage({ 
          type: 'success', 
          text: `Создано ${(response.data as any).successful} из ${(response.data as any).total} тестовых пользователей` 
        });
        fetchTestUsers();
      } else {
        setMessage({ type: 'error', text: response?.error || 'Ошибка создания тестовых пользователей' });
      }
    } catch (error) {
      console.error('Error creating test users:', error);
      setMessage({ type: 'error', text: 'Ошибка создания тестовых пользователей' });
    } finally {
      setIsCreating(false);
    }
  };

  const deleteTestUsers = async () => {
    setIsDeleting(true);
    setMessage(null);
    
    try {
      const response = await execute('/api/admin/test-users/cleanup', { method: 'DELETE' });
      if (response && response.success) {
        setMessage({ 
          type: 'success', 
          text: `Удалено ${(response.data as any).deletedCount} тестовых пользователей` 
        });
        fetchTestUsers();
      } else {
        setMessage({ type: 'error', text: response?.error || 'Ошибка удаления тестовых пользователей' });
      }
    } catch (error) {
      console.error('Error deleting test users:', error);
      setMessage({ type: 'error', text: 'Ошибка удаления тестовых пользователей' });
    } finally {
      setIsDeleting(false);
    }
  };

  useEffect(() => {
    fetchTestUsers();
  }, []);

  const getRoleBadge = (role: UserRole) => {
    const roleConfig = {
      [UserRole.PRODUCER]: { label: 'Производитель', variant: 'default' as const },
      [UserRole.DISTRIBUTOR]: { label: 'Дистрибьютор', variant: 'secondary' as const },
      [UserRole.INVESTOR]: { label: 'Инвестор', variant: 'outline' as const },
      [UserRole.ADMIN]: { label: 'Администратор', variant: 'destructive' as const },
    };
    
    const config = roleConfig[role];
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const getStatusIcon = (isVerified: boolean, isActive: boolean) => {
    if (isVerified && isActive) {
      return <CheckCircle className="h-4 w-4 text-green-500" />;
    }
    return <XCircle className="h-4 w-4 text-red-500" />;
  };

  return (
    <div className="space-y-6">
      {/* Заголовок */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Тестовые пользователи</h1>
        <p className="text-muted-foreground">
          Управление тестовыми аккаунтами для всех ролей системы
        </p>
      </div>

      {/* Сообщения */}
      {message && (
        <Alert variant={message.type === 'error' ? 'destructive' : 'default'}>
          <AlertDescription>{message.text}</AlertDescription>
        </Alert>
      )}

      {/* Действия */}
      <div className="flex gap-4">
        <Button 
          onClick={createTestUsers} 
          disabled={isCreating}
          className="flex items-center gap-2"
        >
          <UserPlus className="h-4 w-4" />
          {isCreating ? 'Создание...' : 'Создать тестовых пользователей'}
        </Button>
        
        <Button 
          onClick={deleteTestUsers} 
          disabled={isDeleting}
          variant="destructive"
          className="flex items-center gap-2"
        >
          <Trash2 className="h-4 w-4" />
          {isDeleting ? 'Удаление...' : 'Удалить всех тестовых пользователей'}
        </Button>
        
        <Button 
          onClick={fetchTestUsers} 
          disabled={isLoading}
          variant="outline"
          className="flex items-center gap-2"
        >
          <RefreshCw className="h-4 w-4" />
          Обновить
        </Button>
      </div>

      {/* Список тестовых пользователей */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, index) => (
            <Card key={index}>
              <CardHeader>
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-24" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-4 w-3/4" />
              </CardContent>
            </Card>
          ))
        ) : testUsers.length > 0 ? (
          testUsers.map((user) => (
            <Card key={user._id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">
                    {user.profile.firstName} {user.profile.lastName}
                  </CardTitle>
                  {getStatusIcon(user.isVerified, user.isActive)}
                </div>
                <CardDescription className="flex items-center gap-2">
                  <Mail className="h-3 w-3" />
                  {user.email}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  {getRoleBadge(user.role)}
                  <span className="text-xs text-muted-foreground">
                    {new Date(user.createdAt).toLocaleDateString('ru-RU')}
                  </span>
                </div>
                
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <Phone className="h-3 w-3 text-muted-foreground" />
                    <span>{user.profile.phone}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Building className="h-3 w-3 text-muted-foreground" />
                    <span className="truncate">{user.profile.company}</span>
                  </div>
                </div>
                
                <div className="pt-2 border-t">
                  <div className="text-xs text-muted-foreground">
                    Пароль: <code className="bg-muted px-1 rounded">password123</code>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <div className="col-span-full">
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-8">
                <Users className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">Тестовые пользователи не найдены</h3>
                <p className="text-muted-foreground text-center mb-4">
                  Создайте тестовых пользователей для всех ролей системы
                </p>
                <Button onClick={createTestUsers} disabled={isCreating}>
                  <UserPlus className="h-4 w-4 mr-2" />
                  Создать тестовых пользователей
                </Button>
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      {/* Информация о ролях */}
      <Card>
        <CardHeader>
          <CardTitle>Роли в системе</CardTitle>
          <CardDescription>
            Описание ролей и их возможностей
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Badge variant="default">Производитель</Badge>
                <span className="text-sm text-muted-foreground">producer@test.com</span>
              </div>
              <p className="text-sm">
                Создает продукты, лоты, сертификаты. Управляет продажами и получает доходы.
              </p>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Badge variant="secondary">Дистрибьютор</Badge>
                <span className="text-sm text-muted-foreground">distributor@test.com</span>
              </div>
              <p className="text-sm">
                Покупает товары, участвует в торгах, размещает ставки на лоты.
              </p>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Badge variant="outline">Инвестор</Badge>
                <span className="text-sm text-muted-foreground">investor@test.com</span>
              </div>
              <p className="text-sm">
                Инвестирует в лоты, отслеживает портфель, получает доходность.
              </p>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Badge variant="destructive">Администратор</Badge>
                <span className="text-sm text-muted-foreground">admin@test.com</span>
              </div>
              <p className="text-sm">
                Управляет системой, модерирует контент, настраивает параметры.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
