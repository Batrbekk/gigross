'use client';

import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Edit } from 'lucide-react';

export default function LotEditPage() {
  const params = useParams();
  const router = useRouter();
  const lotId = params.id as string;

  return (
    <div className="space-y-6">
      {/* Заголовок */}
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Редактировать лот</h1>
          <p className="text-muted-foreground">
            ID лота: {lotId}
          </p>
        </div>
      </div>

      {/* Заглушка */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
            <Edit className="h-5 w-5" />
            Форма редактирования
            </CardTitle>
            <CardDescription>
            Эта страница находится в разработке
            </CardDescription>
            </CardHeader>
            <CardContent>
          <div className="text-center py-8">
            <Edit className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Форма редактирования лота</h3>
            <p className="text-muted-foreground mb-4">
              Здесь будет форма для редактирования лота с полями для всех свойств аукциона
            </p>
            <Button onClick={() => router.back()}>
              Вернуться к просмотру
            </Button>
              </div>
            </CardContent>
          </Card>
    </div>
  );
}