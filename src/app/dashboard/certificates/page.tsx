'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { TableShimmer } from '@/components/ui/animated-skeleton';
import { EmptyState } from '@/components/ui/empty-state';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useApi } from '@/hooks/useApi';
import { useAuthStore } from '@/stores/authStore';
import { CertificateStatus, UserRole } from '@/types';
import { CERTIFICATE_STATUS_LABELS } from '@/enums/CertificateStatus';
import { 
  Search, 
  Filter, 
  Plus, 
  Eye, 
  Edit, 
  MoreHorizontal,
  Award,
  CheckCircle,
  XCircle,
  Clock,
  Calendar,
  Download
} from 'lucide-react';
import Link from 'next/link';

interface Certificate {
  _id: string;
  id?: string;
  title: string;
  certificateNumber: string;
  issuedBy: string;
  issueDate: Date;
  expiryDate: Date;
  status: CertificateStatus;
  documents: {
    original: string;
    thumbnail?: string;
  };
  verificationNotes?: string;
  verifiedBy?: string;
  verifiedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

interface CertificatesResponse {
  data: Certificate[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export default function CertificatesPage() {
  const { user } = useAuthStore();
  const { execute, isLoading } = useApi();
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<CertificateStatus | 'all'>('all');
  const [isTableLoading, setIsTableLoading] = useState(false);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  });

  const fetchCertificates = async (page = 1, search = '', status: CertificateStatus | 'all' = 'all', showTableLoader = false) => {
    try {
      if (showTableLoader) {
        setIsTableLoading(true);
      }
      
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '10',
        ...(search && { search }),
        ...(status !== 'all' && { status }),
      });

      const response = await execute(`/api/certificates?${params}`, { method: 'GET' });
      if (response && response.success) {
        const data = response.data as CertificatesResponse;
        setCertificates(data.data);
        setPagination(data.pagination);
      }
    } catch (error) {
      console.error('Failed to fetch certificates:', error);
    } finally {
      if (showTableLoader) {
        setIsTableLoading(false);
      }
    }
  };

  useEffect(() => {
    fetchCertificates();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchCertificates(1, searchQuery, statusFilter, true);
  };

  const handleStatusFilter = (status: CertificateStatus | 'all') => {
    setStatusFilter(status);
    fetchCertificates(1, searchQuery, status, true);
  };

  const handlePageChange = (newPage: number) => {
    fetchCertificates(newPage, searchQuery, statusFilter, true);
  };

  const getStatusBadge = (status: CertificateStatus) => {
    const statusConfig: Record<CertificateStatus, { label: string; variant: 'default' | 'secondary' | 'outline' | 'destructive'; icon: React.ElementType }> = {
      [CertificateStatus.PENDING]: { 
        label: CERTIFICATE_STATUS_LABELS[CertificateStatus.PENDING], 
        variant: 'outline' as const, 
        icon: Clock 
      },
      [CertificateStatus.APPROVED]: { 
        label: CERTIFICATE_STATUS_LABELS[CertificateStatus.APPROVED], 
        variant: 'default' as const, 
        icon: CheckCircle 
      },
      [CertificateStatus.REJECTED]: { 
        label: CERTIFICATE_STATUS_LABELS[CertificateStatus.REJECTED], 
        variant: 'destructive' as const, 
        icon: XCircle 
      },
    };

    const config = statusConfig[status];
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    );
  };

  const isExpiringSoon = (expiryDate: Date) => {
    const now = new Date();
    const expiry = new Date(expiryDate);
    const daysUntilExpiry = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return daysUntilExpiry <= 30 && daysUntilExpiry > 0;
  };

  const canManageCertificates = user?.role === UserRole.PRODUCER || user?.role === UserRole.ADMIN;

  if (isLoading && certificates.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <Skeleton className="h-8 w-48" />
            <Skeleton className="mt-2 h-4 w-96" />
          </div>
          <Skeleton className="h-10 w-32" />
        </div>
        
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-32" />
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={`certificate-skeleton-${i}`} className="flex items-center space-x-4">
                  <Skeleton className="h-12 w-12" />
                  <div className="space-y-2 flex-1">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Заголовок */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Сертификаты</h1>
          <p className="text-muted-foreground">
            Управляйте сертификатами продуктов
          </p>
          <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>Информация о модерации:</strong> Подтверждение сертификата занимает от 1 до 3 рабочих дней. 
            </p>
          </div>
        </div>
        {canManageCertificates && (
          <Button asChild>
            <Link href="/dashboard/certificates/create">
              <Plus className="mr-2 h-4 w-4" />
              Добавить сертификат
            </Link>
          </Button>
        )}
      </div>

      {/* Фильтры и поиск */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="h-5 w-5" />
            Сертификаты
          </CardTitle>
          <CardDescription>
            Всего сертификатов: {pagination.total}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 mb-6">
            <form onSubmit={handleSearch} className="flex items-center gap-2 flex-1">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Поиск по номеру сертификата или продукту..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Button type="submit">Поиск</Button>
            </form>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline">
                  <Filter className="mr-2 h-4 w-4" />
                  Статус
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={() => handleStatusFilter('all')}>
                  Все статусы
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleStatusFilter(CertificateStatus.APPROVED)}>
                  Одобренные
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleStatusFilter(CertificateStatus.PENDING)}>
                  На модерации
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleStatusFilter(CertificateStatus.REJECTED)}>
                  Отклоненные
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {certificates.length === 0 ? (
            <EmptyState
              icon={Award}
              title="Нет сертификатов"
              description="Здесь будут отображаться ваши сертификаты"
              action={canManageCertificates ? {
                label: "Добавить сертификат",
                onClick: () => window.location.href = '/dashboard/certificates/create'
              } : undefined}
              className="h-[400px] min-h-[400px]"
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Название</TableHead>
                  <TableHead>Номер сертификата</TableHead>
                  <TableHead>Выдан</TableHead>
                  <TableHead>Дата выдачи</TableHead>
                  <TableHead>Срок действия</TableHead>
                  <TableHead>Статус</TableHead>
                  <TableHead className="text-right">Действия</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isTableLoading ? (
                  <TableShimmer rows={5} columns={7} />
                ) : (
                  certificates.map((certificate, index) => (
                  <TableRow key={certificate._id || certificate.id || `certificate-${index}`}>
                    <TableCell>
                      <div className="font-medium">
                        {certificate.title}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">
                        {certificate.certificateNumber}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {certificate.issuedBy}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-sm">
                        <Calendar className="h-3 w-3" />
                        {new Date(certificate.issueDate).toLocaleDateString('ru-RU')}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-sm">
                        <Calendar className="h-3 w-3" />
                        <span className={isExpiringSoon(certificate.expiryDate) ? 'text-orange-600 font-medium' : ''}>
                          {new Date(certificate.expiryDate).toLocaleDateString('ru-RU')}
                        </span>
                        {isExpiringSoon(certificate.expiryDate) && (
                          <Badge variant="outline" className="ml-1 text-orange-600">
                            Истекает
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(certificate.status)}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem asChild>
                            <Link href={`/dashboard/certificates/${certificate._id || certificate.id}`}>
                              <Eye className="mr-2 h-4 w-4" />
                              Просмотр
                            </Link>
                          </DropdownMenuItem>
                          {certificate.documents?.original && (
                            <DropdownMenuItem asChild>
                              <a href={certificate.documents.original} target="_blank" rel="noopener noreferrer">
                                <Download className="mr-2 h-4 w-4" />
                                Скачать
                              </a>
                            </DropdownMenuItem>
                          )}
                          {canManageCertificates && (
                            <>
                              <DropdownMenuItem asChild>
                                <Link href={`/dashboard/certificates/${certificate._id || certificate.id}/edit`}>
                                  <Edit className="mr-2 h-4 w-4" />
                                  Редактировать
                                </Link>
                              </DropdownMenuItem>
                            </>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
                )}
              </TableBody>
            </Table>
          )}

          {/* Пагинация */}
          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-center space-x-2 mt-6">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(pagination.page - 1)}
                disabled={pagination.page <= 1}
              >
                Предыдущая
              </Button>
              <div className="flex items-center space-x-1">
                {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                  const page = i + 1;
                  return (
                    <Button
                      key={page}
                      variant={pagination.page === page ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => handlePageChange(page)}
                    >
                      {page}
                    </Button>
                  );
                })}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(pagination.page + 1)}
                disabled={pagination.page >= pagination.totalPages}
              >
                Следующая
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
