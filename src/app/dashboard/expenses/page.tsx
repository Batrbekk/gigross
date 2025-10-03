'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useApi } from '@/hooks/useApi';
import { formatCurrency, CurrencyCode } from '@/lib/currency';
import { 
  DollarSign, 
  Search, 
  TrendingDown,
  TrendingUp,
  Calendar,
  Filter,
  Download,
  Plus,
  PieChart,
  BarChart3,
  CreditCard,
  Wallet,
  ShoppingCart,
  Truck,
  AlertCircle
} from 'lucide-react';
import { EmptyState } from '@/components/ui/empty-state';

interface Expense {
  _id: string;
  type: 'purchase' | 'shipping' | 'commission' | 'other';
  category: string;
  description: string;
  amount: number;
  currency: string;
  status: 'pending' | 'paid' | 'cancelled';
  paymentMethod: 'card' | 'bank_transfer' | 'cash' | 'wallet';
  relatedPurchase?: {
    _id: string;
    lotId: {
      _id: string;
      title: string;
    };
  };
  tags: string[];
  receiptUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export default function ExpensesPage() {
  const { execute, isLoading } = useApi();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  const [dateRange, setDateRange] = useState('all');

  const fetchExpenses = async () => {
    try {
      const params = new URLSearchParams();
      if (searchQuery) params.append('search', searchQuery);
      if (typeFilter !== 'all') params.append('type', typeFilter);
      if (statusFilter !== 'all') params.append('status', statusFilter);
      params.append('sort', sortBy);
      if (dateRange !== 'all') params.append('dateRange', dateRange);

      const response = await execute(`/api/expenses?${params.toString()}`, { method: 'GET' });
      if (response && response.success) {
        setExpenses(response.data.data || response.data);
      }
    } catch (error) {
      console.error('Error fetching expenses:', error);
    }
  };

  useEffect(() => {
    fetchExpenses();
  }, [searchQuery, typeFilter, statusFilter, sortBy, dateRange]);

  const getTypeBadge = (type: string) => {
    const typeConfig = {
      purchase: { label: 'Покупка', variant: 'default' as const, color: 'text-blue-600' },
      shipping: { label: 'Доставка', variant: 'secondary' as const, color: 'text-purple-600' },
      commission: { label: 'Комиссия', variant: 'outline' as const, color: 'text-orange-600' },
      other: { label: 'Прочее', variant: 'destructive' as const, color: 'text-gray-600' },
    };
    
    const config = typeConfig[type as keyof typeof typeConfig] || typeConfig.other;
    return <Badge variant={config.variant} className={config.color}>{config.label}</Badge>;
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { label: 'Ожидает', variant: 'secondary' as const },
      paid: { label: 'Оплачено', variant: 'default' as const },
      cancelled: { label: 'Отменено', variant: 'destructive' as const },
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const getPaymentMethodIcon = (method: string) => {
    switch (method) {
      case 'card':
        return <CreditCard className="h-4 w-4 text-blue-500" />;
      case 'bank_transfer':
        return <Wallet className="h-4 w-4 text-green-500" />;
      case 'cash':
        return <DollarSign className="h-4 w-4 text-yellow-500" />;
      case 'wallet':
        return <Wallet className="h-4 w-4 text-purple-500" />;
      default:
        return <DollarSign className="h-4 w-4 text-gray-500" />;
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'purchase':
        return <ShoppingCart className="h-4 w-4 text-blue-500" />;
      case 'shipping':
        return <Truck className="h-4 w-4 text-purple-500" />;
      case 'commission':
        return <PieChart className="h-4 w-4 text-orange-500" />;
      default:
        return <DollarSign className="h-4 w-4 text-gray-500" />;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getTotalExpenses = () => {
    return expenses.reduce((sum, expense) => sum + expense.amount, 0);
  };

  const getExpensesByType = () => {
    const byType = expenses.reduce((acc, expense) => {
      acc[expense.type] = (acc[expense.type] || 0) + expense.amount;
      return acc;
    }, {} as Record<string, number>);
    return byType;
  };

  const handleDownloadReceipt = (receiptUrl: string) => {
    // TODO: Реализовать скачивание чека
    console.log('Download receipt:', receiptUrl);
  };

  const handleAddExpense = () => {
    // TODO: Реализовать добавление расхода
    console.log('Add expense');
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <Skeleton className="h-8 w-64" />
          <Skeleton className="mt-2 h-4 w-96" />
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
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
          ))}
        </div>
      </div>
    );
  }

  const totalExpenses = getTotalExpenses();
  const expensesByType = getExpensesByType();

  return (
    <div className="space-y-6">
      {/* Заголовок */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Расходы</h1>
          <p className="text-muted-foreground">
            Отслеживайте и анализируйте ваши расходы
          </p>
        </div>
        <Button onClick={handleAddExpense} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Добавить расход
        </Button>
      </div>

      {/* Фильтры и поиск */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-1 items-center gap-2">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Поиск по расходам..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Тип" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Все типы</SelectItem>
              <SelectItem value="purchase">Покупки</SelectItem>
              <SelectItem value="shipping">Доставка</SelectItem>
              <SelectItem value="commission">Комиссии</SelectItem>
              <SelectItem value="other">Прочее</SelectItem>
            </SelectContent>
          </Select>
          
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Статус" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Все статусы</SelectItem>
              <SelectItem value="pending">Ожидают</SelectItem>
              <SelectItem value="paid">Оплачены</SelectItem>
              <SelectItem value="cancelled">Отменены</SelectItem>
            </SelectContent>
          </Select>
          
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Сортировка" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Новые</SelectItem>
              <SelectItem value="oldest">Старые</SelectItem>
              <SelectItem value="amount_high">Сумма ↓</SelectItem>
              <SelectItem value="amount_low">Сумма ↑</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Статистика */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Общие расходы</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalExpenses, 'KZT')}</div>
            <p className="text-xs text-muted-foreground">
              {expenses.length} операций
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Покупки</CardTitle>
            <ShoppingCart className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {formatCurrency(expensesByType.purchase || 0, 'KZT')}
            </div>
            <p className="text-xs text-muted-foreground">
              {expenses.filter(e => e.type === 'purchase').length} операций
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Доставка</CardTitle>
            <Truck className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              {formatCurrency(expensesByType.shipping || 0, 'KZT')}
            </div>
            <p className="text-xs text-muted-foreground">
              {expenses.filter(e => e.type === 'shipping').length} операций
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Комиссии</CardTitle>
            <PieChart className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {formatCurrency(expensesByType.commission || 0, 'KZT')}
            </div>
            <p className="text-xs text-muted-foreground">
              {expenses.filter(e => e.type === 'commission').length} операций
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Список расходов */}
      {expenses.length === 0 ? (
        <EmptyState
          icon={DollarSign}
          title="Расходы не найдены"
          description="У вас пока нет расходов. Добавьте первый расход для отслеживания!"
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {expenses.map((expense) => (
            <Card key={expense._id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-1 flex-1">
                    <CardTitle className="text-lg line-clamp-2">
                      {expense.description}
                    </CardTitle>
                    <CardDescription className="flex items-center gap-2">
                      {getTypeIcon(expense.type)}
                      <span>{expense.category}</span>
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    {getTypeBadge(expense.type)}
                    {getStatusBadge(expense.status)}
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                {/* Сумма */}
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Сумма:</span>
                  <span className="text-xl font-bold text-red-600">
                    {formatCurrency(expense.amount, expense.currency as CurrencyCode)}
                  </span>
                </div>

                {/* Связанная покупка */}
                {expense.relatedPurchase && (
                  <div className="p-3 bg-blue-50 rounded-lg">
                    <div className="text-sm text-blue-700">
                      Связанная покупка:
                    </div>
                    <div className="text-xs text-blue-600 mt-1 line-clamp-2">
                      {expense.relatedPurchase.lotId.title}
                    </div>
                  </div>
                )}

                {/* Способ оплаты */}
                <div className="flex items-center gap-2 text-sm">
                  {getPaymentMethodIcon(expense.paymentMethod)}
                  <span className="text-muted-foreground">Способ оплаты:</span>
                  <span className="font-medium capitalize">
                    {expense.paymentMethod.replace('_', ' ')}
                  </span>
                </div>

                {/* Теги */}
                {expense.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {expense.tags.map((tag, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                )}

                {/* Даты */}
                <div className="space-y-1 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    <span>Создан: {formatDate(expense.createdAt)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    <span>Обновлен: {formatDate(expense.updatedAt)}</span>
                  </div>
                </div>

                {/* Действия */}
                <div className="pt-2 border-t space-y-2">
                  {expense.receiptUrl && (
                    <Button 
                      variant="outline" 
                      size="sm"
                      className="w-full"
                      onClick={() => handleDownloadReceipt(expense.receiptUrl!)}
                    >
                      <Download className="h-4 w-4 mr-1" />
                      Скачать чек
                    </Button>
                  )}
                  
                  {expense.relatedPurchase && (
                    <Button 
                      variant="outline" 
                      className="w-full"
                      onClick={() => window.open(`/dashboard/lots/${expense.relatedPurchase!.lotId._id}`, '_blank')}
                    >
                      Посмотреть покупку
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
