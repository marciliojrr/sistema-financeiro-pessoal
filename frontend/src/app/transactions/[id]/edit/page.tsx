'use client';

import { Suspense, useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { MobileLayout } from '@/components/layouts/MobileLayout';
import { TransactionForm } from '@/components/transactions/TransactionForm';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { transactionsService, Transaction } from '@/services/transactionsService';
import { toast } from 'sonner';

function EditTransactionContent() {
    const params = useParams();
    const router = useRouter();
    const [transaction, setTransaction] = useState<Transaction | null>(null);
    const [loading, setLoading] = useState(true);

    const id = params.id as string;

    useEffect(() => {
        const fetchTransaction = async () => {
             try {
                const data = await transactionsService.getById(id);
                setTransaction(data);
             } catch (error) {
                console.error('Failed to fetch transaction', error);
                toast.error('Erro ao carregar transação');
                router.push('/transactions');
             } finally {
                setLoading(false);
             }
        };

        if (id) {
            fetchTransaction();
        }
    }, [id, router]);

    if (loading) return <div>Carregando...</div>;
    if (!transaction) return <div>Transação não encontrada</div>;

    return <TransactionForm initialData={transaction} transactionId={id} />;
}

export default function EditTransactionPage() {
  return (
    <MobileLayout>
      <Card>
        <CardHeader>
          <CardTitle>Editar Transação</CardTitle>
        </CardHeader>
        <CardContent>
             <Suspense fallback={<div>Carregando...</div>}>
                <EditTransactionContent />
             </Suspense>
        </CardContent>
      </Card>
    </MobileLayout>
  );
}
