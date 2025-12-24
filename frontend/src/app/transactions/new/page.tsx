'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { MobileLayout } from '@/components/layouts/MobileLayout';
import { TransactionForm } from '@/components/transactions/TransactionForm';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

function TransactionFormWrapper() {
    const searchParams = useSearchParams();
    const type = searchParams.get('type') as 'INCOME' | 'EXPENSE' || 'EXPENSE';

    return <TransactionForm initialType={type} />;
}

export default function NewTransactionPage() {
  return (
    <MobileLayout>
      <Card>
        <CardHeader>
          <CardTitle>Nova Transação</CardTitle>
        </CardHeader>
        <CardContent>
             <Suspense fallback={<div>Carregando...</div>}>
                <TransactionFormWrapper />
             </Suspense>
        </CardContent>
      </Card>
    </MobileLayout>
  );
}
